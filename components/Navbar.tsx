'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import RoleBadge from './RoleBadge'
import ThemeToggle from './dashboard/ThemeToggle'

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-40 border-b border-coffee-100 dark:border-coffee-800 bg-white/95 dark:bg-coffee-900/95 backdrop-blur-sm shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coffee-gradient shadow-coffee">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-cream-100"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2 21v-2h2V7c0-.55.196-1.021.588-1.413A1.925 1.925 0 0 1 6 5h12c.55 0 1.021.196 1.413.587C19.804 5.98 20 6.45 20 7v2h2v4h-2v6h2v2H2Zm4-2h10v-6H6v6Zm0-8h10V7H6v4Zm12 2h1v-2h-1v2Z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-coffee-900 leading-none">Ayam Café</p>
            <p className="text-xs text-coffee-400 leading-none mt-0.5">Barister</p>
          </div>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {role && <RoleBadge role={role} size="sm" />}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-coffee-50 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coffee-gradient text-white text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-coffee-900 leading-none">
                  {profile?.full_name ?? 'User'}
                </p>
                <p className="text-xs text-coffee-400 leading-none mt-0.5 truncate max-w-[140px]">
                  {user?.email}
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-coffee-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-coffee-100 bg-white shadow-coffee-lg py-2 z-50 animate-fade-in">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-coffee-700 hover:bg-coffee-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-coffee-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  My Profile
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-coffee-700 hover:bg-coffee-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-coffee-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Dashboard
                </Link>
                <div className="my-1 border-t border-coffee-100" />
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}
    </header>
  )
}
