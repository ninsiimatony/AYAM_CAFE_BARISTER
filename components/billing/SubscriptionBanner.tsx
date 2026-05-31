'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Subscription } from '@/lib/types'

export default function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/subscriptions/status')
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded || !subscription) return null

  // Past due warning
  if (subscription.status === 'past_due') {
    return (
      <div className="flex items-center justify-between gap-4 bg-red-600 px-4 py-2.5 text-sm text-white">
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Payment failed — your access is at risk.
        </span>
        <Link
          href="/dashboard/billing"
          className="shrink-0 rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30 transition-colors"
        >
          Fix billing →
        </Link>
      </div>
    )
  }

  // Trial countdown
  if (subscription.status === 'trialing' && subscription.trial_end) {
    const daysLeft = Math.ceil(
      (new Date(subscription.trial_end).getTime() - Date.now()) / 86_400_000,
    )
    if (daysLeft <= 3) {
      return (
        <div className="flex items-center justify-between gap-4 bg-amber-500 px-4 py-2.5 text-sm text-white">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your free trial ends in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>.
          </span>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-md bg-white/20 px-3 py-1 font-medium hover:bg-white/30 transition-colors"
          >
            Add payment →
          </Link>
        </div>
      )
    }
  }

  return null
}
