'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import type { UserRole } from '@/lib/types'

const ROLES: { value: UserRole; label: string; desc: string; icon: string }[] = [
  { value: 'customer', label: 'Customer', desc: 'Order & track your drinks', icon: '☕' },
  { value: 'staff', label: 'Staff', desc: 'Manage orders & service', icon: '🧑‍🍳' },
  { value: 'admin', label: 'Admin', desc: 'Full system access', icon: '⚙️' },
]

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const supabase = createClient()

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Full name is required'
    if (!email) errors.email = 'Email is required'
    if (password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream-gradient flex items-center justify-center p-6">
        <div className="auth-card text-center animate-slide-up">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-coffee-900 mb-3">Check your email!</h2>
          <p className="text-coffee-500 mb-6">
            We&apos;ve sent a confirmation link to <strong className="text-coffee-700">{email}</strong>.
            Please verify your email to complete signup.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-coffee-gradient px-6 py-3 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-gradient flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-coffee-gradient shadow-coffee">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-100" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21v-2h2V7c0-.55.196-1.021.588-1.413A1.925 1.925 0 0 1 6 5h12c.55 0 1.021.196 1.413.587C19.804 5.98 20 6.45 20 7v2h2v4h-2v6h2v2H2Zm4-2h10v-6H6v6Zm0-8h10V7H6v4Zm12 2h1v-2h[...]
            </svg>
          </div>
          <span className="font-bold text-coffee-900 text-lg">Ayam Café Barister</span>
        </div>

        <div className="auth-card">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-coffee-900">Create your account</h2>
            <p className="text-coffee-500 mt-1.5">Join us and start managing your café</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L[...]
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <AuthInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Barista"
              required
              autoComplete="name"
              error={fieldErrors.fullName}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />

            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              error={fieldErrors.email}
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
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
            />

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-coffee-800 block mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`
                      flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all duration-200
                      ${role === r.value
                        ? 'border-coffee-500 bg-coffee-50 text-coffee-800'
                        : 'border-coffee-100 bg-white text-coffee-500 hover:border-coffee-300 hover:bg-coffee-50'
                      }
                    `}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-xs font-semibold">{r.label}</span>
                    <span className="text-xs leading-tight opacity-75 hidden sm:block">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <AuthButton type="submit" loading={loading} className="mt-2">
              Create Account
            </AuthButton>
          </form>

          <p className="mt-6 text-center text-sm text-coffee-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-coffee-700 hover:text-coffee-900 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
