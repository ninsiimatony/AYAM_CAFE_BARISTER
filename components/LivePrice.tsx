'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function LivePrice() {
  const [price, setPrice]     = useState<number | null>(null)
  const [prev, setPrev]       = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res  = await fetch('/api/price')
        const data = await res.json()
        if (data.price) {
          setPrev((p) => price ?? p)
          setPrice(data.price)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchPrice()
    const id = setInterval(fetchPrice, 10000)
    return () => clearInterval(id)
  }, [price])

  const dir = price === null || prev === null ? 0 : price > prev ? 1 : price < prev ? -1 : 0
  const color = dir > 0 ? 'text-emerald-400' : dir < 0 ? 'text-red-400' : 'text-gray-300'
  const Icon  = dir > 0 ? TrendingUp : dir < 0 ? TrendingDown : Minus

  return (
    <div className="flex items-center gap-2 rounded-xl bg-gray-800/60 border border-gray-700 px-4 py-2.5">
      <div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">XAUUSD</p>
        {loading ? (
          <p className="text-sm font-bold text-gray-500">Loading…</p>
        ) : price ? (
          <p className={`text-sm font-bold ${color}`}>{price.toFixed(2)}</p>
        ) : (
          <p className="text-sm font-bold text-gray-500">—</p>
        )}
      </div>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
  )
}
