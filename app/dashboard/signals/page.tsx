import { createClient } from '@/lib/supabase/server'
import SignalFeed     from '@/components/signals/SignalFeed'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Signals — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('subscription_tier, role').eq('id', user.id).single()
    : { data: null }

  const tier    = profile?.subscription_tier ?? 'free'
  const isStaff = ['admin', 'staff'].includes(profile?.role ?? '')

  // Fetch initial signals server-side
  const { data: signals } = await supabase
    .from('signals')
    .select('*, creator:profiles!signals_created_by_fkey(id, full_name)')
    .in('status', ['pending', 'active', 'tp1_hit', 'tp2_hit'])
    .order('created_at', { ascending: false })
    .limit(20)

  // Signal performance summary
  const { data: perf } = await supabase
    .from('signal_performance')
    .select('*')
    .order('total_signals', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Signal Feed</h1>
          <p className="text-sm text-gray-400 mt-0.5">Institutional SMC signals — real-time</p>
        </div>
        {isStaff && (
          <a
            href="/dashboard/admin/signals/new"
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Signal
          </a>
        )}
      </div>

      {/* Performance strip */}
      {perf && perf.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {perf.map((p) => (
            <div key={p.pair} className="rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{p.pair}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-white">{Number(p.win_rate_pct ?? 0).toFixed(0)}%</span>
                <span className="text-xs text-gray-500">win rate</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{p.total_signals} signals</p>
            </div>
          ))}
        </div>
      )}

      <SignalFeed
        initialSignals={signals ?? []}
        userTier={tier}
        isStaff={isStaff}
      />
    </div>
  )
}
