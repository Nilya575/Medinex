import { useState, useEffect } from 'react'
import { Search, UserPlus, Users, Check, X, Stethoscope, Building2, QrCode } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { Badge, statusBadge } from '../../components/ui/Badge'
import type { Connection, Profile, DoctorProfile } from '../../types'
import toast from 'react-hot-toast'

interface DoctorWithProfile extends Profile {
  doctor_profiles: DoctorProfile[]
}

export default function PatientDoctors() {
  const { profile } = useAuth()
  const [connections, setConnections] = useState<Connection[]>([])
  const [searchResults, setSearchResults] = useState<DoctorWithProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrOpen, setQrOpen] = useState(false)
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const loadConnections = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('connections')
      .select('*, doctor:profiles!doctor_id(full_name, email, city, doctor_profiles(specialization, hospital, verification_status))')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
    setConnections(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadConnections() }, [profile])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, doctor_profiles(*)')
      .eq('role', 'doctor')
      .eq('doctor_profiles.verification_status', 'VERIFIED')
      .ilike('full_name', `%${searchQuery}%`)
      .limit(10)
    setSearchResults((data as DoctorWithProfile[]) ?? [])
    setSearching(false)
  }

  const sendRequest = async (doctorId: string) => {
    if (!profile) return
    setSendingTo(doctorId)
    try {
      // Check existing
      const { data: existing } = await supabase
        .from('connections')
        .select('id, status')
        .eq('patient_id', profile.id)
        .eq('doctor_id', doctorId)
        .single()

      if (existing) {
        toast.error(`Request already ${existing.status.toLowerCase()}`)
        return
      }

      const { error } = await supabase.from('connections').insert({
        patient_id: profile.id,
        doctor_id: doctorId,
        status: 'PENDING',
      })
      if (error) throw error
      toast.success('Connection request sent!')
      loadConnections()
      setSearchResults(prev => prev.filter(d => d.id !== doctorId))
    } catch {
      toast.error('Failed to send request')
    } finally {
      setSendingTo(null)
    }
  }

  const activeConns = connections.filter(c => c.status === 'ACTIVE')
  const pendingConns = connections.filter(c => c.status === 'PENDING')

  return (
    <DashboardLayout
      title="My Doctors"
      subtitle={`${activeConns.length} active connections`}
    >
      <div className="space-y-6">
        {/* Connected Doctors */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users size={20} className="text-cyan-400" />
              My Connected Doctors
            </h2>
            {/* QR code is a non-functional decorative UI element */}
            <button
              onClick={() => setQrOpen(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              title="Share Health ID (decorative)"
            >
              <QrCode size={14} />
              Share ID
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : connections.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No connections yet</p>
              <p className="text-xs text-slate-600 mt-1">Search for a doctor below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map(conn => {
                const doc = conn.doctor as any
                return (
                  <div key={conn.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {doc?.full_name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{doc?.full_name ?? 'Unknown'}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <Stethoscope size={11} />
                        <span>{doc?.doctor_profiles?.[0]?.specialization ?? '—'}</span>
                        {doc?.city && (
                          <>
                            <span className="text-slate-700">·</span>
                            <Building2 size={11} />
                            <span>{doc.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {statusBadge(conn.status)}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Find a Doctor */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Search size={20} className="text-cyan-400" />
            Find a Doctor
          </h2>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by doctor name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border text-white placeholder:text-slate-500 rounded-xl px-4 py-2.5 pl-10 text-sm transition-all duration-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 border-slate-700/50"
                style={{ background: 'rgba(10,15,30,0.6)' }}
              />
            </div>
            <Button onClick={handleSearch} loading={searching} icon={<Search size={16} />}>
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map(doc => {
                const dp = doc.doctor_profiles?.[0]
                const alreadyConnected = connections.some(c => c.doctor_id === doc.id)
                return (
                  <div key={doc.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(6,182,212,0.08)' }}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {doc.full_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{doc.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {dp?.specialization} {dp?.hospital ? `· ${dp.hospital}` : ''}
                      </p>
                    </div>
                    {alreadyConnected ? (
                      <Badge variant="gray">Connected</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={sendingTo === doc.id}
                        onClick={() => sendRequest(doc.id)}
                        icon={<UserPlus size={14} />}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* QR Modal — decorative/non-functional element */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} title="Share Your Health ID" size="sm">
        <div className="text-center space-y-4">
          <div className="w-40 h-40 mx-auto rounded-2xl bg-white/5 border border-cyan-500/20 flex items-center justify-center">
            <QrCode size={80} className="text-cyan-400 opacity-50" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Your Health ID</p>
            <p className="text-xs text-slate-600 font-mono mt-1">{profile?.id?.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="text-xs text-slate-500">
            Share this QR code with your doctor to receive a connection request.
          </p>
          <Button variant="ghost" fullWidth onClick={() => setQrOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
