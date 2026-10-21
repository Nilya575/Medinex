-- ============================================================
-- Medinex — Supabase Schema (FIXED ORDER)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES (no cross-table policies yet)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
  phone         TEXT,
  city          TEXT,
  state         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients can view doctor profiles (no connections reference needed)
CREATE POLICY "Patients can view doctor profiles" ON public.profiles
  FOR SELECT USING (role = 'doctor');


-- ─────────────────────────────────────────────────────────────
-- 2. PATIENT_PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  date_of_birth               DATE NOT NULL,
  gender                      TEXT,
  blood_group                 TEXT,
  height_cm                   NUMERIC(5,1),
  weight_kg                   NUMERIC(5,1),
  allergies                   TEXT[],
  chronic_conditions          TEXT[],
  current_medications         TEXT[],
  family_history              TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own patient profile" ON public.patient_profiles
  FOR ALL USING (auth.uid() = profile_id);


-- ─────────────────────────────────────────────────────────────
-- 3. DOCTOR_PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  license_number        TEXT NOT NULL,
  medical_council       TEXT NOT NULL,
  specialization        TEXT NOT NULL,
  sub_specialty         TEXT,
  hospital              TEXT,
  years_experience      INT,
  verification_status   TEXT NOT NULL DEFAULT 'VERIFIED'
                        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own doctor profile" ON public.doctor_profiles
  FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can view verified doctor profiles" ON public.doctor_profiles
  FOR SELECT USING (verification_status = 'VERIFIED');


-- ─────────────────────────────────────────────────────────────
-- 4. CONNECTIONS (created BEFORE any cross-table policies)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.connections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'PENDING'
              CHECK (status IN ('PENDING', 'ACTIVE', 'DECLINED', 'DISCONNECTED')),
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, doctor_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own connections" ON public.connections
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view and update own connections" ON public.connections
  FOR ALL USING (auth.uid() = doctor_id);


-- Helper function (connections table now exists)
CREATE OR REPLACE FUNCTION public.is_connected(p_doctor_id UUID, p_patient_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE doctor_id = p_doctor_id
      AND patient_id = p_patient_id
      AND status = 'ACTIVE'
  );
$$ LANGUAGE SQL SECURITY DEFINER;


-- NOW add the cross-table profile policy (connections exists now)
CREATE POLICY "Doctors can view connected patient profiles" ON public.profiles
  FOR SELECT USING (
    role = 'patient' AND
    public.is_connected(auth.uid(), id)
  );


-- ─────────────────────────────────────────────────────────────
-- 5. MEDICAL_DOCUMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_name     TEXT NOT NULL,
  document_type     TEXT NOT NULL
                    CHECK (document_type IN ('lab_report','prescription','imaging','discharge_summary','vaccination','insurance','other')),
  file_path         TEXT NOT NULL,
  file_size         BIGINT,
  mime_type         TEXT,
  processing_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (processing_status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
  extracted_data    JSONB,
  upload_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own documents" ON public.medical_documents
  FOR ALL USING (auth.uid() = patient_id);


-- ─────────────────────────────────────────────────────────────
-- 6. EHR_MASTER
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ehr_master (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  allergies           TEXT[],
  chronic_conditions  TEXT[],
  current_medications TEXT[],
  surgical_history    TEXT[],
  family_history      TEXT,
  immunizations       TEXT[],
  lab_highlights      JSONB,
  imaging_findings    TEXT[],
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ehr_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own EHR" ON public.ehr_master
  FOR ALL USING (auth.uid() = patient_id);


-- ─────────────────────────────────────────────────────────────
-- 7. PRESCRIPTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnosis       TEXT NOT NULL,
  medications     JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  follow_up_date  DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  version         INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read own prescriptions" ON public.prescriptions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can read prescriptions they wrote" ON public.prescriptions
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can write prescriptions to connected patients" ON public.prescriptions
  FOR INSERT WITH CHECK (
    auth.uid() = doctor_id AND
    public.is_connected(auth.uid(), patient_id)
  );

CREATE POLICY "Doctors can update their prescriptions" ON public.prescriptions
  FOR UPDATE USING (auth.uid() = doctor_id);


-- ─────────────────────────────────────────────────────────────
-- 8. MASTER_SUMMARIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.master_summaries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_text        TEXT NOT NULL,
  key_conditions      TEXT[],
  active_medications  TEXT[],
  alert_flags         TEXT[],
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, doctor_id)
);

ALTER TABLE public.master_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read summaries for connected patients" ON public.master_summaries
  FOR SELECT USING (
    auth.uid() = doctor_id AND
    public.is_connected(auth.uid(), patient_id)
  );

CREATE POLICY "Service role can manage summaries" ON public.master_summaries
  FOR ALL USING (TRUE);


-- ─────────────────────────────────────────────────────────────
-- TRIGGER: Auto-update updated_at on profiles
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
