'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingBag, ChevronRight, Minus, Plus } from 'lucide-react'
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  BADGE_STYLES,
  formatPrice,
  type MenuItem,
} from '@/lib/menu-data'
import { useCart } from '@/contexts/CartContext'

// ── Item card ────────────────────────────────────────────────────────────────

function ItemCard({ item }: { item: MenuItem }) {
  const { items, addItem, updateQty } = useCart()
  const cartEntry = items.find(c => c.item.id === item.id)
  const qty = cartEntry?.quantity ?? 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col gap-3">
      {/* Emoji icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="text-3xl leading-none">{item.emoji}</div>
        {item.badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${BADGE_STYLES[item.badge]}`}>
            {item.badge}
          </span>
        )}
      </div>

      {/* Name */}
      <div>
        <p className="font-semibold text-stone-900 leading-tight">{item.name}</p>
        <p className="text-xs text-stone-400 mt-0.5" dir="rtl">{item.nameAr}</p>
      </div>

      {/* Price + Add control */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="font-bold text-amber-800 text-sm">{formatPrice(item.price)}</span>

        {qty === 0 ? (
          <button
            onClick={() => addItem(item)}
            className="flex items-center gap-1 bg-stone-900 hover:bg-stone-700 text-white text-sm font-semibold px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQty(item.id, qty - 1)}
              className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
            >
              <Minus className="h-3.5 w-3.5 text-stone-700" />
            </button>
            <span className="w-5 text-center font-bold text-stone-900 text-sm">{qty}</span>
            <button
              onClick={() => addItem(item)}
              className="h-7 w-7 rounded-full bg-stone-900 hover:bg-stone-700 flex items-center justify-center transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

function MenuPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableParam = searchParams.get('table') ?? '1'

  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0].id)
  const tabsRef = useRef<HTMLDivElement>(null)
  const { items, itemCount, total, kotNumber } = useCart()

  // Scroll active tab into view
  useEffect(() => {
    const el = tabsRef.current?.querySelector(`[data-cat="${activeCategory}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeCategory])

  const visibleItems = MENU_ITEMS.filter(i => i.category === activeCategory)

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-900 text-lg leading-none">AYAM Café</h1>
            <p className="text-xs text-stone-400 mt-0.5">Coffee & Tea · Masaar Barka</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
              Table {tableParam}
            </span>
          </div>
        </div>

        {/* Category tabs */}
        <div
          ref={tabsRef}
          className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {MENU_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.shortLabel}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Category heading ────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 pb-36">
        {(() => {
          const cat = MENU_CATEGORIES.find(c => c.id === activeCategory)!
          return (
            <div className="py-4">
              <h2 className="text-xl font-bold text-stone-900">{cat.name}</h2>
              <p className="text-sm text-stone-400" dir="rtl">{cat.nameAr}</p>
            </div>
          )
        })()}

        {/* Item grid */}
        <div className="grid grid-cols-2 gap-3">
          {visibleItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>

      {/* ── Floating order summary (current items) ──────────────────────── */}
      {items.length > 0 && (
        <div className="fixed left-0 right-0 bottom-20 z-10 px-4 max-w-2xl mx-auto">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-lg overflow-hidden divide-y divide-stone-100">
            <div className="px-4 py-2 flex items-center justify-between bg-stone-50">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                🧾 KOT {kotNumber}
              </span>
              <span className="text-xs text-stone-400">Table {tableParam}</span>
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-stone-50">
              {items.map(c => (
                <div key={c.item.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-stone-800 leading-none">{c.item.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">× {c.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-amber-800">
                    {(c.item.price * c.quantity).toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky cart bar ─────────────────────────────────────────────── */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white border-t border-stone-200 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push(`/menu/checkout?table=${tableParam}`)}
              className="w-full flex items-center justify-between bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white px-5 py-4 rounded-2xl transition-colors shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="font-semibold text-sm">View Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{total.toFixed(3)} OMR</span>
                <ChevronRight className="h-4 w-4 opacity-70" />
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Wrap in Suspense so useSearchParams() doesn't bail out SSR
export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <MenuPageInner />
    </Suspense>
  )
}
