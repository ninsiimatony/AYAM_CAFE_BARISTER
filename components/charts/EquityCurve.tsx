'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { PerformanceSnapshot } from '@/lib/types'

interface Props {
  snapshots: Pick<PerformanceSnapshot, 'snapshot_date' | 'equity_end' | 'net_profit'>[]
}

export default function EquityCurve({ snapshots }: Props) {
  if (!snapshots.length) return null

  const data = snapshots.map((s) => ({
    date:   new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    equity: Number(s.equity_end ?? 0),
    pnl:    Number(s.net_profit ?? 0),
  }))

  const start   = data[0]?.equity ?? 0
  const current = data[data.length - 1]?.equity ?? 0
  const gain    = current - start
  const gainPct = start > 0 ? ((gain / start) * 100).toFixed(1) : '0'
  const isProfit = gain >= 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-3 shadow-xl text-xs">
        <p className="font-semibold text-white mb-1">{label}</p>
        <p className="text-gray-300">Equity: <span className="text-white font-mono">${Number(payload[0].value).toFixed(2)}</span></p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Current equity</p>
          <p className="text-2xl font-bold text-white">${current.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${isProfit ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
          <span className="text-sm font-bold">{isProfit ? '+' : ''}{gainPct}%</span>
          <span className="text-xs opacity-70">({isProfit ? '+' : ''}${gain.toFixed(2)})</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={start} stroke="#374151" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="equity"
            stroke={isProfit ? '#34d399' : '#f87171'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isProfit ? '#34d399' : '#f87171' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
