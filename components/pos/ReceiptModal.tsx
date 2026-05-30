'use client'

import type { POSTransaction } from '@/lib/types'

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString()}`
}

const METHOD_LABEL: Record<string, string> = {
  cash:          'Cash',
  card:          'Card',
  mobile_money:  'Mobile Money',
  complimentary: 'Complimentary',
}

interface Props {
  transaction: POSTransaction
  onClose: () => void
}

export default function ReceiptModal({ transaction: tx, onClose }: Props) {
  const date = new Date(tx.created_at)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-coffee-900 shadow-coffee-lg overflow-hidden">
        {/* Success header */}
        <div className="bg-green-500 px-6 py-4 text-center text-white">
          <div className="text-3xl mb-1">✓</div>
          <p className="font-bold text-lg">Payment Complete!</p>
          <p className="text-sm opacity-90">#{tx.transaction_number}</p>
        </div>

        {/* Receipt body */}
        <div className="px-6 py-4 space-y-3 font-mono text-sm">
          {/* Cafe name */}
          <div className="text-center border-b border-dashed border-coffee-200 dark:border-coffee-700 pb-3">
            <p className="font-bold text-coffee-900 dark:text-cream-100 text-base">AYAM CAFÉ BARISTER</p>
            <p className="text-xs text-coffee-400">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </p>
            {tx.pos_tables && (
              <p className="text-xs text-coffee-500">Table {tx.pos_tables.table_number}</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1">
            {tx.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-coffee-700 dark:text-coffee-300">
                <span className="flex-1">{item.name} × {item.quantity}</span>
                <span>{formatUGX(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-coffee-200 dark:border-coffee-700 pt-2 space-y-1">
            <div className="flex justify-between text-xs text-coffee-500">
              <span>Subtotal</span><span>{formatUGX(tx.subtotal)}</span>
            </div>
            {tx.tax_amount > 0 && (
              <div className="flex justify-between text-xs text-coffee-500">
                <span>Tax</span><span>{formatUGX(tx.tax_amount)}</span>
              </div>
            )}
            {tx.discount_amount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount</span><span>-{formatUGX(tx.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-coffee-900 dark:text-cream-100 text-base border-t border-coffee-200 dark:border-coffee-700 pt-1 mt-1">
              <span>TOTAL</span><span>{formatUGX(tx.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="border-t border-dashed border-coffee-200 dark:border-coffee-700 pt-2 space-y-1 text-xs text-coffee-500">
            <div className="flex justify-between">
              <span>Payment</span><span>{METHOD_LABEL[tx.payment_method]}</span>
            </div>
            {tx.amount_paid != null && (
              <div className="flex justify-between">
                <span>Tendered</span><span>{formatUGX(tx.amount_paid)}</span>
              </div>
            )}
            {(tx.change_amount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Change</span><span>{formatUGX(tx.change_amount!)}</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-coffee-400 border-t border-dashed border-coffee-200 dark:border-coffee-700 pt-3">
            Thank you for visiting!
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl border border-coffee-200 dark:border-coffee-700 py-2.5 text-sm font-semibold text-coffee-700 dark:text-coffee-300 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-coffee-gradient py-2.5 text-sm font-semibold text-white shadow-coffee hover:opacity-90 transition-opacity"
          >
            New Order
          </button>
        </div>
      </div>
    </div>
  )
}
