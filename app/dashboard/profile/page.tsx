'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import RoleBadge from '@/components/RoleBadge'
import AuthInput from '@/components/auth/AuthInput'
import AuthButton from '@/components/auth/AuthButton'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/types'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user!.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMessage(null)

    if (newPassword.length < 8) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPwMessage({ type: 'error', text: error.message })
    } else {
      setPwMessage({ type: 'success', text: 'Password changed successfully!' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  const role = (profile?.role ?? 'customer') as UserRole
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">My Profile</h1>
        <p className="text-coffee-500 dark:text-coffee-400 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Avatar & Role Card */}
      <div className="dashboard-card flex items-center gap-5">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-coffee-gradient text-white text-2xl font-bold shadow-coffee">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-coffee-900 dark:text-cream-100">{profile?.full_name ?? 'User'}</h2>
          <p className="text-coffee-500 dark:text-coffee-400 text-sm mb-2">{user?.email}</p>
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Update Profile */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-5">Personal Information</h2>

        {message && (
          <div className={`mb-5 flex items-center gap-3 rounded-xl border p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {message.type === 'success' ? '✓' : '✕'} {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <AuthInput
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            }
          />
          <div>
            <label className="text-sm font-medium text-coffee-800 dark:text-cream-200 block mb-1.5">Email Address</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-xl border border-coffee-100 dark:border-coffee-700 bg-coffee-50 dark:bg-coffee-800 px-4 py-3 text-coffee-500 dark:text-coffee-400 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-coffee-400 dark:text-coffee-500 mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-coffee-800 dark:text-cream-200 block mb-1.5">Role</label>
            <div className="flex items-center gap-3 rounded-xl border border-coffee-100 dark:border-coffee-700 bg-coffee-50 dark:bg-coffee-800 px-4 py-3">
              <RoleBadge role={role} size="sm" />
              <span className="text-sm text-coffee-500 dark:text-coffee-400">Contact an admin to change your role.</span>
            </div>
          </div>
          <AuthButton type="submit" loading={saving} fullWidth={false} className="px-8">
            Save Changes
          </AuthButton>
        </form>
      </div>

      {/* Change Password */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-5">Change Password</h2>

        {pwMessage && (
          <div className={`mb-5 flex items-center gap-3 rounded-xl border p-4 text-sm ${
            pwMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {pwMessage.type === 'success' ? '✓' : '✕'} {pwMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <AuthInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <AuthInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            }
          />
          <AuthButton type="submit" loading={changingPassword} fullWidth={false} className="px-8">
            Update Password
          </AuthButton>
        </form>
      </div>

      {/* Account Info */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Account Details</h2>
        <div className="space-y-3">
          {[
            { label: 'User ID', value: user?.id?.slice(0, 8) + '…' },
            { label: 'Account Created', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
            { label: 'Last Updated', value: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : '—' },
            { label: 'Email Verified', value: user?.email_confirmed_at ? '✓ Verified' : '✗ Not verified' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-cream-50 dark:bg-coffee-800 px-4 py-3">
              <p className="text-sm text-coffee-500 dark:text-coffee-400">{item.label}</p>
              <p className="text-sm font-medium text-coffee-800 dark:text-cream-200">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
