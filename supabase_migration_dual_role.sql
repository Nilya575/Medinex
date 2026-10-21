-- ============================================================
-- Medinex — Migration: Dual-Role Support
-- Run this in Supabase SQL Editor AFTER the main schema
-- ============================================================

-- Add flags to track which sub-profiles a user has created
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_patient_profile BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_doctor_profile  BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing rows
UPDATE public.profiles SET has_patient_profile = TRUE WHERE role = 'patient';
UPDATE public.profiles SET has_doctor_profile  = TRUE WHERE role = 'doctor';

-- Allow doctor_profiles to exist for a user who is primarily a patient
-- (The UNIQUE constraint already ensures only ONE doctor_profile per profile_id)
-- No structural change needed — patient_profiles and doctor_profiles
-- are already keyed by profile_id which maps 1-to-1 with profiles.id

-- Allow doctors to also read their OWN patient_profile when they switch roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_profiles' 
      AND policyname = 'Users can read own patient profile as doctor'
  ) THEN
    CREATE POLICY "Users can read own patient profile as doctor"
      ON public.patient_profiles FOR SELECT
      USING (auth.uid() = profile_id);
  END IF;
END $$;

-- Allow doctors to also read their OWN doctor_profile when they switch roles  
-- (already covered by "Doctors manage own doctor profile" ALL policy)
