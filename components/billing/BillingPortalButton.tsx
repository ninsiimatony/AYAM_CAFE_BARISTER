'use client'

import { useState } from 'react'

interface Props {
  label?: string
  className?: string
}

export default function BillingPortalButton({ label = 'Manage Billing', className = '' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/subscriptions/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error ?? 'Something went wrong')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/[0.09]
          bg-white dark:bg-[#111d2e] px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50
          ${className}
        `}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )}
        {loading ? 'Opening…' : label}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
