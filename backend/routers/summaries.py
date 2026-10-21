# """
# Summaries router — POST /summaries/generate

# Flow:
# 1. Fetch patient profile (form data: allergies, conditions, meds, family history, etc.)
# 2. Fetch EHR master (aggregated from documents)
# 3. Fetch active prescriptions
# 4. If NO prescriptions → use profile form data as the health baseline
# 5. Call Gemini 2.5 Flash with full context (form data + prescriptions + EHR)
# 6. Parse response and upsert to master_summaries
# """
# import json
# import logging
# from datetime import date

# from google import genai
# from google.genai import types
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel

# from config import GEMINI_API_KEY
# from supabase_client import supabase_admin

# logger = logging.getLogger(__name__)
# gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# router = APIRouter()


# class SummaryRequest(BaseModel):
#     patient_id: str
#     doctor_id: str
#     doctor_specialty: str


# SUMMARY_PROMPT = """You are a clinical AI assistant. Generate a structured medical summary for a doctor.

# Doctor's specialty: {specialty}

# Patient Medical Context:
# {context}

# {prescription_note}

# Generate a comprehensive, clinically relevant summary tailored for a {specialty} specialist.
# Return ONLY a valid JSON object with this structure:
# {{
#   "summary_text": "Detailed 3-5 paragraph clinical narrative summarizing the patient's health status, relevant history, current medications, and important findings. If based only on self-reported profile data (no doctor prescriptions yet), clearly note this.",
#   "key_conditions": ["List of primary active conditions (from profile self-report and/or prescriptions)"],
#   "active_medications": ["Current medications with doses if known"],
#   "alert_flags": ["Any urgent clinical alerts, drug interactions, abnormal values, or critical findings the doctor must know about"]
# }}

# Be concise, clinically accurate, and highlight information most relevant to a {specialty} specialist.
# Return valid JSON only."""


# def _calc_age(dob_str: str) -> int | None:
#     try:
#         dob = date.fromisoformat(dob_str)
#         return (date.today() - dob).days // 365
#     except Exception:
#         return None


# @router.post("/generate")
# async def generate_summary(request: SummaryRequest):
#     """Generate an AI health summary for a patient-doctor pair"""
#     patient_id = request.patient_id
#     doctor_id = request.doctor_id

#     try:
#         # ── 1. Fetch base profile ──────────────────────────────────────────────
#         profile_res = supabase_admin.table("profiles").select("full_name, city, state").eq("id", patient_id).single().execute()
#         profile = profile_res.data or {}

#         # ── 2. Fetch patient health profile (form data) ────────────────────────
#         pp_res = supabase_admin.table("patient_profiles").select("*").eq("profile_id", patient_id).single().execute()
#         pp = pp_res.data or {}

#         age = _calc_age(pp.get("date_of_birth", "")) if pp.get("date_of_birth") else None

#         # ── 3. Fetch EHR master (aggregated from AI-processed documents) ────────
#         ehr_res = supabase_admin.table("ehr_master").select("*").eq("patient_id", patient_id).execute()
#         ehr = ehr_res.data[0] if ehr_res.data else {}

#         # ── 4. Fetch active prescriptions ──────────────────────────────────────
#         rx_res = (
#             supabase_admin.table("prescriptions")
#             .select("diagnosis, medications, notes, follow_up_date, created_at")
#             .eq("patient_id", patient_id)
#             .eq("is_active", True)
#             .order("created_at", desc=True)
#             .limit(10)
#             .execute()
#         )
#         rxs = rx_res.data or []
#         has_prescriptions = len(rxs) > 0

#         # ── 5. Fetch recent processed document summaries ────────────────────────
#         doc_res = (
#             supabase_admin.table("medical_documents")
#             .select("document_name, document_type, extracted_data")
#             .eq("patient_id", patient_id)
#             .eq("processing_status", "PROCESSED")
#             .order("created_at", desc=True)
#             .limit(5)
#             .execute()
#         )
#         docs = doc_res.data or []

#         # ── 6. Build context ────────────────────────────────────────────────────
#         context_parts = [
#             "═══ PATIENT INFORMATION ═══",
#             f"Name:         {profile.get('full_name', 'Unknown')}",
#             f"Age:          {age} years" if age else "Age:          Unknown",
#             f"Gender:       {pp.get('gender', 'Not specified')}",
#             f"Blood Group:  {pp.get('blood_group', 'Not specified')}",
#             f"Location:     {', '.join(filter(None, [profile.get('city'), profile.get('state')])) or 'Not specified'}",
#         ]

