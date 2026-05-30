import type { Metadata } from 'next'
import ChatWindow from '@/components/chat/ChatWindow'
import { getPopularItems } from '@/lib/menu-data'

export const metadata: Metadata = { title: 'AI Assistant' }

const FEATURES = [
  { icon: '☕', label: 'Place Orders',              desc: 'Order any item from the menu' },
  { icon: '📅', label: 'Reservations',              desc: 'Book a table in seconds' },
  { icon: '🍽️', label: 'Menu & Recommendations',   desc: 'Discover what to try' },
  { icon: '❓', label: 'FAQs & Support',            desc: 'Hours, WiFi, policies & more' },
]

export default function SupportPage() {
  const popular = getPopularItems().slice(0, 4)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">AI Assistant</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">
            Barista Bot — orders, reservations, menu recommendations, and support.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chat window — takes 2/3 width on XL */}
        <div className="xl:col-span-2 h-[calc(100vh-16rem)] min-h-[500px]">
          <ChatWindow />
        </div>

        {/* Right info panel */}
        <div className="space-y-4">
          {/* Capabilities */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-3 text-sm">What I can do</h2>
            <div className="space-y-2">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-start gap-3 rounded-xl bg-cream-50 dark:bg-coffee-800 p-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-coffee-900 dark:text-cream-100">{f.label}</p>
                    <p className="text-xs text-coffee-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular items */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-3 text-sm">⭐ Popular Today</h2>
            <div className="space-y-2">
              {popular.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-cream-50 dark:bg-coffee-800 px-3 py-2">
                  <span className="text-sm text-coffee-800 dark:text-cream-200">{item.name}</span>
                  <span className="text-xs font-semibold text-coffee-600 dark:text-coffee-400">
                    UGX {item.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="dashboard-card">
            <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-3 text-sm">🕐 Opening Hours</h2>
            <div className="space-y-1.5">
              {[
                { days: 'Mon – Fri', hours: '7:00 AM – 10:00 PM' },
                { days: 'Saturday',  hours: '8:00 AM – 11:00 PM' },
                { days: 'Sunday',    hours: '9:00 AM – 8:00 PM' },
              ].map((r) => (
                <div key={r.days} className="flex justify-between text-xs text-coffee-600 dark:text-coffee-400">
                  <span>{r.days}</span>
                  <span className="font-medium text-coffee-800 dark:text-cream-200">{r.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
