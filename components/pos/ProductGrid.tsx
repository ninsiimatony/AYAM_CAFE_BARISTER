'use client'

import { useState, useEffect } from 'react'
import { usePOS } from '@/contexts/POSContext'
import type { POSCategory, POSProduct } from '@/lib/types'

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString()}`
}

function ProductCard({ product }: { product: POSProduct }) {
  const { addToCart, cart } = usePOS()
  const cartItem = cart.find(i => i.product_id === product.id)
  const qty = cartItem?.quantity ?? 0

  return (
    <button
      onClick={() => addToCart(product)}
      disabled={!product.is_available}
      className={`
        relative flex flex-col rounded-xl border p-3 text-left transition-all duration-150 active:scale-95
        ${product.is_available
          ? 'bg-white dark:bg-coffee-900 border-coffee-100 dark:border-coffee-800 hover:border-coffee-400 hover:shadow-coffee cursor-pointer'
          : 'bg-coffee-50 dark:bg-coffee-950 border-coffee-100 dark:border-coffee-900 opacity-50 cursor-not-allowed'
        }
      `}
    >
      {qty > 0 && (
        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-coffee-gradient text-white text-xs font-bold">
          {qty}
        </span>
      )}
      <div className="mb-2 text-2xl">{product.pos_categories?.icon ?? '🍽️'}</div>
      <p className="text-sm font-semibold text-coffee-900 dark:text-cream-100 leading-tight line-clamp-1">
        {product.name}
      </p>
      <p className="mt-0.5 text-xs text-coffee-400 dark:text-coffee-500 line-clamp-1">
        {product.description}
      </p>
      <p className="mt-2 text-sm font-bold text-coffee-700 dark:text-caramel-400">
        {formatUGX(product.price)}
      </p>
      {!product.is_available && (
        <span className="mt-1 text-xs text-red-500 font-medium">Unavailable</span>
      )}
    </button>
  )
}

export default function ProductGrid() {
  const [categories, setCategories] = useState<POSCategory[]>([])
  const [products,   setProducts]   = useState<POSProduct[]>([])
  const [activeCat,  setActiveCat]  = useState<string>('all')
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/pos/categories')
      .then(r => r.json())
      .then(({ data }) => setCategories(data ?? []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeCat !== 'all') params.set('category_id', activeCat)
    fetch(`/api/pos/products?${params}`)
      .then(r => r.json())
      .then(({ data }) => setProducts(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeCat])

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="mb-3 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coffee-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          placeholder="Search menu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-coffee-100 dark:border-coffee-800 bg-white dark:bg-coffee-900 pl-9 pr-3 py-2 text-sm text-coffee-900 dark:text-cream-100 placeholder-coffee-400 focus:outline-none focus:ring-2 focus:ring-coffee-300"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveCat('all')}
          className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            activeCat === 'all'
              ? 'bg-coffee-gradient text-white shadow-coffee'
              : 'bg-white dark:bg-coffee-900 text-coffee-600 dark:text-coffee-300 border border-coffee-100 dark:border-coffee-800 hover:border-coffee-300'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeCat === cat.id
                ? 'bg-coffee-gradient text-white shadow-coffee'
                : 'bg-white dark:bg-coffee-900 text-coffee-600 dark:text-coffee-300 border border-coffee-100 dark:border-coffee-800 hover:border-coffee-300'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-coffee-50 dark:bg-coffee-900 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-coffee-400">
            <span className="text-4xl mb-2">🍽️</span>
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
