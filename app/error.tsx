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
      <body className="flex min-h-screen items-center justify-center bg-[#0a0f1e] p-4">
        <div className="max-w-sm w-full text-center">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
