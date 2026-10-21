import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, User, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

type Role = 'patient' | 'doctor'

export default function Register() {
  const navigate = useNavigate()
  const { profile: existingProfile, refreshProfile } = useAuth()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingProfile) {
      if (!existingProfile.has_patient_profile) setRole('patient')
      else if (!existingProfile.has_doctor_profile) setRole('doctor')
    }
  }, [existingProfile])

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '', city: '', state: '',
    // Patient
    dateOfBirth: '', bloodGroup: '', heightCm: '', weightKg: '',
    allergies: '', chronicConditions: '',
    // Doctor
    licenseNumber: '', medicalCouncil: '', specialization: '', subSpecialty: '', hospital: '', yearsExperience: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let userId = ''

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: `${form.firstName} ${form.lastName}`.trim(), role } },
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: form.email, password: form.password
            })
            if (signInError) {
              throw new Error('This email is already registered. If it is yours, please use the correct password to add a new profile.')
            }
            userId = signInData.user.id
          } else {
            throw authError
          }
        } else {
          if (!authData.user) throw new Error('Registration failed')
          userId = authData.user.id
        }
      }

      const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
      
      if (currentProfile) {
        if (role === 'patient' && currentProfile.has_patient_profile) throw new Error('You already have a patient account.')
        if (role === 'doctor' && currentProfile.has_doctor_profile) throw new Error('You already have a doctor account.')
        
        await supabase.from('profiles').update({
          role,
          has_patient_profile: role === 'patient' ? true : currentProfile.has_patient_profile,
          has_doctor_profile: role === 'doctor' ? true : currentProfile.has_doctor_profile
        }).eq('id', userId)
      } else {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId, email: form.email, full_name: `${form.firstName} ${form.lastName}`.trim(), role,
          phone: form.phone || null, city: form.city || null, state: form.state || null,
          has_patient_profile: role === 'patient', has_doctor_profile: role === 'doctor',
        })
        if (profileError) throw profileError
      }

      if (role === 'patient') {
        const { error: ppError } = await supabase.from('patient_profiles').insert({
          profile_id: userId, date_of_birth: form.dateOfBirth, blood_group: form.bloodGroup || null,
          height_cm: form.heightCm ? parseFloat(form.heightCm) : null, weight_kg: form.weightKg ? parseFloat(form.weightKg) : null,
          allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()).filter(Boolean) : null,
          chronic_conditions: form.chronicConditions ? form.chronicConditions.split(',').map(s=>s.trim()).filter(Boolean) : null,
        })
        if (ppError) throw ppError
        await refreshProfile()
        toast.success('Patient account ready!')
        navigate('/patient/dashboard')
      } else {
        const { error: dpError } = await supabase.from('doctor_profiles').insert({
          profile_id: userId, license_number: form.licenseNumber,
          medical_council: form.medicalCouncil,
          specialization: form.specialization, sub_specialty: form.subSpecialty || null,
          hospital: form.hospital || null,
          years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          verification_status: 'VERIFIED',
        })
        if (dpError) throw dpError
        await refreshProfile()
        toast.success('Doctor account ready!')
        navigate('/doctor/dashboard')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (existingProfile && existingProfile.has_patient_profile && existingProfile.has_doctor_profile) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-slide-up">
          <Activity size={40} className="text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">You have both profiles!</h2>
          <p className="text-slate-400 text-sm mb-6">You can sign in to either dashboard from the login page.</p>
          <Button onClick={() => navigate(existingProfile.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard')} fullWidth>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full p-3.5 mb-3.5 rounded-xl border-2 border-slate-700/50 text-sm bg-navy-800/80 text-white transition-all outline-none focus:border-cyan-500 focus:shadow-[0_4px_12px_rgba(6,182,212,0.15)] focus:bg-navy-800 placeholder:text-slate-500"
  const sectionLabelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-2"
  const dividerClass = "h-px bg-slate-800/80 my-1.5 mb-5"

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[460px] animate-slide-up">
        <div className="glass-card rounded-3xl p-8 md:p-10" style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center glow-cyan shadow-lg shadow-cyan-500/40">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Medinex</h1>
          </div>

          <h2 className="text-center text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-center text-sm text-slate-400 mb-7">Join Medinex today</p>

          {!role && !existingProfile && (
            <div className="animate-fade-in">
              <div className="flex gap-4 mb-6">
                <button className="flex-1 p-4 rounded-2xl border-2 border-slate-700/50 bg-navy-800/50 text-sm font-semibold text-white hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2" onClick={() => setRole('patient')}>
                  <User size={24} className="text-cyan-400" /> Patient
                </button>
                <button className="flex-1 p-4 rounded-2xl border-2 border-slate-700/50 bg-navy-800/50 text-sm font-semibold text-white hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-2" onClick={() => setRole('doctor')}>
                  <Stethoscope size={24} className="text-cyan-400" /> Doctor
                </button>
              </div>
              <div className="text-center text-sm text-slate-500 p-5 bg-navy-800/50 rounded-2xl border border-slate-800">Choose account type</div>
            </div>
          )}

          {role && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2.5 bg-cyan-500/10 border-2 border-cyan-500/50 rounded-2xl px-4 py-3 mb-6 font-semibold text-cyan-400 text-sm">
                {role === 'patient' ? <User size={18} /> : <Stethoscope size={18} />}
                Registering as {role === 'patient' ? 'Patient' : 'Doctor'}
              </div>

              <form onSubmit={handleRegister}>
                <div className={sectionLabelClass}>Basic Info</div>
                <div className="flex gap-3">
                  <input type="text" placeholder="First Name" className={`${inputClass} flex-1`} value={form.firstName} onChange={set('firstName')} required />
                  <input type="text" placeholder="Last Name" className={`${inputClass} flex-1`} value={form.lastName} onChange={set('lastName')} required />
                </div>
                <input type="email" placeholder="Email Address" className={inputClass} value={form.email} onChange={set('email')} required />
                <input type="tel" placeholder="Phone Number" className={inputClass} value={form.phone} onChange={set('phone')} required />
                <div className="flex gap-3">
                  <input type="text" placeholder="City" className={`${inputClass} flex-1`} value={form.city} onChange={set('city')} required />
                  <input type="text" placeholder="State" className={`${inputClass} flex-1`} value={form.state} onChange={set('state')} required />
                </div>
                <input type="password" placeholder="Password" className={inputClass} value={form.password} onChange={set('password')} required minLength={6} />

                {role === 'patient' ? (
                  <>
                    <div className={dividerClass}></div>
                    <div className={sectionLabelClass}>Personal Details</div>
                    <input type="date" placeholder="Date of Birth" className={inputClass} value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
                    <div className="flex gap-3">
                      <input type="number" placeholder="Height in cm" className={`${inputClass} flex-1`} value={form.heightCm} onChange={set('heightCm')} />
                      <input type="number" placeholder="Weight in kg" className={`${inputClass} flex-1`} value={form.weightKg} onChange={set('weightKg')} />
                    </div>
                    <select className={inputClass} value={form.bloodGroup} onChange={set('bloodGroup')}>
                      <option value="" disabled>Blood Group</option>
                      <option>A+</option><option>A-</option>
                      <option>B+</option><option>B-</option>
                      <option>O+</option><option>O-</option>
                      <option>AB+</option><option>AB-</option>
                    </select>

                    <div className={dividerClass}></div>
                    <div className={sectionLabelClass}>Health Info <span className="text-slate-500 font-normal lowercase ml-1">(optional)</span></div>
                    <textarea placeholder="Any allergies? e.g. Penicillin, Peanuts..." className={`${inputClass} h-20 resize-none`} value={form.allergies} onChange={set('allergies')}></textarea>
                    <select className={inputClass} value={form.chronicConditions} onChange={set('chronicConditions')}>
                      <option value="" disabled>Any chronic conditions?</option>
                      <option value="none">None</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="hypertension">Hypertension</option>
                      <option value="asthma">Asthma</option>
                      <option value="heart_disease">Cardiac Disease</option>
                      <option value="other">Other</option>
                    </select>
                  </>
                ) : (
                  <>
                    <div className={dividerClass}></div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-amber-400">
                      ⚠️ Doctor accounts require verification before activation.
                    </div>
                    <div className={sectionLabelClass}>Professional Details</div>
                    <div className="flex gap-3">
                      <input type="text" placeholder="License Number" className={`${inputClass} flex-1`} value={form.licenseNumber} onChange={set('licenseNumber')} required />
                      <input type="text" placeholder="Medical Council" className={`${inputClass} flex-1`} value={form.medicalCouncil} onChange={set('medicalCouncil')} required />
                    </div>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Specialty (e.g. Cardiologist)" className={`${inputClass} flex-1`} value={form.specialization} onChange={set('specialization')} required />
                      <input type="text" placeholder="Sub-specialty" className={`${inputClass} flex-1`} value={form.subSpecialty} onChange={set('subSpecialty')} />
                    </div>
                    <div className="flex gap-3">
                      <input type="text" placeholder="Hospital / Clinic Name (optional)" className={`${inputClass} flex-[2]`} value={form.hospital} onChange={set('hospital')} />
                      <input type="number" placeholder="Years Exp" className={`${inputClass} flex-1`} value={form.yearsExperience} onChange={set('yearsExperience')} />
                    </div>
                  </>
                )}

                {error && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">{error}</div>}

                <button type="submit" className="w-full p-4 mt-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-bold text-base hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center">
                  {loading ? 'Creating...' : (role === 'patient' ? 'Create Patient Account' : 'Create Doctor Account')}
                </button>
              </form>
            </div>
          )}

          {!existingProfile && (
            <div className="text-center mt-6 pt-5 border-t border-slate-800/80 text-sm text-slate-500">
              Already have an account? <Link to="/login" className="text-cyan-400 font-bold hover:underline">Login here</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
