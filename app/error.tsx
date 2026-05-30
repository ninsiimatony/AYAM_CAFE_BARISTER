'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body className="flex min-h-screen items-center justify-center bg-cream-100 p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">☕</div>
          <h1 className="text-2xl font-bold text-coffee-900 mb-2">Something went wrong</h1>
          <p className="text-coffee-500 mb-6">
            We&apos;re sorry — an unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-coffee-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