#         if pp.get("height_cm") or pp.get("weight_kg"):
#             bmi = None
#             if pp.get("height_cm") and pp.get("weight_kg"):
#                 h_m = float(pp["height_cm"]) / 100
#                 bmi = round(float(pp["weight_kg"]) / (h_m * h_m), 1)
#             context_parts.append(
#                 f"Vitals:       Height {pp.get('height_cm', '?')} cm, Weight {pp.get('weight_kg', '?')} kg"
#                 + (f", BMI {bmi}" if bmi else "")
#             )

#         context_parts.append("")
#         context_parts.append("═══ SELF-REPORTED HEALTH DATA (from patient registration & profile) ═══")

#         allergies = list(set(
#             (pp.get("allergies") or []) +
#             (ehr.get("allergies") or [])
#         ))
#         context_parts.append(f"Allergies:             {', '.join(allergies) if allergies else 'None reported'}")

#         chronic = list(set(
#             (pp.get("chronic_conditions") or []) +
#             (ehr.get("chronic_conditions") or [])
#         ))
#         context_parts.append(f"Chronic Conditions:    {', '.join(chronic) if chronic else 'None reported'}")

#         profile_meds = pp.get("current_medications") or []
#         context_parts.append(f"Self-reported Meds:    {', '.join(profile_meds) if profile_meds else 'None reported'}")

#         if pp.get("family_history"):
#             context_parts.append(f"Family History:        {pp['family_history']}")

#         immunizations = ehr.get("immunizations") or []
#         if immunizations:
#             context_parts.append(f"Immunizations:         {', '.join(immunizations)}")

#         if has_prescriptions:
#             context_parts.append("")
#             context_parts.append("═══ ACTIVE PRESCRIPTIONS (from doctors) ═══")
#             for i, rx in enumerate(rxs, 1):
#                 meds = rx.get("medications") or []
#                 med_list = "; ".join(
#                     f"{m.get('drug_name', '')} {m.get('strength', '')} {m.get('dosage', '')} {m.get('frequency', '')}".strip()
#                     for m in meds if m.get("drug_name")
#                 )
#                 context_parts.append(f"Prescription {i}:")
#                 context_parts.append(f"  Diagnosis:   {rx.get('diagnosis', 'Not specified')}")
#                 context_parts.append(f"  Medications: {med_list or 'None'}")
#                 if rx.get("notes"):
#                     context_parts.append(f"  Notes:       {rx['notes']}")
#                 if rx.get("follow_up_date"):
#                     context_parts.append(f"  Follow-up:   {rx['follow_up_date']}")

#         lab_highlights = ehr.get("lab_highlights") or {}
#         if lab_highlights:
#             context_parts.append("")
#             context_parts.append("═══ RECENT LAB RESULTS (from AI-processed documents) ═══")
#             for test, data in lab_highlights.items():
#                 if isinstance(data, dict):
#                     status = data.get("status", "")
#                     context_parts.append(
#                         f"  {test}: {data.get('value', '')} {data.get('unit', '')} "
#                         f"[ref: {data.get('reference_range', '?')}] → {status.upper() if status else '?'}"
#                     )

#         if docs:
#             context_parts.append("")
#             context_parts.append("═══ RECENT MEDICAL DOCUMENTS (AI-extracted) ═══")
#             for doc in docs:
#                 ed = doc.get("extracted_data") or {}
#                 if ed.get("summary"):
#                     context_parts.append(f"  [{doc.get('document_type', 'doc')}] {doc.get('document_name', '')}: {ed['summary']}")

#         context = "\n".join(context_parts)

#         prescription_note = (
#             "NOTE: No doctor prescriptions exist yet. Base the summary primarily on the patient's self-reported health profile data. "
#             "Clearly indicate that this summary reflects patient-reported information and not verified clinical records."
#             if not has_prescriptions
#             else "Both self-reported profile data AND active prescriptions are available. Use all of this data."
#         )

#         # ── 7. Call Gemini 2.5 Flash ───────────────────────────────────────────
#         prompt = SUMMARY_PROMPT.format(
#             specialty=request.doctor_specialty,
#             context=context,
#             prescription_note=prescription_note,
#         )

