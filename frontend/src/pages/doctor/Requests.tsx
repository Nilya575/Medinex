import { useState, useEffect } from 'react'
import { Check, X, ClipboardList } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { statusBadge } from '../../components/ui/Badge'
import type { Connection } from '../../types'
import toast from 'react-hot-toast'

export default function DoctorRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'PENDING' | 'ACTIVE' | 'DECLINED'>('PENDING')

  const load = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('connections')
      .select('*, patient:profiles!patient_id(full_name, email, city)')
      .eq('doctor_id', profile.id)
      .order('updated_at', { ascending: false })
    setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  const respond = async (connId: string, status: 'ACTIVE' | 'DECLINED') => {
    await supabase.from('connections').update({ status, updated_at: new Date().toISOString() }).eq('id', connId)
    toast.success(status === 'ACTIVE' ? 'Request accepted!' : 'Request declined')
    load()
  }

  const filtered = requests.filter(r => r.status === tab)
  const counts = {
    PENDING: requests.filter(r => r.status === 'PENDING').length,
    ACTIVE: requests.filter(r => r.status === 'ACTIVE').length,
    DECLINED: requests.filter(r => r.status === 'DECLINED').length,
  }

  return (
    <DashboardLayout title="Connection Requests" subtitle="Manage patient connection requests">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['PENDING', 'ACTIVE', 'DECLINED'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5',
            ].join(' ')}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()} ({counts[t]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No {tab.toLowerCase()} requests</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(conn => {
            const patient = conn.patient as any
            return (
              <Card key={conn.id}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {patient?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-white">{patient?.full_name}</p>
                    <p className="text-sm text-slate-400">{patient?.email}</p>
                    {patient?.city && <p className="text-xs text-slate-500 mt-0.5">{patient.city}</p>}
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(conn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(conn.status)}
                    {conn.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" icon={<Check size={14} />}
                          onClick={() => respond(conn.id, 'ACTIVE')}>
                          Accept
                        </Button>
                        <Button size="sm" variant="danger" icon={<X size={14} />}
                          onClick={() => respond(conn.id, 'DECLINED')}>
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
