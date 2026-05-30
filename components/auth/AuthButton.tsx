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
  const baseClasses = `
    relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold
    text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-60 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `

  const variants = {
    primary: `
      bg-coffee-gradient text-white shadow-coffee hover:shadow-coffee-lg
      hover:brightness-110 active:scale-[0.98] focus:ring-coffee-400
    `,
    secondary: `
      border-2 border-coffee-300 bg-white text-coffee-700
      hover:bg-coffee-50 active:scale-[0.98] focus:ring-coffee-300
    `,
    google: `
      border-2 border-gray-200 bg-white text-gray-700
      hover:bg-gray-50 active:scale-[0.98] focus:ring-gray-300
    `,
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  )
}
