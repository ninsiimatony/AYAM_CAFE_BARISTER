import { createClient } from '@/lib/supabase/server'
import RoleBadge from '@/components/RoleBadge'
import type { Profile, UserRole } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

const stats = [
  {
    label: 'Total Orders Today',
    value: '24',
    change: '+12%',
    up: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Revenue Today',
    value: 'UGX 184,000',
    change: '+8%',
    up: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-50 text-green-600',
  },
  {
    label: 'Active Staff',
    value: '6',
    change: 'On shift',
    up: null,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'bg-coffee-50 text-coffee-600',
  },
  {
    label: 'Pending Orders',
    value: '3',
    change: '-2 from 1h ago',
    up: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-orange-50 text-orange-600',
  },
]

const recentOrders = [
  { id: '#1042', item: 'Cappuccino × 2', customer: 'Table 5', status: 'Ready', time: '2m ago' },
  { id: '#1041', item: 'Latte + Croissant', customer: 'Table 2', status: 'Preparing', time: '5m ago' },
  { id: '#1040', item: 'Espresso × 3', customer: 'Takeaway', status: 'Delivered', time: '12m ago' },
  { id: '#1039', item: 'Flat White', customer: 'Table 8', status: 'Delivered', time: '18m ago' },
]

const statusColors: Record<string, string> = {
  Ready: 'bg-green-100 text-green-700',
  Preparing: 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-gray-100 text-gray-500',
  Cancelled: 'bg-red-100 text-red-600',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'there'
  const role = (profile?.role ?? 'customer') as UserRole

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900">
            {greeting}, {displayName}! ☕
          </h1>
          <p className="text-coffee-500 mt-1">
            Here&apos;s what&apos;s happening at the café today.
          </p>
        </div>
        <RoleBadge role={role} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-coffee-500">{stat.label}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-coffee-900 mt-1">{stat.value}</p>
            <p className={`text-xs font-medium mt-1 ${
              stat.up === true ? 'text-green-600' :
              stat.up === false ? 'text-red-500' :
              'text-coffee-400'
            }`}>
              {stat.up === true && '↑ '}
              {stat.up === false && '↓ '}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-coffee-900">Recent Orders</h2>
            <a href="/dashboard/orders" className="text-xs font-medium text-coffee-600 hover:text-coffee-800 transition-colors">
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coffee-100 text-coffee-600 text-xs font-bold">
                    ☕
                  </div>
                  <div>
                    <p className="text-sm font-medium text-coffee-900">{order.item}</p>
                    <p className="text-xs text-coffee-400">{order.id} · {order.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-coffee-400">{order.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="dashboard-card">
          <h2 className="font-semibold text-coffee-900 mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/orders', label: 'New Order', icon: '➕', desc: 'Add a new order' },
              { href: '/dashboard/orders', label: 'View Orders', icon: '📋', desc: 'See all orders' },
              { href: '/dashboard/profile', label: 'My Profile', icon: '👤', desc: 'Update your info' },
              ...(role !== 'customer' ? [
                { href: '/dashboard/staff', label: 'Staff List', icon: '👥', desc: 'Manage staff' },
              ] : []),
              ...(role === 'admin' ? [
                { href: '/dashboard/admin', label: 'Admin Panel', icon: '⚙️', desc: 'System settings' },
              ] : []),
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-coffee-50 transition-colors group"
              >
                <span className="text-xl">{action.icon}</span>
                <div>
                  <p className="text-sm font-medium text-coffee-800 group-hover:text-coffee-900">{action.label}</p>
                  <p className="text-xs text-coffee-400">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
