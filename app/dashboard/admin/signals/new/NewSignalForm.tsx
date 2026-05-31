'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1','MN'] as const
const DIRECTIONS = ['buy', 'sell'] as const
const TIERS      = ['free', 'pro', 'elite'] as const
const BIASES     = ['bullish', 'bearish', 'neutral'] as const
const SESSIONS   = ['london', 'new_york', 'asian', 'london_new_york'] as const

const SMC_PATTERNS = [
  { value: 'BOS',            label: 'Break of Structure' },
  { value: 'CHOCH',          label: 'Change of Character' },
  { value: 'MSS',            label: 'Market Structure Shift' },
  { value: 'OB',             label: 'Order Block' },
  { value: 'BREAKER',        label: 'Breaker Block' },
  { value: 'FVG',            label: 'Fair Value Gap' },
  { value: 'LIQUIDITY_SWEEP',label: 'Liquidity Sweep' },
  { value: 'POI',            label: 'Point of Interest' },
  { value: 'PREMIUM_OB',     label: 'Premium OB' },
  { value: 'DISCOUNT_OB',    label: 'Discount OB' },
  { value: 'INDUCEMENT',     label: 'Inducement' },
  { value: 'MITIGATION',     label: 'Mitigation Block' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/[0.09] bg-[#111d2e] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-white/[0.09] bg-[#111d2e] px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {children}
    </select>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-white/[0.09] bg-[#111d2e] px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
    />
  )
}

export default function NewSignalForm() {
  const router = useRouter()
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const [pair,           setPair]           = useState('EURUSD')
  const [direction,      setDirection]      = useState<'buy'|'sell'>('buy')
  const [timeframe,      setTimeframe]      = useState('H4')
  const [session,        setSession]        = useState('')
  const [entryLow,       setEntryLow]       = useState('')
  const [entryHigh,      setEntryHigh]      = useState('')
  const [stopLoss,       setStopLoss]       = useState('')
  const [tp1,            setTp1]            = useState('')
  const [tp2,            setTp2]            = useState('')
  const [tp3,            setTp3]            = useState('')
  const [rr1,            setRr1]            = useState('')
  const [rr2,            setRr2]            = useState('')
  const [rr3,            setRr3]            = useState('')
  const [pipRisk,        setPipRisk]        = useState('')
  const [bias,           setBias]           = useState<'bullish'|'bearish'|'neutral'>('bullish')
  const [htfBias,        setHtfBias]        = useState('')
  const [confluence,     setConfluence]     = useState('')
  const [tierRequired,   setTierRequired]   = useState<'free'|'pro'|'elite'>('pro')
  const [patterns,       setPatterns]       = useState<string[]>([])
  const [analysisText,   setAnalysisText]   = useState('')
  const [chartUrl,       setChartUrl]       = useState('')
  const [notes,          setNotes]          = useState('')

  function togglePattern(p: string) {
    setPatterns((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/signals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair:            pair.toUpperCase().trim(),
          direction,
          timeframe,
          session:         session || undefined,
          entry_zone_low:  parseFloat(entryLow),
          entry_zone_high: parseFloat(entryHigh) || parseFloat(entryLow),
          stop_loss:       parseFloat(stopLoss),
          take_profit_1:   parseFloat(tp1),
          take_profit_2:   tp2 ? parseFloat(tp2) : undefined,
          take_profit_3:   tp3 ? parseFloat(tp3) : undefined,
          risk_reward_1:   rr1 ? parseFloat(rr1) : undefined,
          risk_reward_2:   rr2 ? parseFloat(rr2) : undefined,
          risk_reward_3:   rr3 ? parseFloat(rr3) : undefined,
          pip_risk:        pipRisk ? parseFloat(pipRisk) : undefined,
          smc_patterns:    patterns,
          bias,
          htf_bias:        htfBias || undefined,
          confluence_score: confluence ? parseFloat(confluence) : undefined,
          tier_required:   tierRequired,
          analysis_text:   analysisText || undefined,
          chart_url:       chartUrl || undefined,
          notes:           notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create signal'); return }

      router.push(`/dashboard/signals/${data.signal.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Core fields */}
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Signal Details</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Pair *">
            <Input value={pair} onChange={(e) => setPair(e.target.value)} placeholder="EURUSD" maxLength={10} required />
          </Field>
          <Field label="Direction *">
            <Select value={direction} onChange={(e) => setDirection(e.target.value as 'buy'|'sell')}>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
            </Select>
          </Field>
          <Field label="Timeframe *">
            <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Session">
            <Select value={session} onChange={(e) => setSession(e.target.value)}>
              <option value="">Any</option>
              {SESSIONS.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Tier Required *">
            <Select value={tierRequired} onChange={(e) => setTierRequired(e.target.value as 'free'|'pro'|'elite')}>
              {TIERS.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </Select>
          </Field>
          <Field label="Bias *">
            <Select value={bias} onChange={(e) => setBias(e.target.value as 'bullish'|'bearish'|'neutral')}>
              {BIASES.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="HTF Bias">
            <Select value={htfBias} onChange={(e) => setHtfBias(e.target.value)}>
              <option value="">—</option>
              {BIASES.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      {/* Price levels */}
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Price Levels</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Entry Low *">
            <Input type="number" step="any" value={entryLow} onChange={(e) => setEntryLow(e.target.value)} placeholder="1.08500" required />
          </Field>
          <Field label="Entry High">
            <Input type="number" step="any" value={entryHigh} onChange={(e) => setEntryHigh(e.target.value)} placeholder="1.08600" />
          </Field>
          <Field label="Stop Loss *">
            <Input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="1.08200" required />
          </Field>
          <Field label="Pip Risk">
            <Input type="number" step="any" value={pipRisk} onChange={(e) => setPipRisk(e.target.value)} placeholder="30" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Field label="TP1 *">
              <Input type="number" step="any" value={tp1} onChange={(e) => setTp1(e.target.value)} placeholder="1.09000" required />
            </Field>
            <Field label="RR1">
              <Input type="number" step="any" value={rr1} onChange={(e) => setRr1(e.target.value)} placeholder="1.5" />
            </Field>
          </div>
          <div className="space-y-2">
            <Field label="TP2">
              <Input type="number" step="any" value={tp2} onChange={(e) => setTp2(e.target.value)} placeholder="1.09400" />
            </Field>
            <Field label="RR2">
              <Input type="number" step="any" value={rr2} onChange={(e) => setRr2(e.target.value)} placeholder="2.5" />
            </Field>
          </div>
          <div className="space-y-2">
            <Field label="TP3">
              <Input type="number" step="any" value={tp3} onChange={(e) => setTp3(e.target.value)} placeholder="1.09800" />
            </Field>
            <Field label="RR3">
              <Input type="number" step="any" value={rr3} onChange={(e) => setRr3(e.target.value)} placeholder="4.0" />
            </Field>
          </div>
        </div>

        <Field label="Confluence Score (1–10)">
          <Input type="number" min="1" max="10" step="0.5" value={confluence} onChange={(e) => setConfluence(e.target.value)} placeholder="7" />
        </Field>
      </div>

      {/* SMC patterns */}
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">SMC Patterns</h2>
        <div className="flex flex-wrap gap-2">
          {SMC_PATTERNS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => togglePattern(value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                patterns.includes(value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111d2e] text-gray-400 hover:bg-gray-700 border border-white/[0.09]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {patterns.length > 0 && (
          <p className="text-xs text-blue-400">{patterns.length} pattern{patterns.length !== 1 ? 's' : ''} selected</p>
        )}
      </div>

      {/* Analysis */}
      <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Analysis</h2>
        <Field label="Analysis Text">
          <Textarea value={analysisText} onChange={(e) => setAnalysisText(e.target.value)} rows={5} placeholder="Institutional analysis — explain the WHY behind this setup..." />
        </Field>
        <Field label="Chart URL">
          <Input type="url" value={chartUrl} onChange={(e) => setChartUrl(e.target.value)} placeholder="https://tradingview.com/..." />
        </Field>
        <Field label="Internal Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes (not shown to users)..." />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          {loading ? 'Creating…' : 'Create Signal (Draft)'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/[0.09] bg-[#111d2e] hover:bg-gray-700 px-6 py-3 text-sm font-medium text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <p className="text-xs text-gray-500">Signal will be saved as draft. Publish from the signal detail page.</p>
      </div>
    </form>
  )
}
