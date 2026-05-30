'use client'

import { salesData, formatUGX } from '@/lib/dashboard-data'

interface SalesChartProps {
  metric?: 'revenue' | 'orders'
}

export default function SalesChart({ metric = 'revenue' }: SalesChartProps) {
  const values = salesData.map((d) => (metric === 'revenue' ? d.revenue : d.orders))
  const max = Math.max(...values)
  const total = values.reduce((a, b) => a + b, 0)
  const barColors = values.map((v) => (v === max ? 'bg-coffee-600 dark:bg-coffee-400' : 'bg-coffee-200 dark:bg-coffee-700'))

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">Daily {metric === 'revenue' ? 'Revenue' : 'Orders'}</h2>
          <p className="text-sm text-coffee-500 dark:text-coffee-400 mt-0.5">Last 7 days</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-coffee-900 dark:text-cream-100">
            {metric === 'revenue' ? formatUGX(total) : total}
          </p>
          <p className="text-xs text-coffee-400">Weekly total</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-2 h-36">
        {salesData.map((day, i) => {
          const val = metric === 'revenue' ? day.revenue : day.orders
          const height = Math.round((val / max) * 100)
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex justify-center">
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded-xl bg-coffee-900 dark:bg-coffee-700 px-2.5 py-1.5 text-xs text-white shadow-lg z-10 flex-col items-center">
                  <span className="font-semibold">
                    {metric === 'revenue' ? formatUGX(val) : `${val} orders`}
                  </span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-coffee-900 dark:bg-coffee-700" />
                </div>
                <div
                  className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 ${barColors[i]}`}
                  style={{ height: `${Math.max(height, 6)}%` }}
                />
              </div>
              <span className="text-xs text-coffee-400 dark:text-coffee-500">{day.date}</span>
            </div>
          )
        })}
      </div>

      {/* Legend row */}
      <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-coffee-100 dark:border-coffee-800">
        {[
          { label: 'Total Orders', value: salesData.reduce((s, d) => s + d.orders, 0).toString() },
          { label: 'Peak Day', value: salesData.reduce((a, b) => (a.revenue > b.revenue ? a : b)).date },
          { label: 'Avg/Day', value: formatUGX(Math.round(total / salesData.length)) },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-sm font-bold text-coffee-900 dark:text-cream-100">{item.value}</p>
            <p className="text-xs text-coffee-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
