import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, QrCode, Pill, Users, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import type { Prescription, Connection } from '../../types'

export default function PatientDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [recentRx, setRecentRx] = useState<Prescription[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      const [rxRes, connRes] = await Promise.all([
        supabase.from('prescriptions').select('*, doctor:profiles!doctor_id(full_name, doctor_profile:doctor_profiles(specialization))').eq('patient_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('connections').select('*, doctor:profiles!doctor_id(full_name, doctor_profile:doctor_profiles(specialization))').eq('patient_id', profile.id).eq('status', 'ACTIVE').limit(5),
      ])

      setRecentRx(rxRes.data ?? [])
      setConnections(connRes.data ?? [])
      setLoading(false)
    }

    load()
  }, [profile])

  return (
    <DashboardLayout title="My Care">
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6 max-w-6xl">
          {/* Overview Search Row */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-3 bg-navy-800/50 border border-slate-700/50 rounded-xl px-4 py-3 shadow-sm focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                className="bg-transparent border-none outline-none text-white placeholder:text-slate-500 flex-1 text-sm"
                onFocus={() => navigate('/patient/doctors')}
              />
            </div>
            <button
              className="w-12 h-12 rounded-xl bg-navy-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex-shrink-0"
              title="Scan QR Code"
            >
              <QrCode size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Prescriptions (Takes up 2 cols on lg) */}
            <Card className="lg:col-span-2 !p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center justify-between bg-navy-800/50">
                <h3 className="text-sm font-semibold text-white">Recent Prescriptions</h3>
                <button onClick={() => navigate('/patient/prescriptions')} className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                  View All →
                </button>
              </div>
              <div className="p-5 flex-1">
                {recentRx.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">💊</div>
                    <h4 className="text-sm font-semibold text-white mb-1">No Prescriptions Yet</h4>
                    <p className="text-xs text-slate-400">Connect with a doctor to receive digital prescriptions here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRx.map(rx => (
                      <div key={rx.id} className="flex items-start gap-4 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{rx.diagnosis}</p>
                          <p className="text-xs text-slate-400 mt-1">Dr. {(rx.doctor as any)?.full_name} · {new Date(rx.created_at).toLocaleDateString()}</p>
                          {rx.notes && <p className="text-xs text-slate-500 mt-2">{rx.notes}</p>}
                        </div>
                        <Badge variant={rx.is_active ? 'green' : 'gray'} className={rx.is_active ? 'bg-emerald-500/10 text-emerald-400 border-none' : ''}>
                          {rx.is_active ? 'Active' : 'Past'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Connections (Takes up 1 col on lg) */}
            <Card className="!p-0 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-cyan-500/10 flex items-center justify-between bg-navy-800/50">
                <h3 className="text-sm font-semibold text-white">Recent connections</h3>
                <button onClick={() => navigate('/patient/doctors')} className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors">
                  Manage
                </button>
              </div>
              <div className="p-5 flex-1">
                {connections.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-navy-800 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">👨‍⚕️</div>
                    <h4 className="text-sm font-semibold text-white mb-1">No Connections</h4>
                    <p className="text-xs text-slate-400">Search and connect with your doctors.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {connections.map(c => {
                      const doctor = c.doctor as any
                      return (
                        <div key={c.id} className="flex items-center gap-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {doctor?.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{doctor?.full_name}</p>
                            <p className="text-xs text-slate-400 truncate">{doctor?.doctor_profile?.specialization}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></div>
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
