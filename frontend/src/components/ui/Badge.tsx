import React from 'react'

type BadgeVariant = 'cyan' | 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'teal' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  gray: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

const dotColors: Record<BadgeVariant, string> = {
  cyan: 'bg-cyan-400',
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-rose-400',
  gray: 'bg-slate-400',
  blue: 'bg-blue-400',
  teal: 'bg-teal-400',
  purple: 'bg-purple-400',
}

export function Badge({ variant = 'gray', children, className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}

export function statusBadge(status: string): React.ReactElement {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    ACTIVE: { variant: 'green', label: 'Active' },
    PENDING: { variant: 'amber', label: 'Pending' },
    DECLINED: { variant: 'red', label: 'Declined' },
    DISCONNECTED: { variant: 'gray', label: 'Disconnected' },
    PROCESSED: { variant: 'green', label: 'Processed' },
    PROCESSING: { variant: 'cyan', label: 'Processing' },
    FAILED: { variant: 'red', label: 'Failed' },
    VERIFIED: { variant: 'green', label: 'Verified' },
    REJECTED: { variant: 'red', label: 'Rejected' },
  }
  const cfg = map[status] ?? { variant: 'gray', label: status }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}
