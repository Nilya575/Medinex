"""
Document extraction router — POST /documents/extract

Flow:
1. Download file from Supabase signed URL
2. Convert PDF first page to image if needed (using pypdf + Pillow)
3. Send to Gemini 2.5 Flash with structured extraction prompt
4. Save extracted_data to medical_documents
5. Update processing_status to PROCESSED
6. Merge into ehr_master
7. Return success
"""
import json
import io
import base64
import logging
from typing import Optional

import httpx
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from config import GEMINI_API_KEY
from supabase_client import supabase_admin

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()


class ExtractRequest(BaseModel):
    signed_url: str
    doc_type: str
    document_id: str
    patient_id: str


EXTRACTION_PROMPT = """You are a medical document analysis AI. Extract structured data from this medical document.

Document type: {doc_type}

Return ONLY a valid JSON object with the following structure (omit fields that are not present):
{{
  "document_date": "YYYY-MM-DD or null",
  "patient_name": "string or null",
  "doctor_name": "string or null",
  "hospital": "string or null",
  "diagnosis": ["list of diagnoses"],
  "medications": [
    {{"name": "drug name", "dose": "dose", "frequency": "frequency", "duration": "duration"}}
  ],
  "lab_results": [
    {{"test": "test name", "value": "value", "unit": "unit", "reference_range": "range", "status": "normal/abnormal/critical"}}
  ],
  "imaging_findings": ["list of findings"],
  "allergies_mentioned": ["list"],
  "chronic_conditions_mentioned": ["list"],
  "vaccinations": ["list of vaccines"],
  "summary": "Brief 2-3 sentence plain-English summary of this document",
  "key_alerts": ["List of any critical findings that need immediate attention"]
}}

Be precise and extract only what is explicitly stated in the document. Return valid JSON only."""


async def process_document(request: ExtractRequest):
    """Background task to process a document with Gemini AI"""
    doc_id = request.document_id
    print(f"EXTRACT REQUEST RECEIVED: {doc_id}")

    try:
        # Update status to PROCESSING
        supabase_admin.table("medical_documents").update({
            "processing_status": "PROCESSING"
        }).eq("id", doc_id).execute()

        # Download file
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(request.signed_url)
            response.raise_for_status()
            file_bytes = response.content
            content_type = response.headers.get("content-type", "application/octet-stream")

        # Prepare image for Gemini
        if "pdf" in content_type or request.signed_url.lower().endswith(".pdf"):
            # Convert first page of PDF to PNG using pypdf
            try:
                from pypdf import PdfReader
                from PIL import Image as PILImage

                reader = PdfReader(io.BytesIO(file_bytes))
                if len(reader.pages) > 0:
                    # Extract page as image via pdf2image-style approach
                    # Since we don't have poppler, send as raw bytes to Gemini's PDF support
                    image_data = {
                        "mime_type": "application/pdf",
                        "data": base64.b64encode(file_bytes).decode()
                    }
                else:
                    raise ValueError("Empty PDF")
            except Exception:
                image_data = {
                    "mime_type": "application/pdf",
                    "data": base64.b64encode(file_bytes).decode()
                }
        else:
            # Image file
            image_data = {
                "mime_type": content_type if content_type.startswith("image/") else "image/jpeg",
                "data": base64.b64encode(file_bytes).decode()
            }

        # Call Gemini
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = EXTRACTION_PROMPT.format(doc_type=request.doc_type)

        gemini_response = model.generate_content([
            prompt,
            {"mime_type": image_data["mime_type"], "data": image_data["data"]}
        ])

        response_text = gemini_response.text.strip()

        # Parse JSON
        # Strip markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        extracted_data = json.loads(response_text)

        # Save to medical_documents
        supabase_admin.table("medical_documents").update({
            "extracted_data": extracted_data,
            "processing_status": "PROCESSED"
        }).eq("id", doc_id).execute()

        # Merge into ehr_master
        _merge_ehr_master(request.patient_id, extracted_data)

        logger.info(f"Document {doc_id} processed successfully")

    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {e}")
        print(f"EXTRACTION ERROR: {str(e)}")
        supabase_admin.table("medical_documents").update({
            "processing_status": "FAILED"
        }).eq("id", doc_id).execute()


def _merge_ehr_master(patient_id: str, extracted: dict):
    """Merge extracted document data into the patient's ehr_master record"""
    try:
        result = supabase_admin.table("ehr_master").select("*").eq("patient_id", patient_id).execute()
        existing = result.data[0] if result.data else None

        def merge_lists(old: list, new: list) -> list:
            combined = list(set((old or []) + (new or [])))
            return [c for c in combined if c]

        if existing:
            update_data = {
                "allergies": merge_lists(
                    existing.get("allergies", []),
                    extracted.get("allergies_mentioned", [])
                ),
                "chronic_conditions": merge_lists(
                    existing.get("chronic_conditions", []),
                    extracted.get("chronic_conditions_mentioned", [])
                ),
                "immunizations": merge_lists(
                    existing.get("immunizations", []),
                    extracted.get("vaccinations", [])
                ),
                "imaging_findings": merge_lists(
                    existing.get("imaging_findings", []),
                    extracted.get("imaging_findings", [])
                ),
                "lab_highlights": {
                    **(existing.get("lab_highlights") or {}),
                    **{r["test"]: r for r in extracted.get("lab_results", []) if "test" in r}
                },
                "last_updated": "now()",
            }
            supabase_admin.table("ehr_master").update(update_data).eq("patient_id", patient_id).execute()
        else:
            insert_data = {
                "patient_id": patient_id,
                "allergies": extracted.get("allergies_mentioned", []),
                "chronic_conditions": extracted.get("chronic_conditions_mentioned", []),
                "immunizations": extracted.get("vaccinations", []),
                "imaging_findings": extracted.get("imaging_findings", []),
                "lab_highlights": {r["test"]: r for r in extracted.get("lab_results", []) if "test" in r},
            }
            supabase_admin.table("ehr_master").insert(insert_data).execute()
    except Exception as e:
        logger.error(f"Error merging EHR master for {patient_id}: {e}")


@router.post("/extract")
async def extract_document(request: ExtractRequest, background_tasks: BackgroundTasks):
    """
    Trigger AI extraction for a medical document.
    Processing happens in background; returns immediately.
    """
    background_tasks.add_task(process_document, request)
    return {"success": True, "message": "Document processing started", "document_id": request.document_id}
