import type { OrderMetadata } from '@/lib/types'

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  ready:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  delivered: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export default function OrderCard({ metadata }: { metadata: OrderMetadata }) {
  const ref = metadata.order_id.slice(0, 8).toUpperCase()
  const statusLabel = metadata.status.charAt(0).toUpperCase() + metadata.status.slice(1)

  return (
    <div className="mt-2 rounded-2xl border border-coffee-100 dark:border-coffee-700 bg-white dark:bg-coffee-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-coffee-50 dark:bg-coffee-800 border-b border-coffee-100 dark:border-coffee-700">
        <div className="flex items-center gap-2">
          <span className="text-base">☕</span>
          <div>
            <p className="text-xs font-bold text-coffee-900 dark:text-cream-100">Order Placed</p>
            <p className="text-xs text-coffee-400 font-mono">#{ref}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[metadata.status] ?? STATUS_STYLE.pending}`}>
          {statusLabel}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1.5">
        {metadata.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-coffee-700 dark:text-cream-200">
              <span className="font-semibold text-coffee-900 dark:text-cream-100">{item.quantity}×</span>{' '}
              {item.name}
              {item.notes && <span className="text-xs text-coffee-400 ml-1">({item.notes})</span>}
            </span>
            <span className="text-coffee-600 dark:text-coffee-400 font-medium">
              UGX {item.subtotal.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-coffee-50 dark:bg-coffee-800 border-t border-coffee-100 dark:border-coffee-700">
        <span className="text-xs text-coffee-400">Est. 10–15 min</span>
        <span className="text-sm font-bold text-coffee-900 dark:text-cream-100">
          Total: UGX {metadata.total.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
