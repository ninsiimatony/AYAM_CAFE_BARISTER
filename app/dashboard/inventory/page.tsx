import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/types'
import DataTable from '@/components/dashboard/DataTable'
import { mockInventory, formatUGX, stockLevel } from '@/lib/dashboard-data'
import type { InventoryItem } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'Inventory' }

const levelStyles = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  good: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
}

const levelLabels = { critical: 'Critical', low: 'Low', good: 'Good' }

const columns = [
  {
    key: 'name' as keyof InventoryItem,
    label: 'Item',
    sortable: true,
    render: (_: unknown, row: InventoryItem) => (
      <div>
        <p className="font-medium text-coffee-900 dark:text-cream-100">{row.name}</p>
        <p className="text-xs text-coffee-400">{row.category}</p>
      </div>
    ),
  },
  {
    key: 'currentStock' as keyof InventoryItem,
    label: 'Current Stock',
    sortable: true,
    render: (_: unknown, row: InventoryItem) => {
      const level = stockLevel(row)
      const pct = Math.min(100, Math.round((row.currentStock / row.maxStock) * 100))
      return (
        <div className="min-w-[120px]">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-semibold text-coffee-900 dark:text-cream-100">{row.currentStock} {row.unit}</span>
            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${levelStyles[level]}`}>{levelLabels[level]}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-coffee-100 dark:bg-coffee-800">
            <div
              className={`h-1.5 rounded-full transition-all ${
                level === 'critical' ? 'bg-red-500' : level === 'low' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    key: 'minStock' as keyof InventoryItem,
    label: 'Min / Max',
    render: (_: unknown, row: InventoryItem) => (
      <span className="text-sm text-coffee-500 dark:text-coffee-400">{row.minStock} / {row.maxStock} {row.unit}</span>
    ),
  },
  {
    key: 'unitCost' as keyof InventoryItem,
    label: 'Unit Cost',
    sortable: true,
    render: (v: unknown) => <span className="text-sm font-medium text-coffee-700 dark:text-cream-200">{formatUGX(v as number)}</span>,
  },
  {
    key: 'supplier' as keyof InventoryItem,
    label: 'Supplier',
    render: (v: unknown) => <span className="text-sm text-coffee-500 dark:text-coffee-400">{v as string}</span>,
  },
  {
    key: 'lastRestocked' as keyof InventoryItem,
    label: 'Last Restocked',
    sortable: true,
    render: (v: unknown) => <span className="text-sm text-coffee-400">{v as string}</span>,
  },
]

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!hasRole(profile?.role ?? null, 'staff')) redirect('/dashboard')

  const criticalItems = mockInventory.filter((i) => stockLevel(i) === 'critical')
  const lowItems = mockInventory.filter((i) => stockLevel(i) === 'low')
  const totalValue = mockInventory.reduce((s, i) => s + i.currentStock * i.unitCost, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Inventory</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Stock levels, suppliers and reorder alerts</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: mockInventory.length.toString(), icon: '📦', color: '' },
          { label: 'Critical Stock', value: criticalItems.length.toString(), icon: '🚨', color: criticalItems.length > 0 ? 'border-red-300 dark:border-red-800' : '' },
          { label: 'Low Stock', value: lowItems.length.toString(), icon: '⚠️', color: lowItems.length > 0 ? 'border-yellow-300 dark:border-yellow-800' : '' },
          { label: 'Total Value', value: formatUGX(totalValue), icon: '💰', color: '' },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{s.value}</p>
            <p className="text-xs text-coffee-500 dark:text-coffee-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {criticalItems.length > 0 && (
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🚨</span>
            <h3 className="font-semibold text-red-700 dark:text-red-400">Critical Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalItems.map((item) => (
              <span key={item.id} className="rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-3 py-1 text-sm font-medium">
                {item.name} — {item.currentStock} {item.unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Items</h2>
          <div className="flex gap-2">
            {(['critical', 'low', 'good'] as const).map((level) => (
              <span key={level} className={`rounded-full px-2.5 py-1 text-xs font-medium ${levelStyles[level]}`}>
                {levelLabels[level]}: {mockInventory.filter((i) => stockLevel(i) === level).length}
              </span>
            ))}
          </div>
        </div>
        <DataTable
          data={mockInventory as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Parameters<typeof DataTable>[0]['columns']}
          searchKeys={['name', 'category', 'supplier'] as never[]}
          pageSize={6}
        />
      </div>
    </div>
  )
}