#         response = gemini_client.models.generate_content(
#             model="gemini-2.5-flash",
#             contents=prompt
#         )
#         response_text = response.text.strip()

#         if "```json" in response_text:
#             response_text = response_text.split("```json")[1].split("```")[0].strip()
#         elif response_text.startswith("```"):
#             lines = response_text.split("\n")
#             response_text = "\n".join(lines[1:-1])

#         summary_data = json.loads(response_text)

#         # ── 8. Upsert to master_summaries ───────────────────────────────────────
#         existing = (
#             supabase_admin.table("master_summaries")
#             .select("id")
#             .eq("patient_id", patient_id)
#             .eq("doctor_id", doctor_id)
#             .execute()
#         )

#         record = {
#             "summary_text":       summary_data.get("summary_text", ""),
#             "key_conditions":     summary_data.get("key_conditions", []),
#             "active_medications": summary_data.get("active_medications", []),
#             "alert_flags":        summary_data.get("alert_flags", []),
#             "generated_at":       "now()",
#         }

#         if existing.data:
#             supabase_admin.table("master_summaries").update(record).eq("patient_id", patient_id).eq("doctor_id", doctor_id).execute()
#         else:
#             supabase_admin.table("master_summaries").insert({
#                 "patient_id": patient_id,
#                 "doctor_id":  doctor_id,
#                 **record,
#             }).execute()

#         return {"summary": summary_data.get("summary_text", ""), "data": summary_data}

#     except json.JSONDecodeError as e:
#         raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response as JSON: {e}")
#     except Exception as e:
#         logger.error(f"Error generating summary: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

"""
Summaries router — POST /summaries/generate

Flow:
1. Fetch patient profile (form data: allergies, conditions, meds, family history, etc.)
2. Fetch EHR master (aggregated from documents)
3. Fetch active prescriptions
4. If NO prescriptions → use profile form data as the health baseline
5. Call Gemini 2.5 Flash with full context (form data + prescriptions + EHR)
6. Parse response and upsert to master_summaries
"""
import json
import logging
from datetime import date, datetime, timedelta

from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import GEMINI_API_KEY
from supabase_client import supabase_admin

logger = logging.getLogger(__name__)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

router = APIRouter()


class SummaryRequest(BaseModel):
    patient_id: str
    doctor_id: str
    doctor_specialty: str


# ── Medication filtering keywords ─────────────────────────────────────────────
LIFELONG_KEYWORDS = [
    'metformin', 'insulin', 'glipizide', 'glimepiride', 'sitagliptin',    # diabetes
    'amlodipine', 'atenolol', 'losartan', 'telmisartan', 'ramipril',       # BP
    'aspirin', 'clopidogrel', 'warfarin', 'rivaroxaban', 'apixaban',       # cardiac
    'levothyroxine', 'thyroxine', 'methimazole', 'carbimazole',            # thyroid
    'lithium', 'valproate', 'sertraline', 'fluoxetine', 'escitalopram',    # psych
    'olanzapine', 'risperidone', 'quetiapine', 'clonazepam',               # psych
    'phenytoin', 'levetiracetam', 'carbamazepine', 'lamotrigine',          # seizure
    'salbutamol', 'budesonide', 'montelukast', 'tiotropium',               # asthma/COPD
    'atorvastatin', 'rosuvastatin', 'simvastatin',                         # statins
    'methotrexate', 'hydroxychloroquine', 'sulfasalazine',                 # autoimmune
]

SHORT_COURSE_KEYWORDS = [
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',        # antibiotics
    'cefixime', 'cefpodoxime', 'levofloxacin', 'metronidazole',
    'ibuprofen', 'diclofenac', 'nimesulide', 'naproxen', 'aceclofenac',   # painkillers
    'fluconazole', 'clotrimazole', 'itraconazole',                         # antifungals
    'prednisolone', 'dexamethasone', 'methylprednisolone',                 # short steroids
    'cetirizine', 'levocetirizine', 'loratadine', 'fexofenadine',         # antihistamines
    'ondansetron', 'domperidone', 'metoclopramide',                        # antiemetics
]


