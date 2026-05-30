import { createClient } from '@/lib/supabase/server'
import RoleBadge from '@/components/RoleBadge'
import StatCard from '@/components/dashboard/StatCard'
import SalesChart from '@/components/dashboard/SalesChart'
import type { Profile, UserRole } from '@/lib/types'
import { mockOrders, salesData, formatUGX, todayStats } from '@/lib/dashboard-data'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const statusColors: Record<string, string> = {
  Ready:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Delivered: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data as Profile | null
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const role = (profile?.role ?? 'customer') as UserRole
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const recentOrders = mockOrders.slice(0, 5)
  const revSparkline = salesData.map((d) => d.revenue)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">
            {greeting}, {displayName}! ☕
          </h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">
            Here&apos;s what&apos;s happening at the café today.
          </p>
        </div>
        <RoleBadge role={role} />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Revenue Today"
          value={formatUGX(todayStats.revenue)}
          change={todayStats.revenueChange}
          sparkline={revSparkline}
          iconBg="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Orders Today"
          value={todayStats.orders.toString()}
          change={todayStats.ordersChange}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Customers Today"
          value={todayStats.customers.toString()}
          change={todayStats.customersChange}
          iconBg="bg-coffee-100 text-coffee-600 dark:bg-coffee-800 dark:text-coffee-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Avg Order Value"
          value={formatUGX(todayStats.avgOrderValue)}
          change={todayStats.avgOrderChange}
          iconBg="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart metric="revenue" />
        </div>

        {/* Quick actions */}
        <div className="dashboard-card">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/dashboard/orders', label: 'New Order', icon: '➕' },
              { href: '/dashboard/sales', label: 'View Sales', icon: '📊' },
              { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
              { href: '/dashboard/support', label: 'AI Support', icon: '🤖' },
              ...(role !== 'customer' ? [
                { href: '/dashboard/inventory', label: 'Inventory', icon: '📦' },
                { href: '/dashboard/employees', label: 'Employees', icon: '👔' },
              ] : []),
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-xl bg-cream-50 dark:bg-coffee-800 border border-coffee-100 dark:border-coffee-700 p-3 hover:bg-coffee-50 dark:hover:bg-coffee-700 hover:border-coffee-300 transition-all group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{action.icon}</span>
                <span className="text-xs font-medium text-coffee-700 dark:text-cream-300 text-center">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">Recent Orders</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-coffee-400">Live</span>
            </div>
            <a href="/dashboard/orders" className="text-xs font-medium text-coffee-600 dark:text-coffee-400 hover:text-coffee-800 dark:hover:text-cream-200 transition-colors">
              View all →
            </a>
          </div>
        </div>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-xl bg-cream-50 dark:bg-coffee-800/60 px-4 py-3 hover:bg-cream-100 dark:hover:bg-coffee-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coffee-100 dark:bg-coffee-700 text-coffee-600 dark:text-coffee-300 font-mono text-xs font-bold flex-shrink-0">
                  ☕
                </div>
                <div>
                  <p className="text-sm font-medium text-coffee-900 dark:text-cream-100 truncate max-w-[200px]">{order.items}</p>
                  <p className="text-xs text-coffee-400">{order.id} · {order.customer} · {order.barista}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                  {order.status}
                </span>
                <span className="text-xs font-semibold text-coffee-700 dark:text-cream-300 hidden sm:block">{formatUGX(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
