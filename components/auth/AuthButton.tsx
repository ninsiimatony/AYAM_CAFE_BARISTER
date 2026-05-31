'use client'

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'google'
  fullWidth?: boolean
}

export default function AuthButton({
  children,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) {
  const base = `
    relative flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold
    transition-all duration-150 outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]',
    secondary: 'border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] active:scale-[0.98]',
    google:    'border border-white/[0.08] bg-white/[0.03] text-gray-200 hover:bg-white/[0.07] active:scale-[0.98]',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing…
        </>
      ) : children}
    </button>
  )
}
