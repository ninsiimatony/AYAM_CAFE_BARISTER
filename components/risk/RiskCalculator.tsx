'use client'

import { useState, useCallback } from 'react'
import { calculatePositionSize } from '@/lib/risk'
import { ALL_PAIRS } from '@/lib/types'

interface Props {
  defaultRiskPct?: number
}

export default function RiskCalculator({ defaultRiskPct = 1 }: Props) {
  const [balance,  setBalance]  = useState('10000')
  const [riskPct,  setRiskPct]  = useState(defaultRiskPct.toString())
  const [pair,     setPair]     = useState('EURUSD')
  const [entry,    setEntry]    = useState('')
  const [sl,       setSl]       = useState('')
  const [tp1,      setTp1]      = useState('')
  const [tp2,      setTp2]      = useState('')
  const [result,   setResult]   = useState<ReturnType<typeof calculatePositionSize> | null>(null)

  const calculate = useCallback(() => {
    const b  = parseFloat(balance)
    const r  = parseFloat(riskPct)
    const e  = parseFloat(entry)
    const s  = parseFloat(sl)
    const t1 = parseFloat(tp1)
    const t2 = tp2 ? parseFloat(tp2) : undefined

    if (!b || !r || !e || !s || !t1) return

    try {
      setResult(calculatePositionSize({
        account_balance:  b,
        risk_pct:         r,
        pair,
        entry_price:      e,
        stop_loss:        s,
        take_profit_1:    t1,
        take_profit_2:    t2,
        account_currency: 'USD',
      }))
    } catch {
      setResult(null)
    }
  }, [balance, riskPct, pair, entry, sl, tp1, tp2])

  const inputClass = 'w-full rounded-xl bg-[#111d2e] border border-white/[0.09] px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono'
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5'

  return (
    <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {/* Account balance */}
        <div>
          <label className={labelClass}>Account Balance (USD)</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="10000"
            className={inputClass}
          />
        </div>
        {/* Risk % */}
        <div>
          <label className={labelClass}>Risk per Trade (%)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={riskPct}
            onChange={(e) => setRiskPct(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Pair */}
      <div>
        <label className={labelClass}>Currency Pair</label>
        <select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className={inputClass}
        >
          {ALL_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Entry */}
        <div>
          <label className={labelClass}>Entry Price</label>
          <input
            type="number"
            step="0.00001"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="1.08500"
            className={inputClass}
          />
        </div>
        {/* SL */}
        <div>
          <label className={labelClass}>Stop Loss</label>
          <input
            type="number"
            step="0.00001"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            placeholder="1.08200"
            className={inputClass}
          />
        </div>
        {/* TP1 */}
        <div>
          <label className={labelClass}>Take Profit 1</label>
          <input
            type="number"
            step="0.00001"
            value={tp1}
            onChange={(e) => setTp1(e.target.value)}
            placeholder="1.09100"
            className={inputClass}
          />
        </div>
        {/* TP2 */}
        <div>
          <label className={labelClass}>Take Profit 2 (optional)</label>
          <input
            type="number"
            step="0.00001"
            value={tp2}
            onChange={(e) => setTp2(e.target.value)}
            placeholder="1.09700"
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-semibold text-white transition-colors"
      >
        Calculate Position Size
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4 pt-2">
          {/* Warnings */}
          {result.warnings.map((w) => (
            <div key={w} className={`flex items-start gap-2 rounded-xl px-4 py-3 text-xs ${w.startsWith('DANGER') ? 'bg-red-900/30 text-red-300' : 'bg-amber-900/20 text-amber-300'}`}>
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {w}
            </div>
          ))}

          {/* Main result */}
          <div className="grid grid-cols-2 gap-3">
            <ResultBox label="Lot Size" value={result.lot_size.toFixed(2)} sub="standard lots" highlight />
            <ResultBox label="Micro Lots" value={result.micro_lots.toString()} sub="0.01 lot units" />
            <ResultBox label="$ At Risk" value={`$${result.risk_amount.toFixed(2)}`} sub={`${result.risk_pct}% of account`} warn={result.risk_pct > 2} />
            <ResultBox label="Pip Risk" value={`${result.pip_risk.toFixed(1)} pips`} sub="entry to SL" />
            <ResultBox label="RR to TP1" value={`1:${result.rr_ratio_1}`} sub={`$${result.reward_1.toFixed(2)} reward`} good={result.rr_ratio_1 >= 2} />
            {result.rr_ratio_2 > 0 && (
              <ResultBox label="RR to TP2" value={`1:${result.rr_ratio_2}`} sub={`$${result.reward_2.toFixed(2)} reward`} good={result.rr_ratio_2 >= 3} />
            )}
          </div>

          {/* Units */}
          <div className="rounded-xl bg-white/[0.05] px-4 py-3 text-center">
            <p className="text-xs text-gray-400 mb-0.5">Position in units</p>
            <p className="font-mono text-lg font-bold text-white">{result.units.toLocaleString()}</p>
            <p className="text-xs text-gray-500">at ${result.pip_value_usd.toFixed(2)} per pip</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultBox({ label, value, sub, highlight, warn, good }: {
  label: string; value: string; sub: string
  highlight?: boolean; warn?: boolean; good?: boolean
}) {
  return (
    <div className={`rounded-xl p-3.5 border ${
      highlight ? 'bg-blue-900/30 border-blue-700/50' :
      warn      ? 'bg-red-900/20 border-red-800/40'   :
      good      ? 'bg-emerald-900/20 border-emerald-800/40' :
      'bg-white/[0.05] border-white/[0.09]/50'
    }`}>
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-base font-bold font-mono ${
        highlight ? 'text-blue-300' :
        warn      ? 'text-red-300'  :
        good      ? 'text-emerald-300' :
        'text-white'
      }`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}
