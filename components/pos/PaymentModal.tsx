'use client'

import { useState } from 'react'
import { usePOS } from '@/contexts/POSContext'
import type { POSPaymentMethod, POSTransaction } from '@/lib/types'
import ReceiptModal from './ReceiptModal'

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString()}`
}

const PAYMENT_METHODS: { key: POSPaymentMethod; label: string; icon: string }[] = [
  { key: 'cash',          label: 'Cash',          icon: '💵' },
  { key: 'card',          label: 'Card',           icon: '💳' },
  { key: 'mobile_money',  label: 'Mobile Money',   icon: '📱' },
  { key: 'complimentary', label: 'Complimentary',  icon: '🎁' },
]

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

interface Props {
  total: number
  taxRate: number
  discountAmount: number
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentModal({ total, taxRate, discountAmount, onClose, onSuccess }: Props) {
  const { processPayment } = usePOS()
  const [method, setMethod]       = useState<POSPaymentMethod>('cash')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [receipt, setReceipt]     = useState<POSTransaction | null>(null)

  const paid   = parseFloat(amountPaid) || 0
  const change = method === 'cash' ? Math.max(0, paid - total) : 0
  const canPay = method !== 'cash' || paid >= total

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const tx = await processPayment({
        payment_method:  method,
        amount_paid:     method === 'cash' ? paid : total,
        tax_rate:        taxRate,
        discount_amount: discountAmount,
        notes:           notes || undefined,
      })
      setReceipt(tx)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (receipt) {
    return (
      <ReceiptModal
        transaction={receipt}
        onClose={() => { setReceipt(null); onSuccess() }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-coffee-900 shadow-coffee-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-coffee-gradient text-white">
          <h2 className="font-bold text-lg">Payment</h2>
          <button onClick={onClose} className="text-cream-300 hover:text-white transition-colors">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total */}
          <div className="rounded-xl bg-cream-100 dark:bg-coffee-800 px-4 py-3 text-center">
            <p className="text-xs text-coffee-400 mb-1">Total Due</p>
            <p className="text-3xl font-bold text-coffee-900 dark:text-cream-100">{formatUGX(total)}</p>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-coffee-600 dark:text-coffee-400 mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  onClick={() => { setMethod(pm.key); setAmountPaid('') }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    method === pm.key
                      ? 'border-coffee-400 bg-coffee-50 dark:bg-coffee-800 text-coffee-800 dark:text-cream-100 shadow-coffee'
                      : 'border-coffee-100 dark:border-coffee-700 text-coffee-600 dark:text-coffee-300 hover:border-coffee-300'
                  }`}
                >
                  <span className="text-lg">{pm.icon}</span>
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash amount input */}
          {method === 'cash' && (
            <div>
              <p className="text-xs font-semibold text-coffee-600 dark:text-coffee-400 mb-2">Amount Received</p>
              <input
                type="number"
                min={0}
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder={`Min. ${formatUGX(total)}`}
                className="w-full rounded-xl border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-4 py-2.5 text-lg font-bold text-coffee-900 dark:text-cream-100 placeholder-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-300"
              />
              {/* Quick amounts */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmountPaid(String(a))}
                    className="rounded-lg bg-coffee-50 dark:bg-coffee-800 border border-coffee-100 dark:border-coffee-700 px-2.5 py-1 text-xs text-coffee-700 dark:text-coffee-300 hover:border-coffee-400 transition-colors"
                  >
                    {formatUGX(a)}
                  </button>
                ))}
                <button
                  onClick={() => setAmountPaid(String(total))}
                  className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 text-xs text-green-700 dark:text-green-400 font-semibold"
                >
                  Exact
                </button>
              </div>
              {/* Change */}
              {paid >= total && paid > 0 && (
                <div className="mt-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-2 flex justify-between">
                  <span className="text-sm text-green-700 dark:text-green-400 font-medium">Change</span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">{formatUGX(change)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-semibold text-coffee-600 dark:text-coffee-400 mb-1">Notes (optional)</p>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Special instructions..."
              className="w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-800 px-3 py-2 text-sm text-coffee-900 dark:text-cream-100 placeholder-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Confirm button */}
          <button
            onClick={handlePay}
            disabled={!canPay || loading}
            className={`w-full rounded-xl py-3.5 text-base font-bold text-white transition-all ${
              canPay && !loading
                ? 'bg-coffee-gradient shadow-coffee hover:opacity-90 active:scale-95'
                : 'bg-coffee-200 dark:bg-coffee-800 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing…' : `Confirm Payment — ${formatUGX(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
