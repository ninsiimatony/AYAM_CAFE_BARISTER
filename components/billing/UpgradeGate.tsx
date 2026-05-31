'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@/lib/types'
import { PLAN_CONFIGS } from '@/lib/types'

interface Props {
  requiredTier: SubscriptionTier
  currentTier:  SubscriptionTier
  children:     React.ReactNode
  featureName?: string
}

export default function UpgradeGate({ requiredTier, currentTier, children, featureName }: Props) {
  const tierRank = { free: 0, pro: 1, elite: 2 } as const
  const hasAccess = tierRank[currentTier] >= tierRank[requiredTier]

  if (hasAccess) return <>{children}</>

  return <LockedOverlay requiredTier={requiredTier} featureName={featureName} />
}

function LockedOverlay({ requiredTier, featureName }: { requiredTier: SubscriptionTier; featureName?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const plan = PLAN_CONFIGS[requiredTier]

  const tierColors = {
    pro:   { ring: 'ring-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    elite: { ring: 'ring-amber-500', btn: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    free:  { ring: 'ring-gray-300', btn: 'bg-gray-600', badge: 'bg-gray-100 text-gray-600' },
  }
  const colors = tierColors[requiredTier]

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch('/api/subscriptions/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tier: requiredTier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center ${colors.ring} ring-1`}>
      {/* Lock icon */}
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${colors.badge}`}>
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <span className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${colors.badge}`}>
        {plan.name} Feature
      </span>

      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
        {featureName ?? 'Premium Feature'}
      </h3>
      <p className="mb-6 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Upgrade to <strong>{plan.name}</strong> to unlock this feature.
        Start with a {plan.trialDays}-day free trial.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={`rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-60 ${colors.btn}`}
        >
          {loading ? 'Redirecting…' : `Upgrade to ${plan.name} — $${plan.price}/mo`}
        </button>
        <button
          onClick={() => router.push('/pricing')}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          Compare all plans →
        </button>
      </div>
    </div>
  )
}
