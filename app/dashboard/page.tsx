import { createClient } from '@/lib/supabase/server'
import Link             from 'next/link'
import type { Metadata } from 'next'
import LivePrice from '@/components/LivePrice'
import {
  Activity, SlidersHorizontal, ClipboardList, BarChart3,
  Bell, Monitor, KeyRound,
} from 'lucide-react'

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

  const { data: activeSignals } = await supabase
    .from('signals')
    .select('id, pair, direction, status, tier_required, entry_zone_low, stop_loss, take_profit_1, confluence_score, published_at')
    .eq('status', 'active')
    .order('published_at', { ascending: false })
    .limit(5)

  const { data: stats } = await supabase
    .from('user_stats_30d')
    .select('avg_win_rate, total_trades, avg_profit_factor, total_pips_30d')
    .eq('user_id', user?.id ?? '')
    .maybeSingle()

  const TIER_CONFIG = {
    free:  { label: 'Free',  color: 'text-gray-400',  bg: 'bg-white/[0.06] border-white/10' },
    pro:   { label: 'Pro',   color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
    elite: { label: 'Elite', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  } as const

  const tierCfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG]

  const winRate     = stats?.avg_win_rate      ? `${Number(stats.avg_win_rate).toFixed(1)}%`       : null
  const profitFactor = stats?.avg_profit_factor ? Number(stats.avg_profit_factor).toFixed(2)        : null
  const netPips     = stats?.total_pips_30d != null
    ? `${Number(stats.total_pips_30d) > 0 ? '+' : ''}${Number(stats.total_pips_30d).toFixed(1)}`
    : null

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">{displayName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LivePrice />
          <span className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${tierCfg.bg} ${tierCfg.color}`}>
            {tierCfg.label}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Win Rate (30d)"  value={winRate}      suffix={null}  color="text-emerald-400" />
        <KpiCard label="Total Trades"    value={stats?.total_trades?.toString() ?? '0'} suffix={null} color="text-blue-400" />
        <KpiCard label="Profit Factor"   value={profitFactor} suffix={null}  color={Number(stats?.avg_profit_factor ?? 0) >= 1.5 ? 'text-emerald-400' : 'text-red-400'} />
        <KpiCard label="Net Pips (30d)"  value={netPips}      suffix="pips"  color={Number(stats?.total_pips_30d ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      {/* Live signals + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Live signals */}
        <div className="lg:col-span-2 rounded-xl bg-[#0d1520] border border-white/[0.07] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-[13px] font-semibold text-white tracking-wide">Live Signals</h2>
            </div>
            <Link href="/dashboard/signals" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {!activeSignals?.length ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Activity className="h-8 w-8 text-gray-800" strokeWidth={1.25} />
                <p className="text-gray-600 text-sm">No active signals right now</p>
              </div>
            ) : activeSignals.map((s) => {
              const isBuy   = s.direction === 'buy'
              const dirColor = isBuy ? 'text-emerald-400' : 'text-red-400'
              const dirBg    = isBuy ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
              return (
                <Link key={s.id} href={`/dashboard/signals/${s.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase border ${dirColor} ${dirBg}`}>
                      {s.direction}
                    </span>
                    <span className="text-sm font-semibold text-white">{s.pair}</span>
                    {s.tier_required !== 'free' && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${
                        s.tier_required === 'elite'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {s.tier_required}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {s.confluence_score && (
                      <span className="text-blue-400 font-medium">{s.confluence_score}/10</span>
                    )}
                    <span className="text-gray-700 hidden sm:block">
                      {s.published_at
                        ? new Date(s.published_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    <span className="text-gray-700">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5">
          <h2 className="text-[13px] font-semibold text-white tracking-wide mb-3">Quick Actions</h2>
          <div className="space-y-1.5">
            {[
              { href: '/dashboard/signals',    label: 'View All Signals',  Icon: Activity },
              { href: '/dashboard/risk',        label: 'Risk Calculator',   Icon: SlidersHorizontal },
              { href: '/dashboard/journal/new', label: 'Log a Trade',       Icon: ClipboardList },
              { href: '/dashboard/analytics',   label: 'Performance Stats', Icon: BarChart3 },
              { href: '/dashboard/telegram',    label: 'Telegram Alerts',   Icon: Bell },
              ...(tier === 'elite' ? [{ href: '/dashboard/mt5',   label: 'MT5 Accounts', Icon: Monitor  }] : []),
              ...(isStaff          ? [{ href: '/dashboard/admin', label: 'Admin Panel',  Icon: KeyRound }] : []),
            ].map(({ href, label, Icon }) => (
              <Link key={label} href={href}
                className="group flex items-center gap-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] px-3.5 py-2.5 transition-all">
                <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-400 flex-shrink-0 transition-colors" strokeWidth={1.75} />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upgrade CTA for free users */}
      {tier === 'free' && (
        <div className="rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/30 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Unlock Pro Signals</p>
            <p className="text-[12px] text-gray-500 mt-0.5">Real-time SMC signals, Telegram alerts &amp; analytics</p>
          </div>
          <Link href="/pricing"
            className="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors whitespace-nowrap">
            Upgrade — $29/mo
          </Link>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, suffix, color }: {
  label: string
  value: string | null
  suffix: string | null
  color: string
}) {
  const empty = value === null
  return (
    <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-4">
      <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest mb-2">{label}</p>
      {empty ? (
        <p className="text-lg font-bold text-gray-800">—</p>
      ) : (
        <p className={`text-xl font-bold tabular-nums ${color}`}>
          {value}
          {suffix && <span className="text-xs font-normal text-gray-600 ml-1">{suffix}</span>}
        </p>
      )}
    </div>
  )
}
