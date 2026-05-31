import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import EquityCurve      from '@/components/charts/EquityCurve'
import UpgradeGate      from '@/components/billing/UpgradeGate'
import type { Metadata } from 'next'
import type { PerformanceSnapshot } from '@/lib/types'

export const metadata: Metadata = { title: 'Analytics — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'free'

  // Fetch 30d stats (all tiers)
  const { data: stats } = await supabase
    .from('user_stats_30d')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Fetch snapshots for equity curve (pro+)
  const { data: snapshots } = tier !== 'free'
    ? await supabase
        .from('performance_snapshots')
        .select('snapshot_date, equity_end, net_profit, win_rate, total_trades')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(90)
    : { data: null }

  // Signal performance (all tiers)
  const { data: signalPerf } = await supabase
    .from('signal_performance')
    .select('*')
    .order('total_signals', { ascending: false })
    .limit(10)

  const kpis = [
    {
      label: 'Win Rate',
      value: stats?.avg_win_rate ? `${Number(stats.avg_win_rate).toFixed(1)}%` : '—',
      color: 'text-emerald-400',
      icon: '🎯',
    },
    {
      label: 'Profit Factor',
      value: stats?.avg_profit_factor ? Number(stats.avg_profit_factor).toFixed(2) : '—',
      color: Number(stats?.avg_profit_factor ?? 0) >= 1.5 ? 'text-emerald-400' : 'text-red-400',
      icon: '📈',
    },
    {
      label: 'Net Pips (30d)',
      value: stats?.total_pips_30d != null ? `${Number(stats.total_pips_30d) > 0 ? '+' : ''}${Number(stats.total_pips_30d).toFixed(1)}` : '—',
      color: Number(stats?.total_pips_30d ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
      icon: '⚡',
    },
    {
      label: 'Max Drawdown',
      value: stats?.max_drawdown_pct_30d ? `${Number(stats.max_drawdown_pct_30d).toFixed(1)}%` : '—',
      color: Number(stats?.max_drawdown_pct_30d ?? 0) < 10 ? 'text-emerald-400' : 'text-red-400',
      icon: '📉',
    },
    {
      label: 'Total Trades',
      value: stats?.total_trades?.toString() ?? '0',
      color: 'text-blue-400',
      icon: '📊',
    },
    {
      label: 'Win / Loss',
      value: stats ? `${stats.winning_trades ?? 0} / ${stats.losing_trades ?? 0}` : '—',
      color: 'text-gray-300',
      icon: '⚖️',
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Last 30 days — your trading edge at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl bg-gray-900 border border-gray-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{k.icon}</span>
              <span className="text-[11px] text-gray-400">{k.label}</span>
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Equity curve — Pro+ */}
      <UpgradeGate requiredTier="pro" currentTier={tier} featureName="Equity Curve & Full Analytics">
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Equity Curve (90 days)</h2>
          {snapshots && snapshots.length > 0 ? (
            <EquityCurve snapshots={snapshots as PerformanceSnapshot[]} />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
              No snapshot data yet — snapshots are generated daily after your first trade.
            </div>
          )}
        </div>
      </UpgradeGate>

      {/* Signal performance table — all tiers */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Signal Performance by Pair</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400">Pair</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-400">Signals</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-400">Win Rate</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-400">Avg Pips</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-400">Total Pips</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-400">Avg RR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {!signalPerf?.length ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500 text-xs">
                    No closed signals yet
                  </td>
                </tr>
              ) : signalPerf.map((p) => {
                const wr = Number(p.win_rate_pct ?? 0)
                return (
                  <tr key={p.pair} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{p.pair}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{p.total_signals}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${wr >= 60 ? 'text-emerald-400' : wr >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {wr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={Number(p.avg_pips ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {Number(p.avg_pips ?? 0) > 0 ? '+' : ''}{Number(p.avg_pips ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={Number(p.total_pips ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {Number(p.total_pips ?? 0) > 0 ? '+' : ''}{Number(p.total_pips ?? 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-blue-300">{Number(p.avg_rr ?? 0).toFixed(2)}R</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
