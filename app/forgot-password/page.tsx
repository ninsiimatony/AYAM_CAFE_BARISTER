'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050709] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">T</span>
          </div>
          <span className="text-sm font-bold text-white tracking-wide">TONY ELITE AI</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-1">Reset link sent to</p>
            <p className="text-sm font-semibold text-gray-300 mb-6">{email}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setSent(false)} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
                Try a different email
              </button>
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Account recovery</p>
              <h2 className="text-2xl font-bold text-white">Forgot password?</h2>
              <p className="text-sm text-gray-600 mt-1">Enter your email and we&apos;ll send a reset link.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <AuthButton type="submit" loading={loading}>
                Send Reset Link
              </AuthButton>
            </form>

            <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
