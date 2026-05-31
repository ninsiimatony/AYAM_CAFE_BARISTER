import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import Mt5Manager       from '@/components/mt5/Mt5Manager'
import UpgradeGate      from '@/components/billing/UpgradeGate'
import type { Metadata } from 'next'
import type { Mt5Account } from '@/lib/types'

export const metadata: Metadata = { title: 'MT5 Accounts — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function Mt5Page() {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'free'

  const { data: accounts } = tier === 'elite'
    ? await supabase
        .from('mt5_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">MT5 Accounts</h1>
        <p className="text-sm text-gray-400 mt-0.5">Connect your MetaTrader 5 accounts for automated trade execution</p>
      </div>

      <UpgradeGate requiredTier="elite" currentTier={tier} featureName="MT5 Auto-Trading">
        <Mt5Manager accounts={(accounts ?? []) as Mt5Account[]} />
      </UpgradeGate>

      {tier === 'elite' && (
        <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">MT5 Integration Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🔗', title: 'Multi-Broker Support',    desc: 'Connect accounts from any MT5 broker' },
              { icon: '⚡', title: 'Auto Execution',          desc: 'Signals executed automatically when published' },
              { icon: '🔒', title: 'Risk Management',         desc: 'Per-account risk limits and drawdown stops' },
              { icon: '📊', title: 'Live P&L Sync',           desc: 'Real-time balance and equity tracking' },
              { icon: '🎯', title: 'Partial TP Management',   desc: 'Automatic partial close at TP1' },
              { icon: '🛡️', title: 'Break-Even Auto Move',    desc: 'SL moved to entry when TP1 is hit' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
  } catch (e) {
    if (isRedirectError(e)) throw e
    redirect('/login')
  }
}
