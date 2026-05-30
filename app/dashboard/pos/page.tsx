'use client'

import { POSProvider } from '@/contexts/POSContext'
import ProductGrid from '@/components/pos/ProductGrid'
import CartPanel from '@/components/pos/CartPanel'

export default function POSTerminalPage() {
  return (
    <POSProvider>
      <div className="flex flex-col h-full">
        {/* Page header */}
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-coffee-900 dark:text-cream-100">POS Terminal</h1>
            <p className="text-sm text-coffee-400">Cashier — Ayam Café Barister</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-coffee-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Main POS layout */}
        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          {/* Left: product browser (60%) */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <ProductGrid />
          </div>

          {/* Right: cart (fixed width) */}
          <div className="w-80 flex-shrink-0 overflow-hidden">
            <CartPanel />
          </div>
        </div>
      </div>
    </POSProvider>
  )
}
