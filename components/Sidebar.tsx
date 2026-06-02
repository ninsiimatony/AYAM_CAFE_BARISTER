'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { hasRole } from '@/lib/types'
import {
  LayoutDashboard, Activity, ClipboardList, BarChart3,
  SlidersHorizontal, Monitor, Bell, KeyRound, Wallet, Settings, Film,
} from 'lucide-react'

interface NavItem {
  href:          string
  label:         string
  description:   string
  icon:          React.ElementType
  requiredRole?: 'admin' | 'staff'
  badge?:        string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',             label: 'Overview',        description: 'Account summary',     icon: LayoutDashboard },
  { href: '/dashboard/signals',     label: 'Signals',         description: 'Live SMC signals',    icon: Activity,          badge: 'LIVE' },
  { href: '/dashboard/journal',     label: 'Trade Journal',   description: 'Log & review trades', icon: ClipboardList },
  { href: '/dashboard/analytics',   label: 'Analytics',       description: 'Performance metrics', icon: BarChart3 },
  { href: '/dashboard/risk',        label: 'Risk Calculator', description: 'Position sizing',     icon: SlidersHorizontal },
  { href: '/dashboard/mt5',         label: 'MT5 Accounts',    description: 'Connect your broker', icon: Monitor },
  { href: '/dashboard/telegram',    label: 'Telegram',        description: 'VIP alert channel',   icon: Bell },
  { href: '/dashboard/ape-movie',   label: 'Ape Movie',       description: '🦍 To the moon!',     icon: Film,              badge: 'NEW' },
  { href: '/dashboard/admin',       label: 'Admin Panel',     description: 'Manage platform',     icon: KeyRound, requiredRole: 'admin' },
  { href: '/dashboard/billing',     label: 'Billing',         description: 'Plan & subscription', icon: Wallet },
  { href: '/dashboard/profile',     label: 'Profile',         description: 'Account settings',    icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { role } = useAuth()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredRole) return true
    return hasRole(role, item.requiredRole)
  })

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#080d18]">
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150
                ${isActive
                  ? 'bg-blue-600/10 text-white'
                  : 'text-gray-500 hover:bg-white/[0.04] hover:text-gray-300'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-blue-500" />
              )}
              <Icon
                className={`h-[17px] w-[17px] flex-shrink-0 transition-colors ${
                  isActive ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'
                }`}
                strokeWidth={1.75}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium leading-none truncate ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </p>
                <p className={`text-[11px] leading-none mt-[3px] truncate ${isActive ? 'text-blue-400/60' : 'text-gray-700'}`}>
                  {item.description}
                </p>
              </div>
              {item.badge && (
                <span className="shrink-0 rounded-sm bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-white">T</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-300 tracking-wider">TONY ELITE AI</p>
            <p className="text-[10px] text-gray-700 mt-0.5">Institutional · SMC</p>
          </div>
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        </div>
      </div>
    </aside>
  )
}
