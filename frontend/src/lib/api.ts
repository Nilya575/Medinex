const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export async function extractDocument(payload: {
  signed_url: string
  doc_type: string
  document_id: string
  patient_id: string
}): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${BACKEND_URL}/documents/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Extraction failed')
  }
  return response.json()
}

export async function generateSummary(payload: {
  patient_id: string
  doctor_id: string
  doctor_specialty: string
}): Promise<{ summary: string }> {
  const response = await fetch(`${BACKEND_URL}/summaries/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Summary generation failed')
  }
  return response.json()
}
