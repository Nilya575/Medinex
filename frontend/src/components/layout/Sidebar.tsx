import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, LayoutDashboard, FileText, Pill, Users, User,
  LogOut, Stethoscope, ClipboardList, ArrowLeftRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const patientLinks = [
  { to: '/patient/dashboard',     label: 'My Care',       icon: <LayoutDashboard size={18} /> },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: <Pill size={18} /> },
  { to: '/patient/documents',     label: 'Documents',     icon: <FileText size={18} /> },
  { to: '/patient/doctors',       label: 'My Doctors',    icon: <Users size={18} /> },
  { to: '/patient/profile',       label: 'My Profile',    icon: <User size={18} /> },
]

const doctorLinks = [
  { to: '/doctor/dashboard', label: 'Overview',         icon: <LayoutDashboard size={18} /> },
  { to: '/doctor/requests',  label: 'Patient Requests', icon: <ClipboardList size={18} /> },
  { to: '/doctor/patients',  label: 'My Patients',      icon: <Users size={18} /> },
  { to: '/doctor/profile',   label: 'My Profile',       icon: <User size={18} /> },
]

export function Sidebar() {
  const { profile, signOut, switchRole } = useAuth()
  const navigate = useNavigate()

  if (!profile) return null

  const isPatient = profile.role === 'patient'
  const links = isPatient ? patientLinks : doctorLinks
  const hasBothRoles = profile.has_patient_profile && profile.has_doctor_profile

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const handleSwitchRole = async () => {
    const newRole = profile.role === 'patient' ? 'doctor' : 'patient'
    await switchRole(newRole)
    toast.success(`Switched to ${newRole} view`)
    navigate(newRole === 'patient' ? '/patient/dashboard' : '/doctor/dashboard')
  }

  return (
    <aside className="h-screen w-60 flex-shrink-0 flex flex-col py-5 px-3"
      style={{ background: 'rgba(6,9,20,0.95)', borderRight: '1px solid rgba(6,182,212,0.08)' }}>
      
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center glow-cyan flex-shrink-0">
          <Activity size={16} className="text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">Medinex</span>
      </div>

      {/* Role badge */}
      <div className="px-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: isPatient ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
                   border: `1px solid ${isPatient ? 'rgba(6,182,212,0.2)' : 'rgba(139,92,246,0.2)'}` }}>
          <span className={isPatient ? 'text-cyan-400' : 'text-purple-400'}>
            {isPatient ? <User size={13} /> : <Stethoscope size={13} />}
          </span>
          <span className={`text-xs font-medium ${isPatient ? 'text-cyan-400' : 'text-purple-400'}`}>
            {isPatient ? 'Patient View' : 'Doctor View'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5',
            ].join(' ')}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 pt-3 border-t border-slate-800">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {profile.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
