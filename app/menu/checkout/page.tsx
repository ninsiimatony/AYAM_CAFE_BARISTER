'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Minus, Plus, Trash2,
  Banknote, CreditCard, MessageSquare,
  CheckCircle2, Send,
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { formatPrice } from '@/lib/menu-data'

type PaymentMethod = 'cash' | 'card'
type PageState = 'checkout' | 'confirmed'

// ── WhatsApp number resolution ────────────────────────────────────────────────
// Reads the number configured in the admin panel (stored in localStorage with
// the same key as the menuversepro.pages.dev app). Falls back to the env var.
function getWhatsAppNumber(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('whatsapp_number')
    if (stored && stored.length >= 7) return stored
  }
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
}

// ── Order line ────────────────────────────────────────────────────────────────

function OrderLine({
  emoji, name, nameAr, qty, price, onInc, onDec, onRemove,
}: {
  emoji: string; name: string; nameAr: string
  qty: number; price: number
  onInc: () => void; onDec: () => void; onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-stone-900 text-sm leading-tight truncate">{name}</p>
        <p className="text-xs text-stone-400" dir="rtl">{nameAr}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onDec}
          className="h-7 w-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
          {qty === 1
            ? <Trash2 className="h-3 w-3 text-rose-500" />
            : <Minus className="h-3.5 w-3.5 text-stone-600" />}
        </button>
        <span className="w-5 text-center text-sm font-bold text-stone-900">{qty}</span>
        <button onClick={onInc}
          className="h-7 w-7 rounded-full bg-stone-900 hover:bg-stone-700 flex items-center justify-center transition-colors">
          <Plus className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
      <span className="w-20 text-right text-sm font-semibold text-amber-800 flex-shrink-0">
        {(price * qty).toFixed(3)}
      </span>
    </div>
  )
}

// ── Confirmation receipt ──────────────────────────────────────────────────────

function Receipt({
  kotNumber, tableNumber, items, total, paymentMethod, comment, onNewOrder,
}: {
  kotNumber: string; tableNumber: string
  items: Array<{ emoji: string; name: string; price: number; quantity: number }>
  total: number; paymentMethod: PaymentMethod; comment: string
  onNewOrder: () => void
}) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-sm mx-auto">
      {/* Success indicator */}
      <div className="text-center mb-6">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-stone-900">Order Sent!</h2>
        <p className="text-sm text-stone-500 mt-1">
          Switch to WhatsApp and tap <strong>Send</strong>
        </p>
      </div>

      {/* Receipt card */}
      <div className="bg-white rounded-3xl shadow-md border border-stone-100 overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 px-6 py-4 text-white text-center">
          <p className="text-xs font-medium tracking-widest uppercase opacity-60 mb-1">AYAM Café</p>
          <p className="text-lg font-bold tracking-wide">{kotNumber}</p>
          <p className="text-xs opacity-60 mt-1">Table {tableNumber} · {timeStr} · {dateStr}</p>
        </div>

        {/* Items */}
        <div className="px-6 py-4 divide-y divide-stone-100">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 text-sm">
              <span className="flex items-center gap-2">
                <span>{item.emoji}</span>
                <span className="text-stone-800">{item.name}</span>
                <span className="text-stone-400">× {item.quantity}</span>
              </span>
              <span className="font-semibold text-stone-900">
                {(item.price * item.quantity).toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-stone-200 mx-6" />
        <div className="px-6 py-4 space-y-2">
          <div className="flex justify-between text-sm text-stone-500">
            <span>Subtotal</span>
            <span>{total.toFixed(3)} OMR</span>
          </div>
          <div className="flex justify-between font-bold text-stone-900 text-base">
            <span>TOTAL</span>
            <span>{total.toFixed(3)} OMR</span>
          </div>
        </div>

        {/* Payment + comment */}
        <div className="border-t border-stone-100 px-6 py-4 space-y-2 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            {paymentMethod === 'cash'
              ? <Banknote className="h-4 w-4 text-green-600" />
              : <CreditCard className="h-4 w-4 text-blue-600" />}
            <span>{paymentMethod === 'cash' ? 'Cash at Counter' : 'Visa / Card'}</span>
          </div>
          {comment && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-stone-400" />
              <span className="italic text-stone-500">&ldquo;{comment}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3 text-center">
          <p className="text-[11px] text-stone-400">Thank you for dining with us ☕</p>
        </div>
      </div>

      <button
        onClick={onNewOrder}
        className="mt-6 w-full py-3.5 rounded-2xl border-2 border-stone-200 text-stone-700 font-semibold hover:bg-stone-100 transition-colors text-sm"
      >
        ← Place Another Order
      </button>
    </div>
  )
}

// ── Checkout page ─────────────────────────────────────────────────────────────

function CheckoutPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('table') ?? '1'

  const { items, total, itemCount, updateQty, addItem, clearCart, kotNumber } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [comment, setComment] = useState('')
  const [pageState, setPageState] = useState<PageState>('checkout')
  const [sending, setSending] = useState(false)

  // Redirect to menu if cart is empty (unless confirmed)
  useEffect(() => {
    if (items.length === 0 && pageState === 'checkout') {
      router.replace(`/menu?table=${tableNumber}`)
    }
  }, [items.length, pageState, router, tableNumber])

  function buildWhatsAppMessage(): string {
    const lines: string[] = [
      `🧾 *ORDER — ${kotNumber}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      `📍 Table: ${tableNumber}`,
      ``,
      ...items.map(c => `${c.item.emoji} ${c.item.name} × ${c.quantity} — ${(c.item.price * c.quantity).toFixed(3)} OMR`),
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `💰 *TOTAL: ${total.toFixed(3)} OMR*`,
      ``,
      `💳 Payment: ${paymentMethod === 'cash' ? 'Cash at Counter' : 'Visa / Card'}`,
      ...(comment.trim() ? [`💬 Note: ${comment.trim()}`] : []),
      `━━━━━━━━━━━━━━━━━━━`,
      `⏰ ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    ]
    return lines.join('\n')
  }

  async function handleSendOrder() {
    setSending(true)

    // Save order to server (best-effort)
    try {
      await fetch('/api/menu/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kot_number: kotNumber,
          table_number: tableNumber,
          items: items.map(c => ({
            id: c.item.id,
            name: c.item.name,
            emoji: c.item.emoji,
            price: c.item.price,
            quantity: c.quantity,
          })),
          total,
          payment_method: paymentMethod,
          comment: comment.trim() || null,
        }),
      })
    } catch {
      // Non-blocking — order still goes to WhatsApp
    }

    // Open WhatsApp
    const number = getWhatsAppNumber()
    const text = encodeURIComponent(buildWhatsAppMessage())
    const url = number
      ? `https://wa.me/${number}?text=${text}`
      : `https://wa.me/?text=${text}`

    window.open(url, '_blank')

    setSending(false)
    setPageState('confirmed')
  }

  function handleNewOrder() {
    clearCart()
    router.push(`/menu?table=${tableNumber}`)
  }

  // ── Confirmed state ────────────────────────────────────────────────────────
  if (pageState === 'confirmed') {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-8">
        <Receipt
          kotNumber={kotNumber}
          tableNumber={tableNumber}
          items={items.map(c => ({
            emoji: c.item.emoji,
            name: c.item.name,
            price: c.item.price,
            quantity: c.quantity,
          }))}
          total={total}
          paymentMethod={paymentMethod}
          comment={comment}
          onNewOrder={handleNewOrder}
        />
      </div>
    )
  }

  // ── Checkout state ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-stone-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-stone-900 leading-none">Your Order</h1>
            <p className="text-xs text-stone-400 mt-0.5">{itemCount} item{itemCount !== 1 ? 's' : ''} · Table {tableNumber}</p>
          </div>
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-mono font-semibold px-2.5 py-1 rounded-lg">
            {kotNumber}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-44 pt-4 space-y-4">

        {/* ── Order items ────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 divide-y divide-stone-100">
          {items.map(c => (
            <OrderLine
              key={c.item.id}
              emoji={c.item.emoji}
              name={c.item.name}
              nameAr={c.item.nameAr}
              qty={c.quantity}
              price={c.item.price}
              onInc={() => addItem(c.item)}
              onDec={() => updateQty(c.item.id, c.quantity - 1)}
              onRemove={() => updateQty(c.item.id, 0)}
            />
          ))}
        </section>

        {/* ── Subtotal strip ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 px-4 py-4 flex justify-between items-center">
          <span className="text-stone-500 text-sm">Subtotal ({itemCount} items)</span>
          <span className="font-bold text-stone-900">{total.toFixed(3)} OMR</span>
        </div>

        {/* ── Payment method ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <h2 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-stone-500" />
            Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center gap-2 rounded-xl py-4 border-2 transition-all font-semibold text-sm ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
              }`}
            >
              <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-green-600' : 'text-stone-400'}`} />
              <span>Cash</span>
              <span className={`text-xs font-normal ${paymentMethod === 'cash' ? 'text-green-600' : 'text-stone-400'}`}>
                Pay at counter
              </span>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center gap-2 rounded-xl py-4 border-2 transition-all font-semibold text-sm ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
              }`}
            >
              <CreditCard className={`h-6 w-6 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-stone-400'}`} />
              <span>Visa / Card</span>
              <span className={`text-xs font-normal ${paymentMethod === 'card' ? 'text-blue-600' : 'text-stone-400'}`}>
                Tap or insert
              </span>
            </button>
          </div>
        </section>

        {/* ── Special comments ───────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <label
            htmlFor="comment"
            className="font-semibold text-stone-900 mb-3 flex items-center gap-2 block"
          >
            <MessageSquare className="h-4 w-4 text-stone-500" />
            Special Request
            <span className="text-xs font-normal text-stone-400 ml-1">Optional</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="e.g. Extra sugar, no ice, allergen info…"
            rows={3}
            maxLength={200}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-sm text-stone-800 placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
          />
          <p className="text-right text-xs text-stone-400 mt-1">{comment.length}/200</p>
        </section>

        {/* ── Order summary strip ────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
          <div className="flex justify-between text-sm text-amber-900">
            <span>KOT Number</span>
            <span className="font-mono font-semibold">{kotNumber}</span>
          </div>
          <div className="flex justify-between text-sm text-amber-900 mt-1.5">
            <span>Table</span>
            <span className="font-semibold">{tableNumber}</span>
          </div>
          <div className="flex justify-between text-sm text-amber-900 mt-1.5">
            <span>Payment</span>
            <span className="font-semibold">
              {paymentMethod === 'cash' ? '💵 Cash' : '💳 Visa / Card'}
            </span>
          </div>
        </div>
      </main>

      {/* ── Bottom send button ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex justify-between text-xs text-stone-500 px-1">
            <span>Total to pay</span>
            <span className="font-bold text-stone-900 text-sm">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleSendOrder}
            disabled={sending || items.length === 0}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors shadow-md text-base"
          >
            <Send className="h-5 w-5" />
            {sending ? 'Sending…' : 'Send Order via WhatsApp 📲'}
          </button>
          <p className="text-center text-xs text-stone-400">
            WhatsApp will open — tap <strong>Send</strong> to confirm
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <CheckoutPageInner />
    </Suspense>
  )
}
