'use client'

import Link from 'next/link'
import type { JournalEntry } from '@/lib/types'
import { SMC_PATTERN_LABELS } from '@/lib/types'

interface Props {
  entries: JournalEntry[]
}

const EMOTION_LABEL: Record<string, string> = {
  disciplined:   '🎯 Disciplined',
  confident:     '💪 Confident',
  neutral:       '😐 Neutral',
  impatient:     '⏩ Impatient',
  fearful:       '😰 Fearful',
  greedy:        '💰 Greedy',
  fomo:          '🚀 FOMO',
  revenge:       '😤 Revenge',
  overconfident: '😎 Overconfident',
}

const RATING_COLOR = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400']
const STARS = (r: string) => '★'.repeat(parseInt(r)) + '☆'.repeat(5 - parseInt(r))

export default function JournalFeed({ entries }: Props) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl bg-gray-900 border border-gray-800 flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="text-4xl mb-3">📓</div>
        <p className="text-sm">No journal entries yet</p>
        <p className="text-xs mt-1">Start documenting your trades to improve consistency</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isWin    = entry.is_winner === true
        const isLoss   = entry.is_winner === false
        const dirColor = entry.direction === 'buy' ? 'text-emerald-400' : 'text-red-400'
        const dirBg    = entry.direction === 'buy' ? 'bg-emerald-900/30' : 'bg-red-900/30'

        return (
          <Link key={entry.id} href={`/dashboard/journal/${entry.id}`} className="block group">
            <div className="rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-600/50 transition-all p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${dirColor} ${dirBg}`}>
                    {entry.direction}
                  </span>
                  <span className="text-base font-bold text-white">{entry.pair}</span>
                  {entry.timeframe_used && <span className="text-xs text-gray-500">{entry.timeframe_used}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {entry.pips_result != null && (
                    <span className={`text-sm font-bold ${entry.pips_result >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.pips_result > 0 ? '+' : ''}{entry.pips_result.toFixed(1)} pips
                    </span>
                  )}
                  {entry.is_winner != null && (
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${isWin ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                      {isWin ? 'WIN' : 'LOSS'}
                    </span>
                  )}
                </div>
              </div>

              {/* Emotion + rating row */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {entry.emotion_before && (
                  <span className="text-gray-400">{EMOTION_LABEL[entry.emotion_before] ?? entry.emotion_before}</span>
                )}
                {entry.execution_rating && (
                  <span className={`font-mono ${RATING_COLOR[parseInt(entry.execution_rating)]}`}>
                    {STARS(entry.execution_rating)} Execution
                  </span>
                )}
                {entry.followed_plan === false && (
                  <span className="text-amber-400 text-[10px] bg-amber-900/20 rounded px-1.5 py-0.5">⚠ Broke plan</span>
                )}
                {entry.revenge_trade && (
                  <span className="text-red-400 text-[10px] bg-red-900/20 rounded px-1.5 py-0.5">⚠ Revenge trade</span>
                )}
              </div>

              {/* Entry reason (preview) */}
              {entry.entry_reason && (
                <p className="text-xs text-gray-400 line-clamp-2">{entry.entry_reason}</p>
              )}

              {/* Patterns */}
              {entry.setup_type && entry.setup_type.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.setup_type.slice(0, 3).map((p) => (
                    <span key={p} className="rounded-md bg-purple-900/30 border border-purple-800/40 px-1.5 py-0.5 text-[10px] text-purple-300">
                      {SMC_PATTERN_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                <span className="text-[10px] text-gray-500">
                  {entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                </span>
                <span className="text-[10px] text-blue-400 group-hover:text-blue-300 transition-colors">View entry →</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
