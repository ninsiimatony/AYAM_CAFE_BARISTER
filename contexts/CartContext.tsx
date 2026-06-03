'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { MenuItem } from '@/lib/menu-data'

export interface CartItem {
  item: MenuItem
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: MenuItem) => void
  removeItem: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  clearCart: () => void
  total: number
  itemCount: number
  kotNumber: string
}

const CartContext = createContext<CartContextValue | null>(null)

function generateKOT(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `KOT-${yy}${mm}${dd}-${seq}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [kotNumber] = useState<string>(generateKOT)

  const addItem = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) {
        return prev.map(c =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(c => c.item.id !== itemId))
  }, [])

  const updateQty = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(c => c.item.id !== itemId))
    } else {
      setItems(prev =>
        prev.map(c => (c.item.id === itemId ? { ...c, quantity: qty } : c))
      )
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, c) => sum + c.item.price * c.quantity, 0)
  const itemCount = items.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, total, itemCount, kotNumber }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be inside CartProvider')
  return ctx
}
