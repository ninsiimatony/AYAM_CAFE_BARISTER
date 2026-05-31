'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-white mb-1">Page failed to load</h2>
      <p className="text-sm text-gray-600 mb-6 max-w-sm">
        Something went wrong. Your account data is safe.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] px-4 py-2 text-sm font-semibold text-gray-300 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
