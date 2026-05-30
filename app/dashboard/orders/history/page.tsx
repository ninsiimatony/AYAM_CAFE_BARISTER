import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatUGX } from '@/lib/dashboard-data'
import type { Order } from '@/lib/types'

export const metadata: Metadata = { title: 'Order History — Ayam Café' }

const statusConfig: Record<
  Order['status'],
  { label: string; badge: string; dot: string }
> = {
  pending:   { label: 'Pending',   badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500 animate-pulse' },
  confirmed: { label: 'Confirmed', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',        dot: 'bg-blue-500' },
  preparing: { label: 'Preparing', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500 animate-pulse' },
  ready:     { label: 'Ready',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',    dot: 'bg-green-500' },
  delivered: { label: 'Delivered', badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',          dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function OrderHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // admin/staff use the main orders management page
  if (profile?.role !== 'customer') redirect('/dashboard/orders')

  const { data: rawOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (rawOrders ?? []) as Order[]

  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const activeCount = orders.filter(o =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  ).length

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">
          My Orders
        </h1>
        <p className="mt-1 text-coffee-500 dark:text-coffee-400">
          {profile?.full_name
            ? `${profile.full_name}'s order history at Ayam Café`
            : 'Your complete order history at Ayam Café'}
        </p>
      </div>

      {/* ── Summary cards ── */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100">{orders.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1">Active</p>
            <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100">{activeCount}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-1">Total Spent</p>
            <p className="text-base font-bold text-coffee-900 dark:text-cream-100 tabular-nums">
              {formatUGX(totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* ── Orders list ── */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">Order History</h2>
          {orders.length > 0 && (
            <span className="text-xs text-coffee-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* ── Empty state ── */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">☕</span>
            <p className="text-lg font-semibold text-coffee-900 dark:text-cream-100">No orders yet</p>
            <p className="mt-1 text-sm text-coffee-500 dark:text-coffee-400">
              Chat with Barista Bot to place your first order.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const s = statusConfig[order.status]
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-coffee-100 dark:border-coffee-800 bg-cream-50 dark:bg-coffee-900/40 p-4"
                >
                  {/* ── Top row: id + status + date ── */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-coffee-700 dark:text-coffee-300">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                    <span className="text-xs text-coffee-400 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* ── Item lines ── */}
                  <ul className="mt-3 space-y-1.5">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-coffee-900 dark:text-cream-100">
                          {item.name}
                          {item.quantity > 1 && (
                            <span className="ml-1 text-coffee-400 dark:text-coffee-500">
                              × {item.quantity}
                            </span>
                          )}
                          {item.notes && (
                            <span className="ml-1 text-xs italic text-coffee-400">({item.notes})</span>
                          )}
                        </span>
                        <span className="ml-4 font-medium text-coffee-700 dark:text-coffee-300 tabular-nums whitespace-nowrap">
                          {formatUGX(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* ── Footer: payment + notes + total ── */}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-coffee-100 dark:border-coffee-800 pt-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-coffee-500 dark:text-coffee-400">
                      {order.payment_method && (
                        <span>{order.payment_method}</span>
                      )}
                      {order.notes && (
                        <span
                          className="max-w-[180px] truncate"
                          title={order.notes}
                        >
                          Note: {order.notes}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-coffee-900 dark:text-cream-100 tabular-nums whitespace-nowrap">
                      {formatUGX(order.total)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
