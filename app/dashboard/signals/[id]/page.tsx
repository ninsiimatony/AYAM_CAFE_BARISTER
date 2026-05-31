import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Signal, SignalResult } from '@/lib/types'
import { SMC_PATTERN_LABELS, formatRR, canAccessSignal } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Signal ${id.slice(0, 8)} — TONY ELITE AI` }
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',     color: 'text-gray-400',    bg: 'bg-gray-800' },
  active:    { label: 'Active',      color: 'text-green-400',   bg: 'bg-green-900/40' },
  tp1_hit:   { label: 'TP1 Hit',    color: 'text-blue-400',    bg: 'bg-blue-900/40' },
  tp2_hit:   { label: 'TP2 Hit',    color: 'text-blue-300',    bg: 'bg-blue-900/50' },
  tp3_hit:   { label: 'Full TP',    color: 'text-emerald-400', bg: 'bg-emerald-900/40' },
  sl_hit:    { label: 'SL Hit',     color: 'text-red-400',     bg: 'bg-red-900/40' },
  be_hit:    { label: 'Break-even', color: 'text-yellow-400',  bg: 'bg-yellow-900/40' },
  cancelled: { label: 'Cancelled',  color: 'text-gray-500',    bg: 'bg-gray-800' },
  expired:   { label: 'Expired',    color: 'text-gray-500',    bg: 'bg-gray-800' },
} as const

export default async function SignalDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single()

  const isStaff = ['admin', 'staff'].includes(profile?.role ?? '')
  const tier    = profile?.subscription_tier ?? 'free'

  const { data: signalRaw } = await supabase
    .from('signals')
    .select(`*, creator:profiles!signals_created_by_fkey(id, full_name), signal_results(*)`)
    .eq('id', id)
    .maybeSingle()

  if (!signalRaw) notFound()

  const signal  = signalRaw as Signal & { signal_results: SignalResult[] }
  const results = (signalRaw.signal_results ?? []) as SignalResult[]
  const hasAccess = canAccessSignal(tier, signal.tier_required) || isStaff

  const statusCfg  = STATUS_CONFIG[signal.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const dirColor   = signal.direction === 'buy' ? 'text-emerald-400' : 'text-red-400'
  const dirBg      = signal.direction === 'buy' ? 'bg-emerald-900/30' : 'bg-red-900/30'

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/dashboard/signals" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Signals
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`rounded-lg px-3 py-1.5 text-sm font-bold uppercase ${dirColor} ${dirBg}`}>
            {signal.direction}
          </span>
          <h1 className="text-2xl font-bold text-white">{signal.pair}</h1>
          <span className="text-sm text-gray-500">{signal.timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${statusCfg.color} ${statusCfg.bg}`}>
            {statusCfg.label}
          </span>
          {signal.confluence_score && (
            <span className="rounded-lg bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-300">
              {signal.confluence_score}/10 confluence
            </span>
          )}
        </div>
      </div>

      {!hasAccess && (
        <div className="rounded-2xl bg-amber-900/20 border border-amber-800/40 p-4 text-sm text-amber-300">
          This is a {signal.tier_required.toUpperCase()} signal. Upgrade to view full details.
        </div>
      )}

      {/* Price levels */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Price Levels</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <PriceBox label="Entry Zone" value={`${signal.entry_zone_low?.toFixed(5)} – ${signal.entry_zone_high?.toFixed(5)}`} />
          <PriceBox label="Stop Loss"  value={signal.stop_loss?.toFixed(5)} accent="red" />
          <PriceBox label="TP 1"       value={signal.take_profit_1?.toFixed(5)} sub={signal.risk_reward_1 ? formatRR(signal.risk_reward_1) : undefined} accent="green" />
          {signal.take_profit_2 && (
            <PriceBox label="TP 2" value={signal.take_profit_2.toFixed(5)} sub={signal.risk_reward_2 ? formatRR(signal.risk_reward_2) : undefined} accent="green" />
          )}
          {signal.take_profit_3 && (
            <PriceBox label="TP 3" value={signal.take_profit_3.toFixed(5)} sub={signal.risk_reward_3 ? formatRR(signal.risk_reward_3) : undefined} accent="green" />
          )}
          {signal.pip_risk && (
            <PriceBox label="Pip Risk" value={`${signal.pip_risk.toFixed(1)} pips`} />
          )}
        </div>
      </div>

      {/* SMC context */}
      <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">SMC Context</h2>
        <div className="flex flex-wrap gap-2">
          {signal.smc_patterns?.map((p) => (
            <span key={p} className="rounded-md bg-purple-900/30 border border-purple-800/40 px-2.5 py-1 text-xs font-medium text-purple-300">
              {SMC_PATTERN_LABELS[p] ?? p}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {signal.bias && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">HTF Bias</p>
              <p className={`font-semibold capitalize ${signal.bias === 'bullish' ? 'text-emerald-400' : signal.bias === 'bearish' ? 'text-red-400' : 'text-gray-400'}`}>
                {signal.bias}
              </p>
            </div>
          )}
          {signal.session && (
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Session</p>
              <p className="text-gray-300 capitalize font-semibold">{signal.session.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {hasAccess && signal.analysis_text && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Analysis</h2>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{signal.analysis_text}</p>
        </div>
      )}

      {/* Notes */}
      {isStaff && signal.notes && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Staff Notes</h2>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{signal.notes}</p>
        </div>
      )}

      {/* Result events */}
      {results.length > 0 && (
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Signal Events</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-6 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.event.includes('tp') ? 'bg-emerald-900/40 text-emerald-400' :
                    r.event === 'sl_hit'   ? 'bg-red-900/40 text-red-400'         :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {r.event.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-gray-300">{r.price?.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {r.pips != null && (
                    <span className={`font-semibold ${r.pips >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.pips > 0 ? '+' : ''}{r.pips.toFixed(1)} pips
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{new Date(r.occurred_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {signal.creator?.full_name && <span>Posted by {signal.creator.full_name}</span>}
        {signal.published_at && <span>Published {new Date(signal.published_at).toLocaleString()}</span>}
        {signal.closed_at && <span>Closed {new Date(signal.closed_at).toLocaleString()}</span>}
      </div>
    </div>
  )
}

function PriceBox({ label, value, sub, accent }: { label: string; value?: string | null; sub?: string; accent?: 'red' | 'green' }) {
  const color = accent === 'red' ? 'text-red-300' : accent === 'green' ? 'text-emerald-300' : 'text-gray-200'
  const bg    = accent === 'red' ? 'bg-red-900/20' : accent === 'green' ? 'bg-emerald-900/20' : 'bg-gray-800/60'
  return (
    <div className={`rounded-xl ${bg} px-3 py-2.5`}>
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-mono font-semibold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}
