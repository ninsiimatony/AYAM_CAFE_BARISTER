'use client'

import { useState, useEffect } from 'react'
import { usePOS } from '@/contexts/POSContext'
import type { POSTable } from '@/lib/types'

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300' },
  occupied:  { label: 'Occupied',  color: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300' },
  reserved:  { label: 'Reserved',  color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300' },
  cleaning:  { label: 'Cleaning',  color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300' },
}

interface Props { onClose: () => void }

export default function TableSelector({ onClose }: Props) {
  const { setTable, selectedTable } = usePOS()
  const [tables,  setTables]  = useState<POSTable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pos/tables')
      .then(r => r.json())
      .then(({ data }) => setTables(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(table: POSTable) {
    if (table.status !== 'available') return
    setTable(table)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-coffee-900 shadow-coffee-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-coffee-gradient text-white">
          <h2 className="font-bold text-lg">Select Table</h2>
          <button onClick={onClose} className="text-cream-300 hover:text-white transition-colors">
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="flex gap-3 flex-wrap mb-4">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs">
                <span className={`inline-block h-3 w-3 rounded-full border ${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-coffee-50 dark:bg-coffee-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {tables.map(table => {
                const cfg     = STATUS_CONFIG[table.status]
                const isActive = selectedTable?.id === table.id
                return (
                  <button
                    key={table.id}
                    onClick={() => handleSelect(table)}
                    disabled={table.status !== 'available'}
                    className={`
                      flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all
                      ${isActive ? 'border-coffee-500 bg-coffee-50 dark:bg-coffee-800 shadow-coffee' : cfg.color}
                      ${table.status === 'available' ? 'hover:shadow-coffee cursor-pointer active:scale-95' : 'cursor-not-allowed opacity-70'}
                    `}
                  >
                    <span className="text-xl font-bold">{table.table_number}</span>
                    <span className="text-xs mt-0.5">{table.location ?? 'Main'}</span>
                    <span className="text-xs mt-0.5 opacity-70">{table.capacity} seats</span>
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => { setTable(null); onClose() }}
            className="mt-4 w-full rounded-xl border border-coffee-200 dark:border-coffee-700 py-2 text-sm font-medium text-coffee-600 dark:text-coffee-400 hover:bg-coffee-50 dark:hover:bg-coffee-800 transition-colors"
          >
            No Table (Takeaway)
          </button>
        </div>
      </div>
    </div>
  )
}
