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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
      <div className="text-5xl mb-4">☕</div>
      <h2 className="text-xl font-bold text-coffee-900 dark:text-cream-100 mb-2">Page failed to load</h2>
      <p className="text-coffee-500 dark:text-coffee-400 mb-6 max-w-sm">
        Something went wrong on this page. Your other data is safe.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-coffee-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-5 py-2.5 text-sm font-semibold text-coffee-700 dark:text-cream-200 hover:bg-coffee-50 dark:hover:bg-coffee-700 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
