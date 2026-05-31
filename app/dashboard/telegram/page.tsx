import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import TelegramConnect  from '@/components/telegram/TelegramConnect'
import UpgradeGate      from '@/components/billing/UpgradeGate'
import type { Metadata } from 'next'
import type { TelegramAccount } from '@/lib/types'

export const metadata: Metadata = { title: 'Telegram Alerts — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function TelegramPage() {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, telegram_user_id')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'free'

  const { data: telegramAccount } = await supabase
    .from('telegram_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Telegram Alerts</h1>
        <p className="text-sm text-gray-400 mt-0.5">Connect your Telegram account to receive real-time signal alerts</p>
      </div>

      <UpgradeGate requiredTier="pro" currentTier={tier} featureName="Telegram Signal Alerts">
        <TelegramConnect
          account={telegramAccount as TelegramAccount | null}
          tier={tier}
        />
      </UpgradeGate>

      {/* Feature overview */}
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">What You Get</h2>
        <div className="space-y-3">
          {[
            { tier: 'pro',   label: '⚡ Pro Channel',   features: ['Live signal alerts', 'TP1 / SL notifications', 'Session start alerts'] },
            { tier: 'elite', label: '👑 Elite Channel', features: ['Everything in Pro', 'Priority alerts (10min early)', 'Full AI analysis', 'News event warnings'] },
          ].map((row) => (
            <div key={row.tier} className={`rounded-xl p-4 border ${
              tier === row.tier     ? 'border-blue-700/50 bg-blue-900/20' :
              tier === 'elite' && row.tier === 'pro' ? 'border-white/[0.09] bg-white/[0.04]' :
              'border-white/[0.07] bg-[#111d2e]/20 opacity-60'
            }`}>
              <p className="text-sm font-semibold text-white mb-2">{row.label}</p>
              <ul className="space-y-1">
                {row.features.map((f) => (
                  <li key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  } catch (e) {
    if (isRedirectError(e)) throw e
    redirect('/login')
  }
}
