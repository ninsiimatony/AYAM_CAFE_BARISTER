'use client'

import { useState, useEffect, useCallback } from 'react'

function formatUGX(n: number) { return `UGX ${n.toLocaleString()}` }

interface ReportData {
  from: string
  to: string
  transaction_count: number
  total_revenue: number
  subtotal: number
  tax_collected: number
  discounts_given: number
  by_payment_method: Record<string, { count: number; total: number }>
  top_items: { name: string; quantity: number; revenue: number }[]
}

const METHOD_ICON: Record<string, string> = {
  cash: '💵', card: '💳', mobile_money: '📱', complimentary: '🎁',
}

export default function POSReportsPage() {
  const today    = new Date().toISOString().slice(0, 10)
  const [from,   setFrom]   = useState(today)
  const [to,     setTo]     = useState(today)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const loadReport = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/pos/reports?from=${from}&to=${to}`)
    const { data } = await res.json()
    setReport(data)
    setLoading(false)
  }, [from, to])

  useEffect(() => { loadReport() }, [loadReport])

  function setPreset(days: number) {
    const end   = new Date()
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    setFrom(start.toISOString().slice(0, 10))
    setTo(end.toISOString().slice(0, 10))
  }

  const maxRevenue = Math.max(1, ...(report?.top_items.map(i => i.revenue) ?? []))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-coffee-900 dark:text-cream-100">POS Reports</h1>
          <p className="text-sm text-coffee-400">Sales analytics</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {[
            { label: 'Today',     days: 1  },
            { label: '7 days',    days: 7  },
            { label: '30 days',   days: 30 },
          ].map(p => (
            <button key={p.label} onClick={() => setPreset(p.days)}
              className="rounded-xl border border-coffee-100 dark:border-coffee-800 px-3 py-2 text-xs font-medium text-coffee-600 dark:text-coffee-300 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors"
            >{p.label}</button>
          ))}
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
          />
          <span className="text-coffee-400 text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white dark:bg-coffee-900 animate-pulse" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue',    value: formatUGX(report.total_revenue), icon: '💰', sub: `${report.transaction_count} transactions` },
              { label: 'Avg. Transaction', value: report.transaction_count > 0 ? formatUGX(Math.round(report.total_revenue / report.transaction_count)) : 'N/A', icon: '📊', sub: 'Per completed sale' },
              { label: 'Tax Collected',    value: formatUGX(report.tax_collected),   icon: '🏛️', sub: 'VAT / service tax' },
              { label: 'Discounts Given',  value: formatUGX(report.discounts_given), icon: '🎟️', sub: 'Total discount amount' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 px-5 py-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{kpi.icon}</span>
                </div>
                <p className="text-lg font-bold text-coffee-900 dark:text-cream-100">{kpi.value}</p>
                <p className="text-xs text-coffee-400 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-coffee-300 dark:text-coffee-600 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment breakdown */}
            <div className="rounded-2xl bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 p-5">
              <h2 className="text-sm font-bold text-coffee-900 dark:text-cream-100 mb-4">Payment Methods</h2>
              {Object.keys(report.by_payment_method).length === 0 ? (
                <p className="text-sm text-coffee-400 text-center py-6">No data</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report.by_payment_method).map(([method, stats]) => {
                    const pct = report.total_revenue > 0
                      ? Math.round((stats.total / report.total_revenue) * 100)
                      : 0
                    return (
                      <div key={method}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 text-coffee-700 dark:text-coffee-300 font-medium">
                            {METHOD_ICON[method] ?? '💱'} <span className="capitalize">{method.replace('_', ' ')}</span>
                          </span>
                          <span className="text-coffee-500">{stats.count} × {formatUGX(stats.total)}</span>
                        </div>
                        <div className="h-2 bg-coffee-50 dark:bg-coffee-800 rounded-full overflow-hidden">
                          <div className="h-full bg-coffee-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-coffee-400 mt-0.5">{pct}% of revenue</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Top items */}
            <div className="rounded-2xl bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 p-5">
              <h2 className="text-sm font-bold text-coffee-900 dark:text-cream-100 mb-4">Top Selling Items</h2>
              {report.top_items.length === 0 ? (
                <p className="text-sm text-coffee-400 text-center py-6">No data</p>
              ) : (
                <div className="space-y-3">
                  {report.top_items.slice(0, 8).map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-coffee-700 dark:text-coffee-300 font-medium truncate pr-2">{item.name}</span>
                        <span className="text-coffee-500 flex-shrink-0">{item.quantity} sold</span>
                      </div>
                      <div className="h-2 bg-coffee-50 dark:bg-coffee-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round((item.revenue / maxRevenue) * 100)}%`,
                            background: `hsl(${24 + i * 15}, 60%, ${40 + i * 3}%)`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-coffee-400 mt-0.5">{formatUGX(item.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
