import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoleBadge from '@/components/RoleBadge'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

const mockOrders = [
  { id: '#1042', items: 'Cappuccino × 2', customer: 'Table 5', barista: 'Ali K.', status: 'Ready', total: 'UGX 16,000', time: '09:42' },
  { id: '#1041', items: 'Latte + Croissant', customer: 'Table 2', barista: 'Sara M.', status: 'Preparing', total: 'UGX 22,000', time: '09:38' },
  { id: '#1040', items: 'Espresso × 3', customer: 'Takeaway', barista: 'John B.', status: 'Delivered', total: 'UGX 18,000', time: '09:30' },
  { id: '#1039', items: 'Flat White', customer: 'Table 8', barista: 'Ali K.', status: 'Delivered', total: 'UGX 9,000', time: '09:24' },
  { id: '#1038', items: 'Americano + Muffin', customer: 'Table 1', barista: 'Sara M.', status: 'Delivered', total: 'UGX 15,000', time: '09:18' },
  { id: '#1037', items: 'Mocha × 2', customer: 'Table 6', barista: 'John B.', status: 'Cancelled', total: 'UGX 20,000', time: '09:10' },
]

const statusConfig: Record<string, { color: string; dot: string }> = {
  Ready:     { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  Preparing: { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500 animate-pulse' },
  Delivered: { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
  Cancelled: { color: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'customer') as Profile['role']

  const statusCounts = {
    Preparing: mockOrders.filter(o => o.status === 'Preparing').length,
    Ready: mockOrders.filter(o => o.status === 'Ready').length,
    Delivered: mockOrders.filter(o => o.status === 'Delivered').length,
    Cancelled: mockOrders.filter(o => o.status === 'Cancelled').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">Orders</h1>
          <p className="text-coffee-500 mt-1">Track and manage all café orders</p>
        </div>
        <RoleBadge role={role} />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="stat-card">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-2 w-2 rounded-full ${statusConfig[status]?.dot ?? 'bg-gray-400'}`} />
              <p className="text-xs font-medium text-coffee-500">{status}</p>
            </div>
            <p className="text-2xl font-bold text-coffee-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900">Today&apos;s Orders</h2>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-coffee-400">Live</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coffee-100">
                {['Order', 'Items', 'Customer', 'Barista', 'Total', 'Status', 'Time'].map((h) => (
                  <th key={h} className="pb-3 text-left font-medium text-coffee-500 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {mockOrders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-coffee-700">{order.id}</td>
                  <td className="py-3 pr-4 text-coffee-900 max-w-[140px] truncate">{order.items}</td>
                  <td className="py-3 pr-4 text-coffee-600">{order.customer}</td>
                  <td className="py-3 pr-4 text-coffee-600 hidden sm:table-cell">{order.barista}</td>
                  <td className="py-3 pr-4 font-medium text-coffee-800 whitespace-nowrap">{order.total}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[order.status]?.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[order.status]?.dot}`} />
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-coffee-400 whitespace-nowrap">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
