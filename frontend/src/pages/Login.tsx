import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, User, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [role, setRole] = useState<'patient' | 'doctor'>('patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      if (!data.user) throw new Error('Login failed')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()

      await supabase.from('profiles').update({ role }).eq('id', data.user.id)
      await refreshProfile()

      if (role === 'patient' && !profile?.has_patient_profile) {
        toast.success('Please complete your patient profile.')
        navigate('/register')
        return
      }
      if (role === 'doctor' && !profile?.has_doctor_profile) {
        toast.success('Please complete your doctor profile.')
        navigate('/register')
        return
      }

      toast.success('Welcome back!')
      if (role === 'doctor') navigate('/doctor/dashboard')
      else navigate('/patient/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full p-3.5 mb-4 rounded-xl border-2 border-slate-700/50 text-sm bg-navy-800/80 text-white transition-all outline-none focus:border-cyan-500 focus:shadow-[0_4px_12px_rgba(6,182,212,0.15)] focus:bg-navy-800 placeholder:text-slate-500"

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] animate-slide-up">
        <div className="glass-card rounded-3xl p-8 md:p-10" style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center glow-cyan shadow-lg shadow-cyan-500/40">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Medinex</h1>
          </div>

          <h2 className="text-center text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-center text-sm text-slate-400 mb-7">Sign in to your account</p>

          <div className="flex gap-4 mb-6">
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-semibold ${role === 'patient' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.15)]' : 'border-slate-700/50 bg-navy-800/50 text-slate-400 hover:border-slate-600'}`}
              onClick={() => setRole('patient')}
            >
              <User size={16} /> Patient
            </button>
            <button
              type="button"
              className={`flex-1 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 text-sm font-semibold ${role === 'doctor' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.15)]' : 'border-slate-700/50 bg-navy-800/50 text-slate-400 hover:border-slate-600'}`}
              onClick={() => setRole('doctor')}
            >
              <Stethoscope size={16} /> Doctor
            </button>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors text-sm mb-6">
            ← Back to Home
          </Link>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email Address"
              className={inputClass}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className={inputClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <button type="submit" className="w-full p-4 mt-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-bold text-base hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6 pt-5 border-t border-slate-800/80 text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-cyan-400 font-bold hover:underline">Register free</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
