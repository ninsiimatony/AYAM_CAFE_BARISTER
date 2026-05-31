'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@/lib/types'
import { PLAN_CONFIGS } from '@/lib/types'

interface Props {
  tier: SubscriptionTier
  currentTier?: SubscriptionTier
  isAuthenticated?: boolean
  highlight?: boolean
}

export default function PricingCard({ tier, currentTier = 'free', isAuthenticated = false, highlight = false }: Props) {
  const plan = PLAN_CONFIGS[tier]
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isCurrent     = currentTier === tier
  const isDowngrade   = tier === 'free'
  const tierRank      = { free: 0, pro: 1, elite: 2 } as const
  const isUpgrade     = tierRank[tier] > tierRank[currentTier]

  async function handleClick() {
    if (!isAuthenticated) { router.push('/login'); return }
    if (isCurrent || isDowngrade) return

    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else console.error(data.error)
    } finally {
      setLoading(false)
    }
  }

  const tierColors = {
    free:  'border-gray-200 dark:border-gray-700',
    pro:   'border-blue-400 dark:border-blue-500',
    elite: 'border-amber-400 dark:border-amber-500',
  }

  const badgeColors = {
    free:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    pro:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    elite: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  }

  const btnColors = {
    free:  'bg-gray-100 text-gray-500 cursor-not-allowed',
    pro:   'bg-blue-600 hover:bg-blue-700 text-white',
    elite: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg',
  }

  function ctaLabel() {
    if (tier === 'free') return 'Current Plan'
    if (isCurrent) return 'Current Plan'
    if (!isAuthenticated) return 'Get Started'
    if (isUpgrade) return `Start ${plan.trialDays}-Day Free Trial`
    return 'Downgrade'
  }

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border-2 bg-white dark:bg-gray-900 p-8 transition-all
        ${tierColors[tier]}
        ${highlight ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-950 scale-105' : ''}
      `}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white tracking-wide uppercase">
          Most Popular
        </div>
      )}

      {tier === 'elite' && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-bold text-white tracking-wide uppercase">
          Institutional
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-3 ${badgeColors[tier]}`}>
          {plan.name}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-400 text-sm">/month</span>
          )}
        </div>
        {plan.price > 0 && (
          <p className="text-xs text-gray-400 mt-1">7-day free trial — cancel anytime</p>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
            <svg className={`mt-0.5 h-4 w-4 shrink-0 ${tier === 'elite' ? 'text-amber-500' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {plan.telegramAccess && (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-900/30 px-2 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram VIP
          </span>
        )}
        {plan.mt5Access && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            MT5 Integration
          </span>
        )}
        {plan.aiAnalysis && (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
            AI SMC Engine
          </span>
        )}
      </div>

      <button
        onClick={handleClick}
        disabled={loading || isCurrent || tier === 'free'}
        className={`
          w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
          ${isCurrent || tier === 'free' ? btnColors.free : btnColors[tier]}
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting…
          </span>
        ) : ctaLabel()}
      </button>
    </div>
  )
}
