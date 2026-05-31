import { createClient } from '@/lib/supabase/server'
import PricingCard from '@/components/billing/PricingCard'
import type { Metadata } from 'next'
import type { SubscriptionTier } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Pricing — TONY ELITE AI',
  description: 'Institutional-grade Forex intelligence. Choose the plan that fits your trading style.',
}

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>
}) {
  const params = await searchParams
  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentTier: SubscriptionTier = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    currentTier = (profile?.subscription_tier as SubscriptionTier) ?? 'free'
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Cancelled banner */}
      {params.cancelled && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 text-center text-sm text-gray-300">
          No worries — your plan wasn't changed. Come back when you're ready.
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden px-6 pt-20 pb-16 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-blue-900/40 border border-blue-700/50 px-4 py-1.5 text-xs font-medium text-blue-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Institutional-Grade Forex Intelligence
        </div>

        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
          Smart Money Concepts.<br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Profitable Signals.
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-gray-400 mb-4">
          Join traders using institutional-grade SMC analysis.
          Every plan includes a <strong className="text-white">7-day free trial</strong>.
        </p>
        <p className="text-sm text-gray-500">No credit card required for free plan · Cancel anytime</p>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
          <PricingCard
            tier="free"
            currentTier={currentTier}
            isAuthenticated={!!user}
          />
          <PricingCard
            tier="pro"
            currentTier={currentTier}
            isAuthenticated={!!user}
            highlight
          />
          <PricingCard
            tier="elite"
            currentTier={currentTier}
            isAuthenticated={!!user}
          />
        </div>

        {/* Feature comparison table */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Full Feature Comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  <th className="py-4 px-6 text-left font-medium text-gray-400">Feature</th>
                  <th className="py-4 px-4 text-center font-medium text-gray-400">Free</th>
                  <th className="py-4 px-4 text-center font-semibold text-blue-400">Pro $29</th>
                  <th className="py-4 px-4 text-center font-semibold text-amber-400">Elite $99</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950">
                {[
                  { feature: 'Forex signals per week',     free: 'Up to 3',      pro: 'Unlimited',     elite: 'Unlimited' },
                  { feature: 'Signal tier access',         free: 'Free only',    pro: 'Free + Pro',    elite: 'All tiers' },
                  { feature: 'SMC pattern labels',         free: '✓',            pro: '✓',             elite: '✓' },
                  { feature: 'TP/SL real-time updates',   free: '—',            pro: '✓',             elite: '✓' },
                  { feature: 'Telegram VIP channel',       free: '—',            pro: 'Pro channel',   elite: 'Elite channel' },
                  { feature: 'Trade journal',              free: '50 entries',   pro: 'Unlimited',     elite: 'Unlimited' },
                  { feature: 'Risk calculator',            free: '✓',            pro: '✓',             elite: '✓' },
                  { feature: 'Performance analytics',      free: 'Basic',        pro: 'Full 30d',      elite: 'All-time' },
                  { feature: 'Session intelligence',       free: '—',            pro: '✓',             elite: '✓' },
                  { feature: 'Multi-timeframe bias',       free: '—',            pro: '✓',             elite: '✓' },
                  { feature: 'MT5 account integration',   free: '—',            pro: '—',             elite: '✓' },
                  { feature: 'AI SMC analysis engine',    free: '—',            pro: '—',             elite: '✓' },
                  { feature: 'Auto TP/SL management',     free: '—',            pro: '—',             elite: '✓' },
                  { feature: 'Priority support',           free: '—',            pro: '—',             elite: '✓' },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3.5 px-6 text-gray-300">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center text-gray-500">{row.free}</td>
                    <td className="py-3.5 px-4 text-center text-blue-300">{row.pro}</td>
                    <td className="py-3.5 px-4 text-center text-amber-300">{row.elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How does the 7-day free trial work?',
                a: 'Start your Pro or Elite plan with no charge for 7 days. If you cancel before the trial ends, you will not be billed. You can add your payment method at checkout or do it later in your billing portal.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from the billing portal with one click. You keep access until the end of your current billing period. No cancellation fees, ever.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) via Stripe. All payments are processed securely — we never store card details.',
              },
              {
                q: 'Can I upgrade or downgrade?',
                a: 'Yes. Upgrade anytime and the new tier takes effect immediately (prorated billing). Downgrade takes effect at the next renewal date.',
              },
              {
                q: 'What is the difference between Pro and Elite signals?',
                a: 'Elite signals are our highest-conviction setups — typically higher risk:reward, on major pairs, with full AI SMC analysis and chart annotations. Pro signals are strong setups suitable for all experience levels.',
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-xl border border-gray-800 bg-gray-900 px-6 py-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-white list-none">
                  {item.q}
                  <svg className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-400 text-sm">
            Have questions?{' '}
            <a href="https://t.me/tonyeliteai" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Chat with us on Telegram
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
