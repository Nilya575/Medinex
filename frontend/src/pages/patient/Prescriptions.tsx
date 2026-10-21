import { useState, useEffect } from 'react'
import { Pill, Calendar, User, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { DashboardLayout } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import type { Prescription } from '../../types'

function RxCard({ rx }: { rx: Prescription }) {
  const [expanded, setExpanded] = useState(false)

  const followUpSoon = rx.follow_up_date
    ? new Date(rx.follow_up_date).getTime() - Date.now() < 7 * 24 * 3600 * 1000
    : false

  return (
    <Card className={rx.is_active ? '' : 'opacity-70'}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-white">{rx.diagnosis}</h3>
            <Badge variant={rx.is_active ? 'green' : 'gray'} dot>
              {rx.is_active ? 'Active' : 'Past'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <User size={12} />
            <span>{(rx.doctor as any)?.full_name}</span>
            {(rx.doctor as any)?.doctor_profile?.specialization && (
              <span className="text-slate-600">· {(rx.doctor as any).doctor_profile.specialization}</span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500">v{rx.version}</div>
      </div>

      {followUpSoon && rx.follow_up_date && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={12} />
          Follow-up on {new Date(rx.follow_up_date).toLocaleDateString()} — coming soon!
        </div>
      )}

      {/* Medication table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(6,182,212,0.1)' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(6,182,212,0.08)' }}>
              {['Drug', 'Strength', 'Dosage', 'Frequency', 'Duration'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rx.medications?.slice(0, expanded ? undefined : 3).map((m, i) => (
              <tr key={i} className={i % 2 === 0 ? '' : ''} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-3 py-2 text-white font-medium">{m.drug_name}</td>
                <td className="px-3 py-2 text-slate-400">{m.strength}</td>
                <td className="px-3 py-2 text-slate-400">{m.dosage}</td>
                <td className="px-3 py-2 text-slate-400">{m.frequency}</td>
                <td className="px-3 py-2 text-slate-400">{m.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rx.medications?.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Show less' : `+${rx.medications.length - 3} more medications`}
        </button>
      )}

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          Prescribed {new Date(rx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        {rx.follow_up_date && !followUpSoon && (
          <div className="text-xs text-slate-500">
            Follow-up: {new Date(rx.follow_up_date).toLocaleDateString()}
          </div>
        )}
      </div>

      {rx.notes && (
        <div className="mt-3 text-xs text-slate-400 bg-white/3 rounded-lg px-3 py-2">
          <strong className="text-slate-300">Notes:</strong> {rx.notes}
        </div>
      )}
    </Card>
  )
}

export default function PatientPrescriptions() {
  const { profile } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('prescriptions')
      .select('*, doctor:profiles!doctor_id(full_name, doctor_profile:doctor_profiles(specialization))')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPrescriptions(data ?? [])
        setLoading(false)
      })
  }, [profile])

  const active = prescriptions.filter(r => r.is_active)
  const history = prescriptions.filter(r => !r.is_active)
  const shown = tab === 'active' ? active : history

  return (
    <DashboardLayout
      title="Prescriptions"
      subtitle={`${active.length} active · ${history.length} past`}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['active', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize',
              tab === t
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5',
            ].join(' ')}
          >
            {t === 'active' ? `Active (${active.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : shown.length === 0 ? (
        <Card className="text-center py-16">
          <Pill size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No {tab} prescriptions</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shown.map(rx => <RxCard key={rx.id} rx={rx} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
