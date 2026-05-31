'use client'

import { useState, useEffect } from 'react'
import SignalCard from './SignalCard'
import type { Signal, SubscriptionTier } from '@/lib/types'

interface Props {
  initialSignals: Signal[]
  userTier:  SubscriptionTier
  isStaff:   boolean
}

const STATUS_FILTERS = [
  { value: '',         label: 'All' },
  { value: 'active',   label: '🟢 Active' },
  { value: 'tp1_hit',  label: '✅ TP1 Hit' },
  { value: 'tp2_hit',  label: '✅✅ TP2 Hit' },
  { value: 'tp3_hit',  label: '🏆 Full Target' },
  { value: 'sl_hit',   label: '❌ SL Hit' },
  { value: 'pending',  label: '⏳ Pending' },
]

const DIRECTION_FILTERS = [
  { value: '', label: 'All Directions' },
  { value: 'buy',  label: '🟢 Buy' },
  { value: 'sell', label: '🔴 Sell' },
]

export default function SignalFeed({ initialSignals, userTier, isStaff }: Props) {
  const [signals, setSignals]       = useState<Signal[]>(initialSignals)
  const [statusFilter, setStatus]   = useState('')
  const [dirFilter, setDir]         = useState('')
  const [pairFilter, setPair]       = useState('')
  const [loading, setLoading]       = useState(false)

  async function loadSignals() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (pairFilter)   params.set('pair', pairFilter)
      const res = await fetch(`/api/signals?${params}`)
      const data = await res.json()
      setSignals(data.signals ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSignals() }, [statusFilter, dirFilter, pairFilter])

  const filtered = dirFilter
    ? signals.filter((s) => s.direction === dirFilter)
    : signals

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="h-6 w-px bg-gray-700 self-center" />
        {DIRECTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDir(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              dirFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          value={pairFilter}
          onChange={(e) => setPair(e.target.value.toUpperCase())}
          placeholder="Filter pair…"
          className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none w-28"
        />
      </div>

      {/* Signals */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800">
            <svg className="h-7 w-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">No signals found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((signal) => (
            <SignalCard key={signal.id} signal={signal} userTier={userTier} isStaff={isStaff} />
          ))}
        </div>
      )}
    </div>
  )
}
