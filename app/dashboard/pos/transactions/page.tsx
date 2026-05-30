'use client'

import { useState, useEffect, useCallback } from 'react'
import type { POSTransaction } from '@/lib/types'

function formatUGX(n: number) { return `UGX ${n.toLocaleString()}` }

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  pending:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  voided:    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  refunded:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
}

const METHOD_ICON: Record<string, string> = {
  cash: '💵', card: '💳', mobile_money: '📱', complimentary: '🎁',
}

export default function TransactionsPage() {
  const [txns,    setTxns]    = useState<POSTransaction[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10))
  const [status,  setStatus]  = useState('')
  const [selected, setSelected] = useState<POSTransaction | null>(null)

  const limit = 20

  const loadTxns = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (date)   params.set('date',   date)
    if (status) params.set('status', status)
    const res = await fetch(`/api/pos/transactions?${params}`)
    const { data, total: t } = await res.json()
    setTxns(data ?? [])
    setTotal(t ?? 0)
    setLoading(false)
  }, [page, date, status])

  useEffect(() => { loadTxns() }, [loadTxns])

  const totalRevenue = txns
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + Number(t.total), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-coffee-900 dark:text-cream-100">Transaction History</h1>
          <p className="text-sm text-coffee-400">{total} records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setPage(1) }}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
          />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-coffee-300"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="voided">Voided</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Transactions', value: txns.length },
          { label: 'Revenue',      value: formatUGX(totalRevenue) },
          { label: 'Avg. Order',   value: txns.length ? formatUGX(Math.round(totalRevenue / txns.filter(t => t.status === 'completed').length || 0)) : 'N/A' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white dark:bg-coffee-900 border border-coffee-100 dark:border-coffee-800 px-5 py-4">
            <p className="text-xs text-coffee-400 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-coffee-900 dark:text-cream-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-coffee-50 dark:bg-coffee-800 animate-pulse" />
            ))}
          </div>
        ) : txns.length === 0 ? (
          <div className="py-16 text-center text-coffee-400">
            <p className="text-4xl mb-3">🧾</p>
            <p>No transactions found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coffee-100 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-950">
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Ref #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Table</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-coffee-500 uppercase tracking-wide">Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-coffee-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-coffee-500 uppercase tracking-wide">Payment</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-coffee-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50 dark:divide-coffee-800">
              {txns.map(tx => (
                <tr key={tx.id} className="hover:bg-cream-50 dark:hover:bg-coffee-800/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-coffee-600 dark:text-coffee-400">{tx.transaction_number}</td>
                  <td className="px-4 py-3 text-coffee-500 text-xs">
                    {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-coffee-500">
                    {tx.pos_tables ? `Table ${tx.pos_tables.table_number}` : 'Takeaway'}
                  </td>
                  <td className="px-4 py-3 text-coffee-500">{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 text-right font-bold text-coffee-700 dark:text-caramel-400">
                    {formatUGX(tx.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span title={tx.payment_method}>{METHOD_ICON[tx.payment_method] ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[tx.status] ?? ''}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(tx)}
                      className="text-xs text-coffee-500 hover:text-coffee-800 dark:hover:text-cream-100 font-medium transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 px-4 py-2 text-sm text-coffee-600 dark:text-coffee-400 disabled:opacity-40 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors"
          >← Prev</button>
          <span className="rounded-xl border border-coffee-100 dark:border-coffee-800 px-4 py-2 text-sm text-coffee-900 dark:text-cream-100">
            {page} / {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl border border-coffee-100 dark:border-coffee-800 px-4 py-2 text-sm text-coffee-600 dark:text-coffee-400 disabled:opacity-40 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors"
          >Next →</button>
        </div>
      )}

      {/* Transaction detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-coffee-900 shadow-coffee-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-coffee-gradient text-white">
              <h2 className="font-bold text-sm">{selected.transaction_number}</h2>
              <button onClick={() => setSelected(null)} className="text-cream-300 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="space-y-1">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-coffee-700 dark:text-coffee-300">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatUGX(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-coffee-100 dark:border-coffee-800 space-y-1">
                <div className="flex justify-between text-xs text-coffee-500"><span>Subtotal</span><span>{formatUGX(selected.subtotal)}</span></div>
                {selected.tax_amount > 0 && <div className="flex justify-between text-xs text-coffee-500"><span>Tax</span><span>{formatUGX(selected.tax_amount)}</span></div>}
                {selected.discount_amount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Discount</span><span>-{formatUGX(selected.discount_amount)}</span></div>}
                <div className="flex justify-between font-bold text-coffee-900 dark:text-cream-100"><span>Total</span><span>{formatUGX(selected.total)}</span></div>
              </div>
              <div className="pt-2 text-xs text-coffee-400 space-y-1">
                <div className="flex justify-between"><span>Payment</span><span className="capitalize">{selected.payment_method.replace('_', ' ')}</span></div>
                {selected.amount_paid && <div className="flex justify-between"><span>Paid</span><span>{formatUGX(selected.amount_paid)}</span></div>}
                {(selected.change_amount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Change</span><span>{formatUGX(selected.change_amount!)}</span></div>}
                <div className="flex justify-between"><span>Time</span><span>{new Date(selected.created_at).toLocaleString()}</span></div>
              </div>
              {selected.notes && (
                <p className="rounded-lg bg-coffee-50 dark:bg-coffee-800 px-3 py-2 text-xs text-coffee-600 dark:text-coffee-400">
                  Note: {selected.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
