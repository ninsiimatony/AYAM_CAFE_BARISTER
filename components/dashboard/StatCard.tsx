interface StatCardProps {
  label: string
  value: string
  change?: number
  icon: React.ReactNode
  iconBg?: string
  sparkline?: number[]
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function StatCard({ label, value, change, icon, iconBg = 'bg-coffee-100 text-coffee-600', sparkline }: StatCardProps) {
  const up = (change ?? 0) >= 0

  return (
    <div className="dashboard-card group">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-1 ${
            up
              ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40'
              : 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/40'
          }`}>
            {up ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100 leading-none">{value}</p>
      <p className="text-sm text-coffee-500 dark:text-coffee-400 mt-1">{label}</p>
      {sparkline && (
        <div className="mt-3 text-coffee-400 dark:text-coffee-500">
          <MiniSparkline data={sparkline} />
        </div>
      )}
    </div>
  )
}