def is_medication_relevant(med_name: str, prescription_date: str) -> bool:
    """Returns True if medication should be included in summary"""
    med_lower = med_name.lower()

    # Always include lifelong medications regardless of date
    if any(kw in med_lower for kw in LIFELONG_KEYWORDS):
        return True

    try:
        rx_date = datetime.fromisoformat(prescription_date.replace("Z", "+00:00"))
        six_months_ago = datetime.now(rx_date.tzinfo) - timedelta(days=180)

        # Recent prescription (within 6 months) — include
        if rx_date >= six_months_ago:
            return True

        # Old short-course medication — exclude
        if any(kw in med_lower for kw in SHORT_COURSE_KEYWORDS):
            return False

        # Old but not clearly short-course — include
        return True

    except Exception:
        return True  # if date parsing fails, include by default


SUMMARY_PROMPT = """You are a senior clinical AI assistant helping a {specialty} specialist prepare for a patient consultation.

CRITICAL RULES:
1. SPECIALTY FILTER: Only include information relevant to {specialty}. Ignore everything else.
2. A psychiatrist does NOT need blood type, imaging, or surgical history unless directly psychiatric.
3. A gynecologist does NOT need cardiac history unless it affects pregnancy/hormones.
4. A cardiologist does NOT need vaccination records or minor skin conditions.
5. MEDICATIONS: Only include currently active or lifelong medications. Old short-course drugs (antibiotics, painkillers, antifungals) must be ignored.
6. DATE ANALYSIS: Documents are sorted newest first. Weight recent documents heavily.
7. FORMAT: Bullet points only. No paragraphs. Short, scannable, clinical.
8. A busy OPD doctor should understand everything in 30 seconds.

SPECIALTY FILTER GUIDE:
- Gynecologist: menstrual/hormonal history, PCOD/PCOS, pregnancy history, gynec prescriptions, relevant surgeries
- Psychiatrist: psychiatric diagnoses, active psych meds only, sleep/mood patterns, substance use, family psych history
- Cardiologist: BP readings, cardiac diagnoses, lipid profile, cardiac meds, ECG/echo findings, diabetes as risk factor
- General Physician: active complaints, current medications, chronic conditions, recent abnormal labs
- Orthopedic: musculoskeletal issues, recent imaging (X-ray/MRI), fractures, current pain management
- Dermatologist: skin conditions, current topical/systemic treatment, drug allergies/reactions
- Endocrinologist: diabetes, thyroid, hormonal disorders, active relevant labs (HbA1c, TSH), active meds
- Pediatrician: vaccinations, growth parameters, recent infections, age-appropriate concerns
(Apply same specialty logic for any specialty not listed above)

Doctor's Specialty: {specialty}

Patient Data (documents sorted newest first):
{context}

{prescription_note}

Return ONLY this exact JSON structure with bullet markdown inside strings:

{{
  "summary_text": "## 🩺 Patient Snapshot\\n\\n**Chief Concerns**\\n• [most relevant active issue for {specialty}]\\n• [second issue if exists — skip if nothing relevant]\\n\\n**Relevant History**\\n• [only history that matters for {specialty}]\\n• [chronic conditions relevant to specialty only]\\n\\n**Active Medications**\\n• [Drug + dose — only active/lifelong meds relevant to {specialty}]\\n\\n**⚠️ Watch Out**\\n• [Genuine urgent alert — drug interaction, critical value, contraindication]\\n• [Remove this entire section if nothing urgent]",

  "key_conditions": ["max 4 conditions relevant to {specialty} only"],

  "active_medications": ["Drug name + dose — active/lifelong only — max 5"],

  "alert_flags": ["Genuinely urgent alerts only — return empty list if nothing critical"]
}}

STRICT RULES FOR OUTPUT:
- If a section has nothing relevant → skip that bullet entirely
- No data dumping, no filler sentences
- If based only on self-reported data (no prescriptions), add a single note: "⚠️ Based on patient self-report only — not verified clinically"
- Return valid JSON only"""


def _calc_age(dob_str: str) -> int | None:
    try:
        dob = date.fromisoformat(dob_str)
        return (date.today() - dob).days // 365
    except Exception:
        return None


