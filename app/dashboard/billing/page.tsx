import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import CurrentPlanCard  from '@/components/billing/CurrentPlanCard'
import PricingCard      from '@/components/billing/PricingCard'
import type { Metadata } from 'next'
import type { Profile, Subscription, SubscriptionTier } from '@/lib/types'

export const metadata: Metadata = { title: 'Billing — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; tier?: string }>
}) {
  const params   = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due', 'cancelled', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentTier = (profile as Profile).subscription_tier

  // Plans the user can upgrade to
  const upgradePlans: SubscriptionTier[] = (['pro', 'elite'] as const).filter((t) => {
    const tierRank = { free: 0, pro: 1, elite: 2 }
    return tierRank[t] > tierRank[currentTier]
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Success banner */}
      {params.success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">
              {params.tier ? `Welcome to ${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)}!` : 'Subscription activated!'}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Your account will be updated within seconds. Refresh if you don't see changes.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your plan, payment method, and billing history.</p>
      </div>

      {/* Current plan */}
      <CurrentPlanCard
        profile={profile as Profile}
        subscription={subscription as Subscription | null}
      />

      {/* Usage limits */}
      <UsageLimitsCard currentTier={currentTier} />

      {/* Upgrade options */}
      {upgradePlans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upgrade your plan
          </h2>
          <div className={`grid gap-6 ${upgradePlans.length === 1 ? 'max-w-sm' : 'grid-cols-1 md:grid-cols-2'}`}>
            {upgradePlans.map((tier) => (
              <PricingCard
                key={tier}
                tier={tier}
                currentTier={currentTier}
                isAuthenticated
                highlight={tier === 'pro' && currentTier === 'free'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancellation info */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.09] bg-gray-50 dark:bg-[#111d2e]/50 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Need to cancel?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          You can cancel your subscription at any time from the billing portal. You keep access until the end of your current billing period.
        </p>
        <a href="/pricing" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          View all plans →
        </a>
      </div>
    </div>
  )
}

function UsageLimitsCard({ currentTier }: { currentTier: SubscriptionTier }) {
  const limits = {
    free:  { signals: '3 / week',   journal: '50 entries', analytics: 'Basic (7d)', telegram: 'Not included', mt5: 'Not included', ai: 'Not included' },
    pro:   { signals: 'Unlimited',  journal: 'Unlimited',   analytics: 'Full (30d)', telegram: 'Pro VIP',      mt5: 'Not included', ai: 'Not included' },
    elite: { signals: 'Unlimited',  journal: 'Unlimited',   analytics: 'All-time',  telegram: 'Elite VIP',     mt5: 'Included',     ai: 'Included' },
  }
  const l = limits[currentTier]

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.09] bg-white dark:bg-[#0d1520] p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Your Usage & Limits</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Signals access',    value: l.signals },
          { label: 'Trade journal',     value: l.journal },
          { label: 'Analytics window',  value: l.analytics },
          { label: 'Telegram VIP',      value: l.telegram },
          { label: 'MT5 integration',   value: l.mt5 },
          { label: 'AI SMC engine',     value: l.ai },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-gray-50 dark:bg-[#111d2e] p-3.5">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className={`text-sm font-semibold ${item.value.startsWith('Not') ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
