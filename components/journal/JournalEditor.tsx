'use client'

import { useState } from 'react'
import { useRouter }  from 'next/navigation'
import { ALL_PAIRS, SMC_PATTERN_LABELS } from '@/lib/types'
import type { SmcPattern, MarketBias, SignalTimeframe, MarketSession, TraderEmotion } from '@/lib/types'

const EMOTIONS: TraderEmotion[] = ['disciplined', 'confident', 'neutral', 'impatient', 'fearful', 'greedy', 'fomo', 'revenge', 'overconfident']
const TIMEFRAMES: SignalTimeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']
const SESSIONS: MarketSession[] = ['asian', 'london', 'newyork', 'london_newyork_overlap', 'sydney']
const SMC_PATTERNS = Object.keys(SMC_PATTERN_LABELS) as SmcPattern[]

export default function JournalEditor() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    pair:            'EURUSD',
    direction:       'buy' as 'buy' | 'sell',
    pips_result:     '',
    is_winner:       '' as '' | 'true' | 'false',
    timeframe_used:  'H4' as SignalTimeframe,
    session_traded:  'london' as MarketSession,
    bias_used:       'bullish' as MarketBias,
    confluence_met:  true,
    followed_plan:   true,
    revenge_trade:   false,
    overtraded:      false,
    entry_reason:    '',
    exit_reason:     '',
    what_went_right: '',
    what_went_wrong: '',
    lessons:         '',
    emotion_before:  'neutral' as TraderEmotion,
    emotion_during:  'neutral' as TraderEmotion,
    emotion_after:   'neutral' as TraderEmotion,
    execution_rating:'3',
    management_rating:'3',
    setup_type:      [] as SmcPattern[],
    tags:            '',
  })

  function togglePattern(p: SmcPattern) {
    setForm((f) => ({
      ...f,
      setup_type: f.setup_type.includes(p)
        ? f.setup_type.filter((x) => x !== p)
        : [...f.setup_type, p],
    }))
  }

  async function submit() {
    if (!form.entry_reason) { setError('Entry reason is required'); return }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...form,
        pips_result:  form.pips_result ? parseFloat(form.pips_result) : null,
        is_winner:    form.is_winner === '' ? null : form.is_winner === 'true',
        tags:         form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      const res = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to save'); return }
      router.push('/dashboard/journal')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none'
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5'
  const toggleClass = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`

  return (
    <div className="space-y-5">
      {error && <div className="rounded-xl bg-red-900/30 border border-red-800/40 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* Trade basics */}
      <Section title="Trade Details">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pair</label>
            <select value={form.pair} onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value }))} className={inputClass}>
              {ALL_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Direction</label>
            <select value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as 'buy' | 'sell' }))} className={inputClass}>
              <option value="buy">Buy (Long)</option>
              <option value="sell">Sell (Short)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Pips Result</label>
            <input type="number" step="0.1" placeholder="+30.5" value={form.pips_result}
              onChange={(e) => setForm((f) => ({ ...f, pips_result: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Outcome</label>
            <select value={form.is_winner} onChange={(e) => setForm((f) => ({ ...f, is_winner: e.target.value as '' | 'true' | 'false' }))} className={inputClass}>
              <option value="">Select outcome</option>
              <option value="true">Win</option>
              <option value="false">Loss</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Timeframe</label>
            <select value={form.timeframe_used} onChange={(e) => setForm((f) => ({ ...f, timeframe_used: e.target.value as SignalTimeframe }))} className={inputClass}>
              {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Session</label>
            <select value={form.session_traded} onChange={(e) => setForm((f) => ({ ...f, session_traded: e.target.value as MarketSession }))} className={inputClass}>
              {SESSIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* SMC Setup */}
      <Section title="SMC Patterns Used">
        <div className="flex flex-wrap gap-2">
          {SMC_PATTERNS.map((p) => (
            <button key={p} type="button" onClick={() => togglePattern(p)}
              className={toggleClass(form.setup_type.includes(p))}>
              {SMC_PATTERN_LABELS[p]}
            </button>
          ))}
        </div>
      </Section>

      {/* Analysis */}
      <Section title="Trade Analysis">
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Why did you take this trade? *</label>
            <textarea rows={3} value={form.entry_reason} placeholder="Entry confluence, key levels, confirmation signals..."
              onChange={(e) => setForm((f) => ({ ...f, entry_reason: e.target.value }))}
              className={inputClass + ' resize-none'} />
          </div>
          <div>
            <label className={labelClass}>Exit reason</label>
            <textarea rows={2} value={form.exit_reason} placeholder="Why did you exit here?"
              onChange={(e) => setForm((f) => ({ ...f, exit_reason: e.target.value }))}
              className={inputClass + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>What went right</label>
              <textarea rows={2} value={form.what_went_right}
                onChange={(e) => setForm((f) => ({ ...f, what_went_right: e.target.value }))}
                className={inputClass + ' resize-none'} />
            </div>
            <div>
              <label className={labelClass}>What went wrong</label>
              <textarea rows={2} value={form.what_went_wrong}
                onChange={(e) => setForm((f) => ({ ...f, what_went_wrong: e.target.value }))}
                className={inputClass + ' resize-none'} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Lessons & improvements</label>
            <textarea rows={2} value={form.lessons}
              onChange={(e) => setForm((f) => ({ ...f, lessons: e.target.value }))}
              className={inputClass + ' resize-none'} />
          </div>
        </div>
      </Section>

      {/* Psychology */}
      <Section title="Psychology & Discipline">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {(['emotion_before', 'emotion_during', 'emotion_after'] as const).map((field) => (
            <div key={field}>
              <label className={labelClass}>{field.replace('emotion_', 'Emotion ').replace('_', ' ')}</label>
              <select value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value as TraderEmotion }))} className={inputClass}>
                {EMOTIONS.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Execution Rating (1-5)</label>
            <select value={form.execution_rating} onChange={(e) => setForm((f) => ({ ...f, execution_rating: e.target.value }))} className={inputClass}>
              {['1','2','3','4','5'].map((v) => <option key={v} value={v}>{v} {'★'.repeat(parseInt(v))}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Management Rating (1-5)</label>
            <select value={form.management_rating} onChange={(e) => setForm((f) => ({ ...f, management_rating: e.target.value }))} className={inputClass}>
              {['1','2','3','4','5'].map((v) => <option key={v} value={v}>{v} {'★'.repeat(parseInt(v))}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {([
            { key: 'followed_plan',  label: 'Followed plan',  invert: false },
            { key: 'revenge_trade',  label: 'Revenge trade',  invert: true  },
            { key: 'overtraded',     label: 'Overtraded',     invert: true  },
            { key: 'confluence_met', label: 'Confluence met', invert: false },
          ] as const).map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
              className={toggleClass((form as Record<string, unknown>)[key] as boolean)}>
              {(form as Record<string, unknown>)[key] ? '✓' : '✗'} {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Tags */}
      <Section title="Tags">
        <input type="text" placeholder="breakout, confluence, news-avoidance (comma-separated)"
          value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          className={inputClass} />
      </Section>

      <button onClick={submit} disabled={submitting}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50">
        {submitting ? 'Saving…' : 'Save Journal Entry'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}
