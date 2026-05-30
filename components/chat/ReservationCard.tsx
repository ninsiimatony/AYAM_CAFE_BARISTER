import type { ReservationMetadata } from '@/lib/types'

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-UG', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function ReservationCard({ metadata }: { metadata: ReservationMetadata }) {
  const ref = metadata.reservation_id.slice(0, 8).toUpperCase()
  const statusLabel = metadata.status.charAt(0).toUpperCase() + metadata.status.slice(1)

  return (
    <div className="mt-2 rounded-2xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-coffee-50 dark:bg-coffee-800 border-b border-coffee-100 dark:border-coffee-700">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <div>
            <p className="text-xs font-bold text-coffee-900 dark:text-cream-100">Reservation Confirmed</p>
            <p className="text-xs text-coffee-400 font-mono">#{ref}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[metadata.status] ?? STATUS_STYLE.pending}`}>
          {statusLabel}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-coffee-400 mb-0.5">Guest</p>
            <p className="text-sm font-semibold text-coffee-900 dark:text-cream-100">{metadata.customer_name}</p>
          </div>
          <div>
            <p className="text-xs text-coffee-400 mb-0.5">Party Size</p>
            <p className="text-sm font-semibold text-coffee-900 dark:text-cream-100">
              {'👤'.repeat(Math.min(metadata.party_size, 4))}
              {metadata.party_size > 4 ? ` ×${metadata.party_size}` : ` (${metadata.party_size})`}
            </p>
          </div>
          <div>
            <p className="text-xs text-coffee-400 mb-0.5">Date</p>
            <p className="text-sm font-medium text-coffee-800 dark:text-cream-200">{formatDate(metadata.date)}</p>
          </div>
          <div>
            <p className="text-xs text-coffee-400 mb-0.5">Time</p>
            <p className="text-sm font-medium text-coffee-800 dark:text-cream-200">{formatTime(metadata.time)}</p>
          </div>
        </div>
        {metadata.notes && (
          <div className="rounded-lg bg-cream-50 dark:bg-coffee-800 px-3 py-2">
            <p className="text-xs text-coffee-500 dark:text-coffee-400">📝 {metadata.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-coffee-50 dark:bg-coffee-800 border-t border-coffee-100 dark:border-coffee-700">
        <p className="text-xs text-coffee-400 text-center">
          Please arrive 5 minutes early · Plot 45 Kampala Road
        </p>
      </div>
    </div>
  )
}
