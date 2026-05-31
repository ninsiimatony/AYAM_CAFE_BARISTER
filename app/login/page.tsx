'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'

const FEATURES = [
  'Real-time SMC signals — BOS, CHOCH, Order Blocks',
  'Institutional-grade confluence scoring',
  'Telegram VIP alerts for Pro & Elite',
  'MT5 auto-execution bridge',
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000)
      )
      const authCall = createClient().auth.signInWithPassword({ email, password })
      const { error } = await Promise.race([authCall, timeout]) as Awaited<typeof authCall>
      if (error) { setError(error.message); setLoading(false); return }
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (!msg || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        setError('Cannot connect to the server. Check your internet connection and try again.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold text-white">Sign in</h2>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          }
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
            Forgot password?
          </Link>
        </div>

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>
      </form>

      <p className="mt-6 text-center text-sm text-gray-700">
        No account?{' '}
        <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Create one free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 border-r border-white/[0.05] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-2.5 relative">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">T</span>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">TONY ELITE AI</span>
        </div>

        <div className="relative">
          <p className="text-[11px] font-semibold text-blue-400/70 uppercase tracking-widest mb-3">Institutional Forex · SMC</p>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Trade with<br />institutional edge
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xs">
            AI-powered Smart Money Concepts signals, risk management, and automated execution.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm text-gray-500">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-gray-800 relative">
          © {new Date().getFullYear()} Tony Elite AI. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">T</span>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">TONY ELITE AI</span>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
