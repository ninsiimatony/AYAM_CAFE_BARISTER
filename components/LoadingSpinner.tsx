interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  message?: string
}

export default function LoadingSpinner({
  size = 'md',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg className={`${sizes[size]} animate-spin text-blue-500`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {message && <p className="text-xs text-gray-600 animate-pulse">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1e]/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