@router.post("/generate")
async def generate_summary(request: SummaryRequest):
    """Generate an AI health summary for a patient-doctor pair"""
    patient_id = request.patient_id
    doctor_id = request.doctor_id

    try:
        # ── 1. Fetch base profile ──────────────────────────────────────────────
        profile_res = supabase_admin.table("profiles").select("full_name, city, state").eq("id", patient_id).single().execute()
        profile = profile_res.data or {}

        # ── 2. Fetch patient health profile (form data) ────────────────────────
        pp_res = supabase_admin.table("patient_profiles").select("*").eq("profile_id", patient_id).single().execute()
        pp = pp_res.data or {}

        age = _calc_age(pp.get("date_of_birth", "")) if pp.get("date_of_birth") else None

        # ── 3. Fetch EHR master ────────────────────────────────────────────────
        ehr_res = supabase_admin.table("ehr_master").select("*").eq("patient_id", patient_id).execute()
        ehr = ehr_res.data[0] if ehr_res.data else {}

        # ── 4. Fetch active prescriptions ──────────────────────────────────────
        rx_res = (
            supabase_admin.table("prescriptions")
            .select("diagnosis, medications, notes, follow_up_date, created_at")
            .eq("patient_id", patient_id)
            .eq("is_active", True)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        rxs = rx_res.data or []
        has_prescriptions = len(rxs) > 0

        # ── 5. Fetch processed documents — newest first ────────────────────────
        doc_res = (
            supabase_admin.table("medical_documents")
            .select("document_name, document_type, extracted_data, upload_date")
            .eq("patient_id", patient_id)
            .eq("processing_status", "PROCESSED")
            .order("upload_date", desc=True)
            .limit(10)
            .execute()
        )
        docs = doc_res.data or []

        # ── 6. Build context ────────────────────────────────────────────────────
        context_parts = [
            "═══ PATIENT INFORMATION ═══",
            f"Name:     {profile.get('full_name', 'Unknown')}",
            f"Age:      {age} years" if age else "Age:      Unknown",
            f"Gender:   {pp.get('gender', 'Not specified')}",
        ]

        if pp.get("height_cm") or pp.get("weight_kg"):
            bmi = None
            if pp.get("height_cm") and pp.get("weight_kg"):
                h_m = float(pp["height_cm"]) / 100
                bmi = round(float(pp["weight_kg"]) / (h_m * h_m), 1)
            context_parts.append(
                f"Vitals:   Height {pp.get('height_cm', '?')} cm, Weight {pp.get('weight_kg', '?')} kg"
                + (f", BMI {bmi}" if bmi else "")
            )

        context_parts.append("")
        context_parts.append("═══ SELF-REPORTED HEALTH DATA ═══")

        allergies = list(set((pp.get("allergies") or []) + (ehr.get("allergies") or [])))
        if allergies:
            context_parts.append(f"Allergies:          {', '.join(allergies)}")

        chronic = list(set((pp.get("chronic_conditions") or []) + (ehr.get("chronic_conditions") or [])))
        if chronic:
            context_parts.append(f"Chronic Conditions: {', '.join(chronic)}")

        profile_meds = pp.get("current_medications") or []
        if profile_meds:
            context_parts.append(f"Self-reported Meds: {', '.join(profile_meds)}")

        if pp.get("family_history"):
            context_parts.append(f"Family History:     {pp['family_history']}")

        # ── Prescriptions — with medication relevance filtering ────────────────
        if has_prescriptions:
            context_parts.append("")
            context_parts.append("═══ PRESCRIPTIONS (newest first) ═══")
            for i, rx in enumerate(rxs, 1):
                meds = rx.get("medications") or []
                rx_date = rx.get("created_at", "")

                try:
                    dt = datetime.fromisoformat(rx_date.replace("Z", "+00:00"))
                    date_str = dt.strftime("%b %Y")
                except Exception:
                    date_str = rx_date[:7] if rx_date else "Unknown"

                # Filter — remove old short-course drugs
                relevant_meds = []
                for m in meds:
                    drug_name = m.get("drug_name", "")
                    if drug_name and is_medication_relevant(drug_name, rx_date):
                        relevant_meds.append(
                            f"{drug_name} {m.get('strength', '')} {m.get('dosage', '')} {m.get('frequency', '')}".strip()
                        )

                if not relevant_meds and not rx.get("diagnosis"):
                    continue

                context_parts.append(f"Prescription {i} [{date_str}]:")
                context_parts.append(f"  Diagnosis:   {rx.get('diagnosis', 'Not specified')}")
                if relevant_meds:
                    context_parts.append(f"  Active Meds: {'; '.join(relevant_meds)}")
                if rx.get("follow_up_date"):
                    context_parts.append(f"  Follow-up:   {rx['follow_up_date']}")

        # ── Lab highlights ─────────────────────────────────────────────────────
        lab_highlights = ehr.get("lab_highlights") or {}
        if lab_highlights:
            context_parts.append("")
            context_parts.append("═══ RECENT LAB RESULTS ═══")
            for test, data in lab_highlights.items():
                if isinstance(data, dict):
                    status = data.get("status", "")
                    context_parts.append(
                        f"  {test}: {data.get('value', '')} {data.get('unit', '')} "
                        f"[ref: {data.get('reference_range', '?')}] → {status.upper() if status else '?'}"
                    )

        # ── Documents — with date labels, newest first ─────────────────────────
        if docs:
            context_parts.append("")
            context_parts.append("═══ MEDICAL DOCUMENTS (newest first) ═══")
            for doc in docs:
                ed = doc.get("extracted_data") or {}
                upload_date = doc.get("upload_date", "")

                try:
                    dt = datetime.fromisoformat(upload_date.replace("Z", "+00:00"))
                    date_str = dt.strftime("%b %Y")
                except Exception:
                    date_str = upload_date[:7] if upload_date else "Unknown"

                doc_type = doc.get("document_type", "doc").upper()
                doc_name = doc.get("document_name", "")
                context_parts.append(f"[{doc_type} — {date_str}] {doc_name}")

                if ed.get("document_date"):
                    context_parts.append(f"  Doc Date:   {ed['document_date']}")
                if ed.get("diagnosis"):
                    diagnoses = ed["diagnosis"] if isinstance(ed["diagnosis"], list) else [ed["diagnosis"]]
                    if diagnoses:
                        context_parts.append(f"  Diagnosis:  {', '.join(str(d) for d in diagnoses)}")
                if ed.get("medications"):
                    med_names = [
                        m.get("name", "") or m.get("drug_name", "")
                        for m in ed["medications"] if isinstance(m, dict)
                    ]
                    med_names = [m for m in med_names if m]
                    if med_names:
                        context_parts.append(f"  Meds:       {', '.join(med_names)}")
                if ed.get("summary"):
                    context_parts.append(f"  Summary:    {ed['summary']}")
                if ed.get("lab_results"):
                    abnormal = [
                        r for r in ed["lab_results"]
                        if isinstance(r, dict) and r.get("status") in ["abnormal", "critical"]
                    ]
                    if abnormal:
                        ab_str = ", ".join(f"{r.get('test')}: {r.get('value')}" for r in abnormal)
                        context_parts.append(f"  ⚠️ Abnormal: {ab_str}")
                if ed.get("key_alerts"):
                    context_parts.append(f"  ⚠️ Alerts:   {', '.join(ed['key_alerts'])}")

                context_parts.append("")

        context = "\n".join(context_parts)

        prescription_note = (
            "NOTE: No doctor prescriptions exist yet. Base summary on self-reported profile data only. "
            "Mark clearly that this is patient self-reported, not clinically verified."
            if not has_prescriptions
            else "Both self-reported profile data AND active prescriptions available. Use all relevant data."
        )

        # ── 7. Call Gemini 2.5 Flash ───────────────────────────────────────────
        prompt = SUMMARY_PROMPT.format(
            specialty=request.doctor_specialty,
            context=context,
            prescription_note=prescription_note,
        )

        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        response_text = response.text.strip()

        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

        summary_data = json.loads(response_text)

        # ── 8. Upsert to master_summaries ─────────────────────────────────────
        existing = (
            supabase_admin.table("master_summaries")
            .select("id")
            .eq("patient_id", patient_id)
            .eq("doctor_id", doctor_id)
            .execute()
        )

        record = {
            "summary_text":       summary_data.get("summary_text", ""),
            "key_conditions":     summary_data.get("key_conditions", []),
            "active_medications": summary_data.get("active_medications", []),
            "alert_flags":        summary_data.get("alert_flags", []),
            "generated_at":       "now()",
        }

        if existing.data:
            supabase_admin.table("master_summaries").update(record).eq("patient_id", patient_id).eq("doctor_id", doctor_id).execute()
        else:
            supabase_admin.table("master_summaries").insert({
                "patient_id": patient_id,
                "doctor_id":  doctor_id,
                **record,
            }).execute()

        return {"summary": summary_data.get("summary_text", ""), "data": summary_data}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response as JSON: {e}")
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))