'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasRole } from '@/lib/types'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Overview',         icon: '📊', exact: true },
  { href: '/dashboard/signals',   label: 'Signals',          icon: '📡', badge: 'LIVE' },
  { href: '/dashboard/journal',   label: 'Trade Journal',    icon: '📓' },
  { href: '/dashboard/analytics', label: 'Analytics',        icon: '📈' },
  { href: '/dashboard/risk',      label: 'Risk Calculator',  icon: '🎯' },
  { href: '/dashboard/mt5',       label: 'MT5 Accounts',     icon: '⚡' },
  { href: '/dashboard/telegram',  label: 'Telegram',         icon: '✈' },
  { href: '/dashboard/admin',     label: 'Admin Panel',      icon: '🛡️', requiredRole: 'admin' as const },
  { href: '/dashboard/billing',   label: 'Billing',          icon: '💳' },
  { href: '/dashboard/profile',   label: 'Profile',          icon: '👤' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const { role } = useAuth()

  // Close on route change
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredRole) return true
    return hasRole(role, item.requiredRole)
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-200 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200 ease-out md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">TONY ELITE AI</p>
              <p className="text-[10px] text-gray-500">Institutional Forex</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <span className="text-lg w-6 text-center flex-shrink-0">{item.icon}</span>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-800/30 p-3">
            <p className="text-xs font-bold text-white">TONY ELITE AI</p>
            <p className="text-xs text-gray-400 mt-0.5">Institutional Forex · SMC</p>
          </div>
        </div>
      </div>
    </>
  )
}
