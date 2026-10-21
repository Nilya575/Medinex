import React from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { profile } = useAuth()

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(10,15,30,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(6,182,212,0.08)',
      }}
    >
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
          <Bell size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  )
}

// Dashboard layout wrapper
interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      <TopBar title={title} subtitle={subtitle} actions={actions} />
      <main className="p-6 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
