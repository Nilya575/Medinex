import { useState, useEffect, createContext, useContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile, PatientProfile, DoctorProfile } from '../types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  patientProfile: PatientProfile | null
  doctorProfile: DoctorProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  switchRole: (role: 'patient' | 'doctor') => Promise<void>
  addSecondRole: (role: 'patient' | 'doctor', data: Record<string, unknown>) => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, session: null, profile: null,
  patientProfile: null, doctorProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  switchRole: async () => {},
  addSecondRole: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileData) return

      setProfile(profileData)

      // Always try fetching both sub-profiles — user may have both roles
      const [ppRes, dpRes] = await Promise.all([
        supabase.from('patient_profiles').select('*').eq('profile_id', userId).single(),
        supabase.from('doctor_profiles').select('*').eq('profile_id', userId).single(),
      ])

      setPatientProfile(ppRes.data ?? null)
      setDoctorProfile(dpRes.data ?? null)
    } catch {
      // ignore
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    // If the user visits login or register directly, sign them out to force fresh login
    const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register'
    
    if (isAuthRoute) {
      supabase.auth.signOut().then(() => setLoading(false))
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setProfile(null)
      setPatientProfile(null)
      setDoctorProfile(null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null); setSession(null); setProfile(null)
    setPatientProfile(null); setDoctorProfile(null)
  }

  /** Switch which role the user is currently viewing */
  const switchRole = async (role: 'patient' | 'doctor') => {
    if (!user || !profile) return
    await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', user.id)
    await refreshProfile()
  }

  /**
   * Add a second role profile to an existing user.
   * data: for patient → { date_of_birth, gender, blood_group, ... }
   *       for doctor  → { license_number, medical_council, specialization, ... }
   */
  const addSecondRole = async (role: 'patient' | 'doctor', data: Record<string, unknown>) => {
    if (!user || !profile) return

    if (role === 'patient') {
      const { error } = await supabase.from('patient_profiles').insert({ profile_id: user.id, ...data })
      if (error) throw error
      await supabase.from('profiles').update({
        has_patient_profile: true,
        role: 'patient',
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
    } else {
      const { error } = await supabase.from('doctor_profiles').insert({
        profile_id: user.id,
        verification_status: 'VERIFIED',
        ...data,
      })
      if (error) throw error
      await supabase.from('profiles').update({
        has_doctor_profile: true,
        role: 'doctor',
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
    }

    await refreshProfile()
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, patientProfile, doctorProfile,
      loading, signOut, refreshProfile, switchRole, addSecondRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
