'use client'

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { POSCartItem, POSProduct, POSTable, POSTransaction, POSPaymentMethod } from '@/lib/types'

interface POSState {
  cart: POSCartItem[]
  selectedTable: POSTable | null
  lastTransaction: POSTransaction | null
}

type POSAction =
  | { type: 'ADD_ITEM';      product: POSProduct }
  | { type: 'REMOVE_ITEM';   product_id: string }
  | { type: 'SET_QTY';       product_id: string; qty: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_TABLE';     table: POSTable | null }
  | { type: 'SET_LAST_TX';   tx: POSTransaction }

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.cart.find(i => i.product_id === action.product.id)
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.product_id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            product_id: action.product.id,
            name:       action.product.name,
            price:      action.product.price,
            quantity:   1,
          },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, cart: state.cart.filter(i => i.product_id !== action.product_id) }
    case 'SET_QTY':
      if (action.qty <= 0) {
        return { ...state, cart: state.cart.filter(i => i.product_id !== action.product_id) }
      }
      return {
        ...state,
        cart: state.cart.map(i =>
          i.product_id === action.product_id ? { ...i, quantity: action.qty } : i
        ),
      }
    case 'CLEAR_CART':
      return { ...state, cart: [], selectedTable: null }
    case 'SET_TABLE':
      return { ...state, selectedTable: action.table }
    case 'SET_LAST_TX':
      return { ...state, lastTransaction: action.tx }
    default:
      return state
  }
}

interface POSContextValue {
  cart: POSCartItem[]
  selectedTable: POSTable | null
  lastTransaction: POSTransaction | null
  addToCart:    (product: POSProduct) => void
  removeFromCart: (product_id: string) => void
  setQuantity:  (product_id: string, qty: number) => void
  clearCart:    () => void
  setTable:     (table: POSTable | null) => void
  cartSubtotal: number
  cartItemCount: number
  processPayment: (opts: {
    payment_method: POSPaymentMethod
    amount_paid?: number
    tax_rate?: number
    discount_amount?: number
    notes?: string
  }) => Promise<POSTransaction>
}

const POSContext = createContext<POSContextValue | null>(null)

export function POSProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, {
    cart: [],
    selectedTable: null,
    lastTransaction: null,
  })

  const addToCart    = useCallback((p: POSProduct) => dispatch({ type: 'ADD_ITEM', product: p }), [])
  const removeFromCart = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', product_id: id }), [])
  const setQuantity  = useCallback((id: string, qty: number) => dispatch({ type: 'SET_QTY', product_id: id, qty }), [])
  const clearCart    = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])
  const setTable     = useCallback((t: POSTable | null) => dispatch({ type: 'SET_TABLE', table: t }), [])

  const cartSubtotal  = state.cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartItemCount = state.cart.reduce((s, i) => s + i.quantity, 0)

  const processPayment = useCallback(async (opts: {
    payment_method: POSPaymentMethod
    amount_paid?: number
    tax_rate?: number
    discount_amount?: number
    notes?: string
  }): Promise<POSTransaction> => {
    const res = await fetch('/api/pos/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id:        state.selectedTable?.id ?? null,
        items:           state.cart,
        payment_method:  opts.payment_method,
        amount_paid:     opts.amount_paid,
        tax_rate:        opts.tax_rate ?? 0,
        discount_amount: opts.discount_amount ?? 0,
        notes:           opts.notes,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Payment failed')
    }
    const { data } = await res.json()
    dispatch({ type: 'SET_LAST_TX', tx: data })
    dispatch({ type: 'CLEAR_CART' })
    return data as POSTransaction
  }, [state.cart, state.selectedTable])

  return (
    <POSContext.Provider value={{
      cart: state.cart,
      selectedTable: state.selectedTable,
      lastTransaction: state.lastTransaction,
      addToCart, removeFromCart, setQuantity, clearCart, setTable,
      cartSubtotal, cartItemCount,
      processPayment,
    }}>
      {children}
    </POSContext.Provider>
  )
}

export function usePOS(): POSContextValue {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error('usePOS must be used inside POSProvider')
  return ctx
}
