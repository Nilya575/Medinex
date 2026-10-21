import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

export function Input({ label, error, hint, leftIcon, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full bg-navy-800/60 border text-white placeholder:text-slate-500',
            'rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none',
            'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
            error ? 'border-rose-500/60' : 'border-slate-700/50 hover:border-slate-600/50',
            leftIcon ? 'pl-10' : '',
            className,
          ].join(' ')}
          style={{ background: 'rgba(10,15,30,0.6)' }}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full bg-navy-800/60 border text-white placeholder:text-slate-500',
          'rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none resize-y min-h-24',
          'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
          error ? 'border-rose-500/60' : 'border-slate-700/50 hover:border-slate-600/50',
          className,
        ].join(' ')}
        style={{ background: 'rgba(10,15,30,0.6)' }}
        {...props}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, hint, options, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-rose-400 ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={[
          'w-full border text-white',
          'rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none cursor-pointer',
          'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20',
          error ? 'border-rose-500/60' : 'border-slate-700/50 hover:border-slate-600/50',
          className,
        ].join(' ')}
        style={{ background: 'rgba(10,15,30,0.9)' }}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#0d1526' }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
