'use client'

import type { Metadata } from 'next'
import DataTable from '@/components/dashboard/DataTable'
import { mockCustomers, formatUGX } from '@/lib/dashboard-data'
import type { Customer } from '@/lib/dashboard-data'

const statusStyles: Record<Customer['status'], string> = {
  VIP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const columns = [
  {
    key: 'name' as keyof Customer,
    label: 'Customer',
    sortable: true,
    render: (_: unknown, row: Customer) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coffee-gradient text-white text-sm font-semibold">
          {row.name[0]}
        </div>
        <div>
          <p className="font-medium text-coffee-900 dark:text-cream-100">{row.name}</p>
          <p className="text-xs text-coffee-400">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'phone' as keyof Customer,
    label: 'Phone',
    render: (v: unknown) => <span className="text-coffee-600 dark:text-coffee-400 text-sm">{v as string}</span>,
  },
  {
    key: 'totalOrders' as keyof Customer,
    label: 'Orders',
    sortable: true,
    render: (v: unknown) => <span className="font-semibold text-coffee-900 dark:text-cream-100">{v as number}</span>,
  },
  {
    key: 'totalSpent' as keyof Customer,
    label: 'Total Spent',
    sortable: true,
    render: (v: unknown) => <span className="font-semibold text-coffee-900 dark:text-cream-100">{formatUGX(v as number)}</span>,
  },
  {
    key: 'loyaltyPoints' as keyof Customer,
    label: 'Loyalty',
    render: (v: unknown) => (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium text-coffee-700 dark:text-cream-200">{v as number} pts</span>
      </div>
    ),
  },
  {
    key: 'lastVisit' as keyof Customer,
    label: 'Last Visit',
    sortable: true,
    render: (v: unknown) => <span className="text-coffee-500 dark:text-coffee-400 text-sm">{v as string}</span>,
  },
  {
    key: 'status' as keyof Customer,
    label: 'Status',
    render: (v: unknown) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[v as Customer['status']]}`}>
        {v as string}
      </span>
    ),
  },
]

const totalSpent = mockCustomers.reduce((s, c) => s + c.totalSpent, 0)
const vipCount = mockCustomers.filter((c) => c.status === 'VIP').length
const avgOrders = Math.round(mockCustomers.reduce((s, c) => s + c.totalOrders, 0) / mockCustomers.length)

export default function CustomersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Customers</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Manage your customer base and loyalty programme</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: mockCustomers.length.toString(), icon: '👥' },
          { label: 'VIP Members', value: vipCount.toString(), icon: '⭐' },
          { label: 'Avg Orders/Customer', value: avgOrders.toString(), icon: '☕' },
          { label: 'Total Lifetime Value', value: formatUGX(totalSpent), icon: '💰' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{s.value}</p>
            <p className="text-xs text-coffee-500 dark:text-coffee-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Customer table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Customers</h2>
          <span className="text-xs text-coffee-400">{mockCustomers.length} total</span>
        </div>
        <DataTable
          data={mockCustomers as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          searchKeys={['name', 'email', 'phone'] as never[]}
          pageSize={6}
        />
      </div>

      {/* Loyalty tiers */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Loyalty Programme Tiers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { tier: 'Bronze', range: '0–99 pts', perks: 'Birthday discount', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20', icon: '🥉' },
            { tier: 'Silver', range: '100–499 pts', perks: '5% off every order + Free drink on birthday', color: 'border-gray-300 bg-gray-50 dark:bg-gray-800/40', icon: '🥈' },
            { tier: 'Gold (VIP)', range: '500+ pts', perks: '10% off + Priority service + Free pastry monthly', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20', icon: '🥇' },
          ].map((t) => (
            <div key={t.tier} className={`rounded-2xl border-2 p-5 ${t.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <p className="font-bold text-coffee-900 dark:text-cream-100">{t.tier}</p>
              </div>
              <p className="text-xs font-medium text-coffee-500 dark:text-coffee-400 mb-2">{t.range}</p>
              <p className="text-sm text-coffee-700 dark:text-cream-300">{t.perks}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
