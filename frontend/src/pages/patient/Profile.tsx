import { useState, useEffect } from 'react'
import { Save, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input, Textarea, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function PatientProfile() {
  const { profile, patientProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    gender: '',
    blood_group: '',
    height_cm: '',
    weight_kg: '',
    allergies: '',
    chronic_conditions: '',
    current_medications: '',
    family_history: '',
  })

  useEffect(() => {
    if (profile && patientProfile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        gender: patientProfile.gender ?? '',
        blood_group: patientProfile.blood_group ?? '',
        height_cm: patientProfile.height_cm?.toString() ?? '',
        weight_kg: patientProfile.weight_kg?.toString() ?? '',
        allergies: patientProfile.allergies?.join(', ') ?? '',
        chronic_conditions: patientProfile.chronic_conditions?.join(', ') ?? '',
        current_medications: patientProfile.current_medications?.join(', ') ?? '',
        family_history: patientProfile.family_history ?? '',
      })
    }
  }, [profile, patientProfile])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!profile || !patientProfile) return
    setLoading(true)
    try {
      const { error: profError } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone || null,
        city: form.city || null,
        state: form.state || null,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      if (profError) throw profError

      const { error: ppError } = await supabase.from('patient_profiles').update({
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : null,
        chronic_conditions: form.chronic_conditions ? form.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean) : null,
        current_medications: form.current_medications ? form.current_medications.split(',').map(s => s.trim()).filter(Boolean) : null,
        family_history: form.family_history || null,
      }).eq('profile_id', profile.id)
      if (ppError) throw ppError

      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  // Calculate age from DOB (never stored, always computed)
  const age = patientProfile?.date_of_birth
    ? Math.floor((Date.now() - new Date(patientProfile.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  if (!profile) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your personal and medical information">
      <div className="max-w-3xl space-y-6">
        {/* Read-only identity */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="cyan">Patient</Badge>
                {patientProfile?.blood_group && <Badge variant="red">{patientProfile.blood_group}</Badge>}
              </div>
            </div>
          </div>

          {/* Locked fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                Date of Birth
              </div>
              <p className="text-sm text-white">
                {patientProfile?.date_of_birth
                  ? new Date(patientProfile.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                Age (computed)
              </div>
              <p className="text-sm text-white">{age !== null ? `${age} years` : '—'}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                Email
              </div>
              <p className="text-sm text-white">{profile.email}</p>
            </div>
          </div>
        </Card>

        {/* Editable: Personal */}
        <Card>
          <CardTitle className="mb-5">Personal Information</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.full_name} onChange={set('full_name')} />
            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="State" value={form.state} onChange={set('state')} />
            <Select
              label="Gender"
              value={form.gender}
              onChange={set('gender')}
              options={[
                { value: '', label: 'Select gender' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Non-binary', label: 'Non-binary' },
                { value: 'Prefer not to say', label: 'Prefer not to say' },
              ]}
            />
            <Select
              label="Blood Group"
              value={form.blood_group}
              onChange={set('blood_group')}
              options={[
                { value: '', label: 'Select blood group' },
                ...['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(v => ({ value: v, label: v })),
              ]}
            />
            <Input label="Height (cm)" type="number" value={form.height_cm} onChange={set('height_cm')} placeholder="170" />
            <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={set('weight_kg')} placeholder="70" />
          </div>
        </Card>

        {/* Editable: Medical */}
        <Card>
          <CardTitle className="mb-5">Medical Information</CardTitle>
          <div className="space-y-4">
            <Textarea
              label="Allergies"
              value={form.allergies}
              onChange={set('allergies')}
              placeholder="Penicillin, Peanuts, Latex (comma-separated)"
              hint="Separate multiple entries with commas"
            />
            <Textarea
              label="Chronic Conditions"
              value={form.chronic_conditions}
              onChange={set('chronic_conditions')}
              placeholder="Type 2 Diabetes, Hypertension (comma-separated)"
            />
            <Textarea
              label="Current Medications"
              value={form.current_medications}
              onChange={set('current_medications')}
              placeholder="Metformin 500mg, Lisinopril 10mg (comma-separated)"
            />
            <Textarea
              label="Family History"
              value={form.family_history}
              onChange={set('family_history')}
              placeholder="Father: Coronary artery disease; Mother: Type 2 Diabetes"
            />
          </div>
        </Card>

        <Button onClick={handleSave} loading={loading} size="lg" icon={<Save size={18} />}>
          Save Changes
        </Button>
      </div>
    </DashboardLayout>
  )
}
