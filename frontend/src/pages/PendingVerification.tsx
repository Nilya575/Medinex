import { Link } from 'react-router-dom'
import { Activity, Clock, Mail } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export default function PendingVerification() {
  const { signOut, profile } = useAuth()

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="glass-card rounded-2xl p-10" style={{ border: '1px solid rgba(6,182,212,0.15)' }}>
          <div className="w-20 h-20 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Pending</h1>
          <p className="text-slate-400 mb-6">
            Your doctor account is currently under review. An administrator will verify your
            medical credentials and approve your account shortly.
          </p>
          <div className="glass rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-2">
              <Mail size={14} />
              Registered As
            </div>
            <p className="text-white font-medium">{profile?.full_name}</p>
            <p className="text-slate-400 text-sm">{profile?.email}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={signOut}
              fullWidth
            >
              Sign Out
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              fullWidth
            >
              Check Status
            </Button>
          </div>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 mt-6 text-slate-400 hover:text-cyan-400 transition-colors text-sm">
          <Activity size={16} />
          Back to Medinex
        </Link>
      </div>
    </div>
  )
}
