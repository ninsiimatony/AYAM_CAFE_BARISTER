import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DataTable from '@/components/dashboard/DataTable'
import { mockOrders, formatUGX } from '@/lib/dashboard-data'
import type { OrderItem } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'Orders' }

const statusStyles: Record<string, string> = {
  Ready:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Delivered: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const statusDots: Record<string, string> = {
  Ready:     'bg-green-500',
  Preparing: 'bg-yellow-500 animate-pulse',
  Delivered: 'bg-gray-400',
  Cancelled: 'bg-red-500',
}

const paymentIcons: Record<string, string> = {
  Cash: '💵', Card: '💳', 'Mobile Money': '📱',
}

const columns = [
  {
    key: 'id' as keyof OrderItem,
    label: 'Order',
    sortable: true,
    render: (v: unknown) => (
      <span className="font-mono text-xs font-semibold text-coffee-700 dark:text-coffee-300">{v as string}</span>
    ),
  },
  {
    key: 'items' as keyof OrderItem,
    label: 'Items',
    render: (v: unknown) => (
      <span className="text-sm text-coffee-900 dark:text-cream-100 max-w-[180px] truncate block">{v as string}</span>
    ),
  },
  {
    key: 'customer' as keyof OrderItem,
    label: 'Customer',
    sortable: true,
    render: (v: unknown) => <span className="text-sm text-coffee-600 dark:text-coffee-400">{v as string}</span>,
  },
  {
    key: 'barista' as keyof OrderItem,
    label: 'Barista',
    render: (v: unknown) => <span className="text-sm text-coffee-600 dark:text-coffee-400">{v as string}</span>,
  },
  {
    key: 'paymentMethod' as keyof OrderItem,
    label: 'Payment',
    render: (v: unknown) => (
      <span className="text-sm text-coffee-500 dark:text-coffee-400">
        {paymentIcons[v as string] ?? '💰'} {v as string}
      </span>
    ),
  },
  {
    key: 'total' as keyof OrderItem,
    label: 'Total',
    sortable: true,
    render: (v: unknown) => (
      <span className="text-sm font-semibold text-coffee-900 dark:text-cream-100 whitespace-nowrap">
        {formatUGX(v as number)}
      </span>
    ),
  },
  {
    key: 'status' as keyof OrderItem,
    label: 'Status',
    render: (v: unknown) => (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[v as string]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${statusDots[v as string]}`} />
        {v as string}
      </span>
    ),
  },
  {
    key: 'createdAt' as keyof OrderItem,
    label: 'Time',
    sortable: true,
    render: (v: unknown) => <span className="text-xs text-coffee-400 whitespace-nowrap">{v as string}</span>,
  },
]

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const statusCounts = {
    Preparing: mockOrders.filter((o) => o.status === 'Preparing').length,
    Ready:     mockOrders.filter((o) => o.status === 'Ready').length,
    Delivered: mockOrders.filter((o) => o.status === 'Delivered').length,
    Cancelled: mockOrders.filter((o) => o.status === 'Cancelled').length,
  }

  const totalRevenue = mockOrders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((s, o) => s + o.total, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Orders</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Track and manage all café orders in real-time</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Order
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2.5 w-2.5 rounded-full ${statusDots[status]}`} />
              <p className="text-xs font-medium text-coffee-500 dark:text-coffee-400">{status}</p>
            </div>
            <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100">{count}</p>
          </div>
        ))}
      </div>

      {/* Revenue strip */}
      <div className="rounded-2xl bg-coffee-gradient p-5 text-white shadow-coffee">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-cream-200 opacity-80">Today&apos;s Revenue (excl. cancelled)</p>
            <p className="text-3xl font-bold mt-1">{formatUGX(totalRevenue)}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Orders</h2>
          <span className="text-xs text-coffee-400">{mockOrders.length} total today</span>
        </div>
        <DataTable
          data={mockOrders as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Parameters<typeof DataTable>[0]['columns']}
          searchKeys={['id', 'items', 'customer', 'barista'] as never[]}
          pageSize={6}
        />
      </div>
    </div>
  )
}
