import asyncio
import sys
sys.path.append('c:\\Medinex_Modified\\backend')
from supabase_client import supabase_admin
from routers.documents import process_document, ExtractRequest

async def test():
    try:
        doc = supabase_admin.table('medical_documents').select('*').eq('id', '72993282-a7fa-4030-9592-8ff50d18095f').execute().data[0]
        signed = supabase_admin.storage.from_('medical-documents').create_signed_url(doc['file_path'], 3600)
        signed_url = signed['signedURL'] if isinstance(signed, dict) and 'signedURL' in signed else signed
        req = ExtractRequest(signed_url=signed_url, doc_type=doc['document_type'], document_id=doc['id'], patient_id=doc['patient_id'])
        await process_document(req)
    except Exception as e:
        print(f"TEST SCRIPT CAUGHT ERROR: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(test())
