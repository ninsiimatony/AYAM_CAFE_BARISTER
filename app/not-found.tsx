import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] p-6 text-center">
      <div className="max-w-sm">
        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-4">404</p>
        <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-sm text-gray-600 mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
