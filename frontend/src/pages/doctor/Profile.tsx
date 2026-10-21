import { useState, useEffect } from 'react'
import { Save, Lock, Stethoscope } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function DoctorProfile() {
  const { profile, doctorProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    hospital: '',
    sub_specialty: '',
    years_experience: '',
  })

  useEffect(() => {
    if (profile && doctorProfile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        hospital: doctorProfile.hospital ?? '',
        sub_specialty: doctorProfile.sub_specialty ?? '',
        years_experience: doctorProfile.years_experience?.toString() ?? '',
      })
    }
  }, [profile, doctorProfile])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSave = async () => {
    if (!profile || !doctorProfile) return
    setLoading(true)
    try {
      const { error: pErr } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone || null,
        city: form.city || null,
        state: form.state || null,
        updated_at: new Date().toISOString(),
      }).eq('id', profile.id)
      if (pErr) throw pErr

      const { error: dErr } = await supabase.from('doctor_profiles').update({
        hospital: form.hospital || null,
        sub_specialty: form.sub_specialty || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      }).eq('profile_id', profile.id)
      if (dErr) throw dErr

      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (!profile || !doctorProfile) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your professional information">
      <div className="max-w-3xl space-y-6">
        {/* Identity header */}
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dr. {profile.full_name}</h2>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="cyan" dot>{doctorProfile.specialization}</Badge>
                <Badge variant="green" dot>Verified</Badge>
              </div>
            </div>
          </div>

          {/* Locked credentials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                License Number
              </div>
              <p className="text-sm text-white font-mono">{doctorProfile.license_number}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                Medical Council
              </div>
              <p className="text-sm text-white">{doctorProfile.medical_council}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Lock size={11} />
                Specialization
              </div>
              <p className="text-sm text-white">{doctorProfile.specialization}</p>
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
          </div>
        </Card>

        {/* Editable: Professional */}
        <Card>
          <CardTitle className="mb-5 flex items-center gap-2">
            <Stethoscope size={18} className="text-cyan-400" />
            Professional Information
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hospital / Clinic"
              value={form.hospital}
              onChange={set('hospital')}
              placeholder="Apollo Hospital"
            />
            <Input
              label="Sub-Specialty"
              value={form.sub_specialty}
              onChange={set('sub_specialty')}
              placeholder="Interventional Cardiology"
            />
            <Input
              label="Years of Experience"
              type="number"
              value={form.years_experience}
              onChange={set('years_experience')}
              placeholder="10"
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
