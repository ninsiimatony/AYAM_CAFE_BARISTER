'use client'

import { useState } from 'react'
import { usePOS } from '@/contexts/POSContext'
import PaymentModal from './PaymentModal'
import TableSelector from './TableSelector'

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString()}`
}

export default function CartPanel() {
  const { cart, selectedTable, cartSubtotal, cartItemCount, removeFromCart, setQuantity, clearCart, setTable } = usePOS()
  const [showPayment, setShowPayment] = useState(false)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [taxRate] = useState(0) // 0% by default — set to 0.18 for 18% VAT
  const [discountAmt, setDiscountAmt] = useState(0)

  const taxAmount  = Math.round(cartSubtotal * taxRate)
  const total      = cartSubtotal + taxAmount - discountAmt

  return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-coffee-900 rounded-2xl border border-coffee-100 dark:border-coffee-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-coffee-100 dark:border-coffee-800 bg-coffee-50 dark:bg-coffee-950">
          <div>
            <h2 className="text-sm font-bold text-coffee-900 dark:text-cream-100">Current Order</h2>
            <p className="text-xs text-coffee-400">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Table selector */}
        <button
          onClick={() => setShowTablePicker(true)}
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-dashed border-coffee-200 dark:border-coffee-700 px-3 py-2 text-xs text-coffee-500 dark:text-coffee-400 hover:border-coffee-400 hover:text-coffee-700 dark:hover:text-cream-200 transition-colors"
        >
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
          </svg>
          {selectedTable
            ? `Table ${selectedTable.table_number} — ${selectedTable.location ?? 'Main'}`
            : 'Select table (optional)'
          }
          {selectedTable && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); setTable(null) }}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </span>
          )}
        </button>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-coffee-300 dark:text-coffee-700">
              <span className="text-5xl mb-3">🛒</span>
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs mt-1 text-center">Tap products on the left to add them</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-2 rounded-xl bg-cream-50 dark:bg-coffee-800 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-coffee-900 dark:text-cream-100 truncate">{item.name}</p>
                  <p className="text-xs text-coffee-400">{formatUGX(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-coffee-100 dark:bg-coffee-700 text-coffee-700 dark:text-cream-200 text-sm font-bold hover:bg-coffee-200 dark:hover:bg-coffee-600 transition-colors"
                  >−</button>
                  <span className="w-6 text-center text-sm font-bold text-coffee-900 dark:text-cream-100">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-coffee-100 dark:bg-coffee-700 text-coffee-700 dark:text-cream-200 text-sm font-bold hover:bg-coffee-200 dark:hover:bg-coffee-600 transition-colors"
                  >+</button>
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-bold text-coffee-700 dark:text-caramel-400">
                    {formatUGX(item.price * item.quantity)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-coffee-300 hover:text-red-500 transition-colors ml-1"
                  aria-label="Remove"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-coffee-100 dark:border-coffee-800 px-4 py-3 space-y-1.5 bg-cream-50 dark:bg-coffee-950">
            <div className="flex justify-between text-xs text-coffee-500">
              <span>Subtotal</span>
              <span>{formatUGX(cartSubtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-xs text-coffee-500">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>{formatUGX(taxAmount)}</span>
              </div>
            )}
            {/* Discount input */}
            <div className="flex items-center justify-between text-xs text-coffee-500">
              <span>Discount</span>
              <div className="flex items-center gap-1">
                <span className="text-coffee-400">UGX</span>
                <input
                  type="number"
                  min={0}
                  max={cartSubtotal}
                  value={discountAmt || ''}
                  onChange={e => setDiscountAmt(Math.min(Number(e.target.value) || 0, cartSubtotal))}
                  placeholder="0"
                  className="w-20 rounded border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-900 px-1.5 py-0.5 text-right text-xs text-coffee-900 dark:text-cream-100 focus:outline-none focus:ring-1 focus:ring-coffee-300"
                />
              </div>
            </div>
            <div className="pt-1.5 border-t border-coffee-100 dark:border-coffee-800 flex justify-between font-bold">
              <span className="text-coffee-900 dark:text-cream-100">TOTAL</span>
              <span className="text-coffee-700 dark:text-caramel-400 text-lg">{formatUGX(total)}</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="mt-2 w-full rounded-xl bg-coffee-gradient py-3 text-sm font-bold text-white shadow-coffee hover:opacity-90 active:scale-95 transition-all"
            >
              Process Payment →
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          taxRate={taxRate}
          discountAmount={discountAmt}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); setDiscountAmt(0) }}
        />
      )}

      {showTablePicker && (
        <TableSelector onClose={() => setShowTablePicker(false)} />
      )}
    </>
  )
}
