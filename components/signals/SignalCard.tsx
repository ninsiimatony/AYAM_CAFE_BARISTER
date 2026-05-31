'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Signal, SubscriptionTier } from '@/lib/types'
import { canAccessSignal, SMC_PATTERN_LABELS, formatRR } from '@/lib/types'

interface Props {
  signal:      Signal
  userTier:    SubscriptionTier
  isStaff:     boolean
  isDemoData?: boolean
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',    color: 'bg-gray-700 text-gray-300',              dot: 'bg-gray-500' },
  active:   { label: 'Active',     color: 'bg-green-900/50 text-green-300',          dot: 'bg-green-400 animate-pulse' },
  tp1_hit:  { label: 'TP1 Hit',   color: 'bg-blue-900/50 text-blue-300',            dot: 'bg-blue-400' },
  tp2_hit:  { label: 'TP2 Hit',   color: 'bg-blue-900/60 text-blue-200',            dot: 'bg-blue-300' },
  tp3_hit:  { label: 'Full TP',   color: 'bg-emerald-900/50 text-emerald-300',      dot: 'bg-emerald-400' },
  sl_hit:   { label: 'SL Hit',    color: 'bg-red-900/50 text-red-300',             dot: 'bg-red-400' },
  be_hit:   { label: 'Break-even', color: 'bg-yellow-900/50 text-yellow-300',       dot: 'bg-yellow-400' },
  cancelled:{ label: 'Cancelled', color: 'bg-[#111d2e] text-gray-500',               dot: 'bg-gray-600' },
  expired:  { label: 'Expired',   color: 'bg-[#111d2e] text-gray-500',               dot: 'bg-gray-600' },
} as const

const TIER_BADGE = {
  free:  null,
  pro:   { label: '⚡ PRO',   color: 'bg-blue-900/60 text-blue-300' },
  elite: { label: '👑 ELITE', color: 'bg-amber-900/60 text-amber-300' },
}

export default function SignalCard({ signal, userTier, isStaff, isDemoData }: Props) {
  const [publishing, setPublishing] = useState(false)
  const hasAccess = canAccessSignal(userTier, signal.tier_required) || isStaff

  const statusCfg = STATUS_CONFIG[signal.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
  const tierBadge = TIER_BADGE[signal.tier_required]
  const dirColor  = signal.direction === 'buy' ? 'text-emerald-400' : 'text-red-400'
  const dirBg     = signal.direction === 'buy' ? 'bg-emerald-900/30' : 'bg-red-900/30'
  const pipColor  = signal.result_pips != null
    ? signal.result_pips >= 0 ? 'text-emerald-400' : 'text-red-400'
    : 'text-gray-400'

  async function handlePublish(e: React.MouseEvent) {
    e.preventDefault()
    if (!isStaff || publishing) return
    setPublishing(true)
    try {
      await fetch(`/api/signals/${signal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      })
      window.location.reload()
    } finally {
      setPublishing(false)
    }
  }

  const CardWrapper = isDemoData
    ? ({ children }: { children: React.ReactNode }) => <div className="block group">{children}</div>
    : ({ children }: { children: React.ReactNode }) => <Link href={`/dashboard/signals/${signal.id}`} className="block group">{children}</Link>

  return (
    <CardWrapper>
      <div className={`
        relative overflow-hidden rounded-2xl border transition-all duration-200
        ${hasAccess
          ? 'bg-[#0d1520] border-white/[0.09] hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-900/10'
          : 'bg-[#0d1520]/50 border-white/[0.07] cursor-not-allowed'
        }
      `}>
        {/* Locked overlay */}
        {!hasAccess && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[#0a0f1e]/80 backdrop-blur-sm">
            <svg className="h-8 w-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-gray-400 font-medium">
              {tierBadge?.label ?? 'Upgrade to view'}
            </span>
          </div>
        )}

        {/* Card content */}
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-lg px-2.5 py-1 text-sm font-bold ${dirColor} ${dirBg}`}>
                {signal.direction?.toUpperCase()}
              </span>
              <span className="text-base font-bold text-white">{signal.pair}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {tierBadge && (
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${tierBadge.color}`}>
                  {tierBadge.label}
                </span>
              )}
              <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusCfg.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Levels grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-white/[0.05] px-2.5 py-2">
              <p className="text-[10px] text-gray-500 mb-0.5">Entry</p>
              <p className="text-xs font-mono font-semibold text-gray-200">{signal.entry_zone_low?.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-red-900/20 px-2.5 py-2">
              <p className="text-[10px] text-gray-500 mb-0.5">SL</p>
              <p className="text-xs font-mono font-semibold text-red-300">{signal.stop_loss?.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-emerald-900/20 px-2.5 py-2">
              <p className="text-[10px] text-gray-500 mb-0.5">TP1 {signal.risk_reward_1 ? `(${formatRR(signal.risk_reward_1)})` : ''}</p>
              <p className="text-xs font-mono font-semibold text-emerald-300">{signal.take_profit_1?.toFixed(4)}</p>
            </div>
          </div>

          {/* SMC patterns */}
          {signal.smc_patterns?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {signal.smc_patterns.slice(0, 3).map((p) => (
                <span key={p} className="rounded-md bg-purple-900/30 border border-purple-800/40 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
                  {SMC_PATTERN_LABELS[p] ?? p}
                </span>
              ))}
              {signal.smc_patterns.length > 3 && (
                <span className="rounded-md bg-[#111d2e] px-1.5 py-0.5 text-[10px] text-gray-500">
                  +{signal.smc_patterns.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{signal.timeframe}</span>
              {signal.session && <span className="capitalize">{signal.session.replace('_', '/')}</span>}
              {signal.confluence_score && (
                <span className="text-blue-400">{signal.confluence_score}/10</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {signal.result_pips != null && (
                <span className={`text-xs font-semibold ${pipColor}`}>
                  {signal.result_pips > 0 ? '+' : ''}{signal.result_pips?.toFixed(1)} pips
                </span>
              )}
              {isStaff && signal.status === 'pending' && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="rounded-md bg-blue-600 hover:bg-blue-700 px-2 py-1 text-[10px] font-bold text-white transition-colors disabled:opacity-50"
                >
                  {publishing ? '…' : 'PUBLISH'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}
