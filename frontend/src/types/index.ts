// ─── Base User ──────────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'doctor'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole               // currently active/viewing role
  has_patient_profile: boolean // has a patient sub-profile
  has_doctor_profile: boolean  // has a doctor sub-profile
  phone?: string
  city?: string
  state?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface PatientProfile {
  id: string
  profile_id: string
  date_of_birth: string // ISO date, locked after insert
  gender?: string
  blood_group?: string
  height_cm?: number
  weight_kg?: number
  allergies?: string[]
  chronic_conditions?: string[]
  current_medications?: string[]
  family_history?: string
  created_at: string
}

// ─── Doctor ───────────────────────────────────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface DoctorProfile {
  id: string
  profile_id: string
  license_number: string
  medical_council: string
  specialization: string
  sub_specialty?: string
  hospital?: string
  years_experience?: number
  verification_status: VerificationStatus
  created_at: string
}

// ─── Medical Document ─────────────────────────────────────────────────────────
export type DocumentType =
  | 'lab_report'
  | 'prescription'
  | 'imaging'
  | 'discharge_summary'
  | 'vaccination'
  | 'insurance'
  | 'other'

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'

export interface MedicalDocument {
  id: string
  patient_id: string
  document_name: string
  document_type: DocumentType
  file_path: string
  file_size?: number
  mime_type?: string
  processing_status: ProcessingStatus
  extracted_data?: Record<string, unknown>
  upload_date: string
  created_at: string
}

// ─── Connection ───────────────────────────────────────────────────────────────
export type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'DISCONNECTED'

export interface Connection {
  id: string
  patient_id: string
  doctor_id: string
  status: ConnectionStatus
  message?: string
  created_at: string
  updated_at: string
  // Joined fields
  patient?: Profile
  doctor?: Profile & { doctor_profile?: DoctorProfile }
}

// ─── Prescription ─────────────────────────────────────────────────────────────
export interface Medication {
  drug_name: string
  strength: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  diagnosis: string
  medications: Medication[]
  notes?: string
  follow_up_date?: string
  is_active: boolean
  version: number
  created_at: string
  // Joined
  doctor?: Profile & { doctor_profile?: DoctorProfile }
}

// ─── EHR Master ───────────────────────────────────────────────────────────────
export interface EHRMaster {
  id: string
  patient_id: string
  allergies?: string[]
  chronic_conditions?: string[]
  current_medications?: string[]
  surgical_history?: string[]
  family_history?: string
  immunizations?: string[]
  lab_highlights?: Record<string, unknown>
  imaging_findings?: string[]
  last_updated: string
}

// ─── Master Summary ───────────────────────────────────────────────────────────
export interface MasterSummary {
  id: string
  patient_id: string
  doctor_id: string
  summary_text: string
  key_conditions?: string[]
  active_medications?: string[]
  alert_flags?: string[]
  generated_at: string
}
