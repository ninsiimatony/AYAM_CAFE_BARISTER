'use client'

import { useState, useEffect } from 'react'
import type { POSTable } from '@/lib/types'

type TableStatus = POSTable['status']

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; dot: string }> = {
  available: { label: 'Available', color: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300', dot: 'bg-green-500' },
  occupied:  { label: 'Occupied',  color: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300', dot: 'bg-red-500' },
  reserved:  { label: 'Reserved',  color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300', dot: 'bg-yellow-500' },
  cleaning:  { label: 'Cleaning',  color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
}

const STATUSES: TableStatus[] = ['available', 'occupied', 'reserved', 'cleaning']

export default function TablesPage() {
  const [tables,  setTables]  = useState<POSTable[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function loadTables() {
    const res = await fetch('/api/pos/tables')
    const { data } = await res.json()
    setTables(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadTables() }, [])

  async function updateStatus(table: POSTable, status: TableStatus) {
    setUpdating(table.id)
    await fetch('/api/pos/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: table.id, status }),
    })
    await loadTables()
    setUpdating(null)
  }

  const counts = Object.fromEntries(
    STATUSES.map(s => [s, tables.filter(t => t.status === s).length])
  ) as Record<TableStatus, number>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-coffee-900 dark:text-cream-100">Table Management</h1>
        <p className="text-sm text-coffee-400">{tables.length} tables</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-4">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className={`rounded-2xl border-2 px-4 py-3 ${cfg.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs font-semibold">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold">{counts[s]}</p>
            </div>
          )
        })}
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-white dark:bg-coffee-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map(table => {
            const cfg = STATUS_CONFIG[table.status]
            return (
              <div key={table.id} className={`rounded-2xl border-2 p-4 transition-all ${cfg.color}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold">{table.table_number}</p>
                    <p className="text-xs opacity-70">{table.location ?? 'Main'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                    </svg>
                    {table.capacity}
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-semibold">{cfg.label}</span>
                </div>

                {/* Status changer */}
                <select
                  value={table.status}
                  onChange={e => updateStatus(table, e.target.value as TableStatus)}
                  disabled={updating === table.id}
                  className="w-full rounded-lg border border-current/20 bg-white/70 dark:bg-black/30 px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-current/30 disabled:opacity-50 cursor-pointer"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s} className="text-coffee-900">
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
