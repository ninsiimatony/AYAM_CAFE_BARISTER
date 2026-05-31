'use client'

import { useState, useEffect } from 'react'
import SignalCard from './SignalCard'
import type { Signal, SubscriptionTier } from '@/lib/types'

interface Props {
  initialSignals: Signal[]
  userTier:  SubscriptionTier
  isStaff:   boolean
  isDemoData?: boolean
}

const STATUS_FILTERS = [
  { value: '',         label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'tp1_hit',  label: 'TP1 Hit' },
  { value: 'tp2_hit',  label: 'TP2 Hit' },
  { value: 'tp3_hit',  label: 'Full Target' },
  { value: 'sl_hit',   label: 'SL Hit' },
  { value: 'pending',  label: 'Pending' },
]

const DIRECTION_FILTERS = [
  { value: '', label: 'All Directions' },
  { value: 'buy',  label: 'Buy' },
  { value: 'sell', label: 'Sell' },
]

export default function SignalFeed({ initialSignals, userTier, isStaff, isDemoData }: Props) {
  const [signals, setSignals]     = useState<Signal[]>(initialSignals)
  const [statusFilter, setStatus] = useState('')
  const [dirFilter, setDir]       = useState('')
  const [pairFilter, setPair]     = useState('')
  const [loading, setLoading]     = useState(false)

  async function loadSignals() {
    if (isDemoData) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (pairFilter)   params.set('pair', pairFilter)
      const res  = await fetch(`/api/signals?${params}`)
      const data = await res.json()
      setSignals(data.signals ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSignals() }, [statusFilter, dirFilter, pairFilter])

  const filtered = dirFilter ? signals.filter((s) => s.direction === dirFilter) : signals

  return (
    <div className="space-y-4">
      {isDemoData && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.07] px-4 py-3">
          <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-300">
            <span className="font-semibold">Sample signals</span> — Connect your Supabase database to publish real signals.
          </p>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.07]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="h-4 w-px bg-white/[0.08] mx-1" />
        {DIRECTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDir(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              dirFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white/[0.04] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.07]'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={pairFilter}
          onChange={(e) => setPair(e.target.value.toUpperCase())}
          placeholder="Filter pair…"
          className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs text-white placeholder-gray-700 focus:border-blue-500/50 focus:outline-none w-28 transition-colors"
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-sm">No signals found</p>
          <p className="text-xs text-gray-700 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((signal) => (
            <SignalCard key={signal.id} signal={signal} userTier={userTier} isStaff={isStaff} isDemoData={isDemoData} />
          ))}
        </div>
      )}
    </div>
  )
}
