import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, role, subscription_tier, risk_per_trade_pct').eq('id', user.id).single()
    : { data: null }

  const tier        = profile?.subscription_tier ?? 'free'
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Trader'
  const isStaff     = ['admin', 'staff'].includes(profile?.role ?? '')
  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch recent live signals (up to 5)
  const { data: activeSignals } = await supabase
    .from('signals')
    .select('id, pair, direction, status, tier_required, entry_zone_low, stop_loss, take_profit_1, confluence_score, published_at')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(5)

  // Fetch user 30d stats
  const { data: stats } = await supabase
    .from('user_stats_30d')
    .select('avg_win_rate, total_trades, avg_profit_factor, total_pips_30d')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  const TIER_CONFIG = {
    free:  { label: 'Free',  color: 'text-gray-400',    bg: 'bg-gray-800' },
    pro:   { label: 'Pro',   color: 'text-blue-400',    bg: 'bg-blue-900/30' },
    elite: { label: 'Elite', color: 'text-amber-400',   bg: 'bg-amber-900/30' },
  } as const

  const tierCfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {displayName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here&apos;s your trading overview</p>
        </div>
        <span className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase ${tierCfg.bg} ${tierCfg.color}`}>
          {tierCfg.label}
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Win Rate (30d)"    value={stats?.avg_win_rate ? `${Number(stats.avg_win_rate).toFixed(1)}%` : '—'}   color="text-emerald-400" />
        <KpiCard label="Total Trades"      value={stats?.total_trades?.toString() ?? '0'}                                    color="text-blue-400" />
        <KpiCard label="Profit Factor"     value={stats?.avg_profit_factor ? Number(stats.avg_profit_factor).toFixed(2) : '—'} color={Number(stats?.avg_profit_factor ?? 0) >= 1.5 ? 'text-emerald-400' : 'text-red-400'} />
        <KpiCard label="Net Pips (30d)"    value={stats?.total_pips_30d != null ? `${Number(stats.total_pips_30d) > 0 ? '+' : ''}${Number(stats.total_pips_30d).toFixed(1)}` : '—'} color={Number(stats?.total_pips_30d ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      {/* Live signals + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live signals */}
        <div className="lg:col-span-2 rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-base font-semibold text-white">Live Signals</h2>
            </div>
            <Link href="/dashboard/signals" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {!activeSignals?.length ? (
              <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
                No active signals right now
              </div>
            ) : activeSignals.map((s) => {
              const dirColor = s.direction === 'buy' ? 'text-emerald-400' : 'text-red-400'
              const dirBg    = s.direction === 'buy' ? 'bg-emerald-900/30' : 'bg-red-900/30'
              return (
                <Link key={s.id} href={`/dashboard/signals/${s.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${dirColor} ${dirBg}`}>{s.direction}</span>
                    <span className="text-sm font-semibold text-white">{s.pair}</span>
                    {s.tier_required !== 'free' && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${s.tier_required === 'elite' ? 'bg-amber-900/40 text-amber-400' : 'bg-blue-900/40 text-blue-400'}`}>
                        {s.tier_required}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {s.confluence_score && <span className="text-blue-400">{s.confluence_score}/10</span>}
                    <span className="text-gray-500 hidden sm:block">{s.published_at ? new Date(s.published_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    <span className="text-gray-600">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/signals',    label: 'View All Signals',     icon: '📡' },
              { href: '/dashboard/risk',        label: 'Risk Calculator',      icon: '🎯' },
              { href: '/dashboard/journal/new', label: 'Log a Trade',          icon: '📓' },
              { href: '/dashboard/analytics',   label: 'Performance Stats',    icon: '📊' },
              { href: '/dashboard/telegram',    label: 'Telegram Alerts',      icon: '✈' },
              ...(tier === 'elite' ? [{ href: '/dashboard/mt5', label: 'MT5 Accounts', icon: '⚡' }] : []),
              ...(isStaff ? [{ href: '/dashboard/admin', label: 'Admin Panel', icon: '🛡️' }] : []),
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-transparent hover:border-gray-700 px-4 py-3 transition-all">
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-gray-300">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {tier === 'free' && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/40 p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-white">Unlock Pro Signals</p>
            <p className="text-sm text-gray-400 mt-0.5">Get real-time SMC signals, Telegram alerts, and equity curve analytics</p>
          </div>
          <Link href="/pricing"
            className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors">
            Upgrade — $29/mo
          </Link>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
