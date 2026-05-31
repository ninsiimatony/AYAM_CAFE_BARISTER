'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasRole } from '@/lib/types'
import {
  LayoutDashboard, Activity, ClipboardList, BarChart3,
  SlidersHorizontal, Monitor, Bell, KeyRound, Wallet, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Overview',        Icon: LayoutDashboard,   exact: true },
  { href: '/dashboard/signals',   label: 'Signals',         Icon: Activity,          badge: 'LIVE' },
  { href: '/dashboard/journal',   label: 'Trade Journal',   Icon: ClipboardList },
  { href: '/dashboard/analytics', label: 'Analytics',       Icon: BarChart3 },
  { href: '/dashboard/risk',      label: 'Risk Calculator', Icon: SlidersHorizontal },
  { href: '/dashboard/mt5',       label: 'MT5 Accounts',    Icon: Monitor },
  { href: '/dashboard/telegram',  label: 'Telegram',        Icon: Bell },
  { href: '/dashboard/admin',     label: 'Admin Panel',     Icon: KeyRound,          requiredRole: 'admin' as const },
  { href: '/dashboard/billing',   label: 'Billing',         Icon: Wallet },
  { href: '/dashboard/profile',   label: 'Profile',         Icon: Settings },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileSidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const { role } = useAuth()

  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

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
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[min(272px,82vw)] bg-[#080d18] border-r border-white/[0.07] flex flex-col transition-transform duration-200 ease-out md:hidden ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">TONY ELITE AI</p>
              <p className="text-[10px] text-gray-600 tracking-wider">Institutional Forex</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-white'
                    : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-blue-500" />
                )}
                <item.Icon
                  className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-600'}`}
                  strokeWidth={1.75}
                />
                <span className="text-sm font-medium flex-1 tracking-wide">{item.label}</span>
                {item.badge && (
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="rounded-lg bg-blue-600/5 border border-blue-500/10 px-3 py-2.5">
            <p className="text-[11px] font-bold text-blue-400 tracking-widest">TONY ELITE AI</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Smart Money Concepts · SMC</p>
          </div>
        </div>
      </div>
    </>
  )
}
