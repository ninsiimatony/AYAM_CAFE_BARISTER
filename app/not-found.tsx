import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Page Not Found' }

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 dark:bg-coffee-950 p-6 text-center">
      <div className="max-w-md">
        <div className="text-7xl mb-4">☕</div>
        <h1 className="text-4xl font-bold text-coffee-900 dark:text-cream-100 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-coffee-700 dark:text-cream-200 mb-3">Page not found</h2>
        <p className="text-coffee-500 dark:text-coffee-400 mb-8">
          Looks like this page wandered off. Let&apos;s get you back to the café.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-coffee-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-6 py-2.5 text-sm font-semibold text-coffee-700 dark:text-cream-200 hover:bg-coffee-50 dark:hover:bg-coffee-700 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
