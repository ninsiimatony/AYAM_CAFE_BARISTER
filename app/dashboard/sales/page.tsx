import type { Metadata } from 'next'
import SalesChart from '@/components/dashboard/SalesChart'
import StatCard from '@/components/dashboard/StatCard'
import { salesData, formatUGX } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'Sales & Analytics' }

const topItems = [
  { name: 'Cappuccino', sold: 142, revenue: 1278000, pct: 100 },
  { name: 'Latte', sold: 118, revenue: 1180000, pct: 83 },
  { name: 'Flat White', sold: 94, revenue: 846000, pct: 66 },
  { name: 'Cold Brew', sold: 71, revenue: 852000, pct: 50 },
  { name: 'Espresso', sold: 68, revenue: 476000, pct: 48 },
  { name: 'Mocha', sold: 53, revenue: 583000, pct: 37 },
]

const paymentBreakdown = [
  { method: 'Mobile Money', pct: 48, color: 'bg-coffee-500' },
  { method: 'Cash', pct: 34, color: 'bg-caramel-400' },
  { method: 'Card', pct: 18, color: 'bg-coffee-300' },
]

export default function SalesPage() {
  const weeklyRevenue = salesData.reduce((s, d) => s + d.revenue, 0)
  const weeklyOrders = salesData.reduce((s, d) => s + d.orders, 0)
  const avgRevDay = Math.round(weeklyRevenue / salesData.length)
  const peakDay = salesData.reduce((a, b) => (a.revenue > b.revenue ? a : b))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Sales & Analytics</h1>
        <p className="text-coffee-500 dark:text-coffee-400 mt-1">Revenue insights and performance metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Weekly Revenue"
          value={formatUGX(weeklyRevenue)}
          change={14.2}
          iconBg="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
          sparkline={salesData.map((d) => d.revenue)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Weekly Orders"
          value={weeklyOrders.toString()}
          change={8.3}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          sparkline={salesData.map((d) => d.orders)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Avg Revenue/Day"
          value={formatUGX(avgRevDay)}
          change={5.1}
          iconBg="bg-coffee-100 text-coffee-600 dark:bg-coffee-800 dark:text-coffee-300"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Peak Day"
          value={peakDay.date}
          iconBg="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart metric="revenue" />
        <SalesChart metric="orders" />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top selling items */}
        <div className="lg:col-span-2 dashboard-card">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-5">Top Selling Items</h2>
          <div className="space-y-3">
            {topItems.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-coffee-800 dark:text-cream-200">{item.name}</span>
                  <div className="flex gap-4 text-xs text-coffee-500 dark:text-coffee-400">
                    <span>{item.sold} sold</span>
                    <span className="font-semibold text-coffee-700 dark:text-cream-300">{formatUGX(item.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-coffee-100 dark:bg-coffee-800">
                  <div
                    className="h-2 rounded-full bg-coffee-gradient transition-all duration-700"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="dashboard-card">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-5">Payment Methods</h2>
          <div className="space-y-4">
            {paymentBreakdown.map((p) => (
              <div key={p.method}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-coffee-700 dark:text-cream-300">{p.method}</span>
                  <span className="text-sm font-semibold text-coffee-900 dark:text-cream-100">{p.pct}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-coffee-100 dark:bg-coffee-800">
                  <div className={`h-2.5 rounded-full ${p.color} transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Donut visual */}
          <div className="mt-6 flex justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="20" className="text-coffee-100 dark:text-coffee-800" />
              {paymentBreakdown.reduce((acc, p, i) => {
                const circumference = 2 * Math.PI * 45
                const offset = circumference - (p.pct / 100) * circumference
                const rotation = acc.rotation
                acc.elements.push(
                  <circle
                    key={p.method}
                    cx="60" cy="60" r="45"
                    fill="none"
                    stroke={i === 0 ? '#a85918' : i === 1 ? '#d4994a' : '#e8cfa0'}
                    strokeWidth="20"
                    strokeDasharray={`${(p.pct / 100) * circumference} ${circumference}`}
                    strokeDashoffset={0}
                    transform={`rotate(${rotation - 90} 60 60)`}
                  />
                )
                acc.rotation += (p.pct / 100) * 360
                return acc
              }, { rotation: 0, elements: [] as React.ReactNode[] }).elements}
              <text x="60" y="65" textAnchor="middle" className="fill-coffee-700 dark:fill-cream-200" fontSize="11" fontWeight="600">
                Payments
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
