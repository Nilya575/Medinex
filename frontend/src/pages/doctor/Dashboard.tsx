import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, ClipboardList, Pill, ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import type { Connection } from '../../types'
import toast from 'react-hot-toast'

export default function DoctorDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [connections, setConnections] = useState<Connection[]>([])
  const [rxCount, setRxCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!profile) return
    const [connRes, rxRes] = await Promise.all([
      supabase
        .from('connections')
        .select('*, patient:profiles!patient_id(full_name, email)')
        .eq('doctor_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('prescriptions')
        .select('id')
        .eq('doctor_id', profile.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ])
    setConnections(connRes.data ?? [])
    setRxCount(rxRes.data?.length ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  const respond = async (connId: string, status: 'ACTIVE' | 'DECLINED') => {
    await supabase.from('connections').update({ status, updated_at: new Date().toISOString() }).eq('id', connId)
    toast.success(status === 'ACTIVE' ? 'Request accepted!' : 'Request declined')
    load()
  }

  const active = connections.filter(c => c.status === 'ACTIVE')
  const pending = connections.filter(c => c.status === 'PENDING')

  const lastName = profile?.full_name?.split(' ').slice(-1)[0] ?? 'Doctor'

  return (
    <DashboardLayout
      title="Overview"
      actions={<Badge variant="green" dot>Verified Doctor</Badge>}
    >
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1 font-serif">Good morning, Dr. {lastName}</h2>
            <p className="text-slate-400 text-sm">Here's a summary of your patients and requests</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <Card className="flex flex-col justify-between !p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">My Patients</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Users size={16} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-medium text-white leading-none">{active.length}</div>
                <div className="text-xs text-slate-500 mt-2">Active connections</div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between !p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Requests</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <ClipboardList size={16} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-medium text-white leading-none">{pending.length}</div>
                <div className="text-xs text-slate-500 mt-2">Awaiting your response</div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between !p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescriptions Sent</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Pill size={16} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-mono font-medium text-white leading-none">{rxCount}</div>
                <div className="text-xs text-slate-500 mt-2">Total prescriptions issued</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Requests */}
            <Card className="!p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center justify-between bg-navy-800/50">
                <h3 className="text-sm font-semibold text-white">Pending Requests</h3>
                <button onClick={() => navigate('/doctor/requests')} className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                  View All →
                </button>
              </div>
              <div className="p-5 flex-1">
                {pending.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pending.slice(0, 3).map(c => {
                      const patient = c.patient as any
                      return (
                        <div key={c.id} className="flex items-center gap-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {patient?.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{patient?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respond(c.id, 'ACTIVE')} className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                              Accept
                            </button>
                            <button onClick={() => respond(c.id, 'DECLINED')} className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                              Decline
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Patients */}
            <Card className="!p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center justify-between bg-navy-800/50">
                <h3 className="text-sm font-semibold text-white">Recent Patients</h3>
                <button onClick={() => navigate('/doctor/patients')} className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                  View All →
                </button>
              </div>
              <div className="p-5 flex-1">
                {active.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">🧑</div>
                    <h4 className="text-sm font-semibold text-white mb-1">No Patients Yet</h4>
                    <p className="text-xs text-slate-400">Accept requests to start managing patient care.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {active.slice(0, 4).map(c => {
                      const patient = c.patient as any
                      return (
                        <div key={c.id} onClick={() => navigate('/doctor/patients')} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 cursor-pointer transition-all">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {patient?.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{patient?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{patient?.email}</p>
                          </div>
                          <Badge variant="green" className="bg-emerald-500/10 text-emerald-400 border-none">Active</Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
