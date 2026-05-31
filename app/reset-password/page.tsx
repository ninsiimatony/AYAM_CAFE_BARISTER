'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]               = useState(false)
  const [done, setDone]                     = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]       = useState<Record<string, string>>({})
  const [validSession, setValidSession]     = useState<boolean | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setValidSession(!!session))
  }, [supabase.auth])

  const validate = () => {
    const errors: Record<string, string> = {}
    if (password.length < 8)        errors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  const Logo = () => (
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <span className="text-[11px] font-black text-white">T</span>
      </div>
      <span className="text-sm font-bold text-white tracking-wide">TONY ELITE AI</span>
    </div>
  )

  if (validSession === null) {
    return (
      <div className="min-h-screen bg-[#050709] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-[#050709] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <Logo />
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Link Expired</h2>
          <p className="text-sm text-gray-500 mb-6">This reset link has expired. Please request a new one.</p>
          <Link href="/forgot-password" className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050709] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Logo />

        {done ? (
          <div className="text-center">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Password Updated</h2>
            <p className="text-sm text-gray-500">Redirecting to dashboard…</p>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1">Security</p>
              <h2 className="text-2xl font-bold text-white">Set new password</h2>
              <p className="text-sm text-gray-600 mt-1">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                error={fieldErrors.password}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />
              <AuthInput
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                autoComplete="new-password"
                error={fieldErrors.confirmPassword}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />
              <AuthButton type="submit" loading={loading}>
                Update Password
              </AuthButton>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
