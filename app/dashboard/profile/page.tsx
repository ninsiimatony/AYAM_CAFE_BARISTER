'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/types'

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  staff:    { label: 'Staff',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  customer: { label: 'Free',     color: 'text-gray-400',    bg: 'bg-white/[0.06] border-white/10' },
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName]             = useState('')
  const [saving, setSaving]                 = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage]               = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwMessage, setPwMessage]           = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const { error } = await createClient()
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user!.id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await refreshProfile()
      setMessage({ type: 'success', text: 'Profile updated' })
    }
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMessage(null)
    if (newPassword.length < 8) { setPwMessage({ type: 'error', text: 'Password must be at least 8 characters' }); return }
    if (newPassword !== confirmPassword) { setPwMessage({ type: 'error', text: 'Passwords do not match' }); return }
    setChangingPassword(true)
    const { error } = await createClient().auth.updateUser({ password: newPassword })
    if (error) {
      setPwMessage({ type: 'error', text: error.message })
    } else {
      setPwMessage({ type: 'success', text: 'Password changed successfully' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  const role   = (profile?.role ?? 'customer') as UserRole
  const roleCfg = ROLE_LABELS[role] ?? ROLE_LABELS.customer
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-[22px] font-bold text-white tracking-tight">My Profile</h1>
      </div>

      {/* Avatar card */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5 flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-lg font-bold">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{profile?.full_name ?? 'Trader'}</p>
          <p className="text-sm text-gray-600 mb-2">{user?.email}</p>
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${roleCfg.bg} ${roleCfg.color}`}>
            {roleCfg.label}
          </span>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5">
        <h2 className="text-[13px] font-semibold text-white tracking-wide mb-4">Personal Information</h2>

        {message && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg border border-white/[0.08] bg-[#080d18] px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1.5">Email Address</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full rounded-lg border border-white/[0.04] bg-[#080d18] px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed"
            />
            <p className="text-xs text-gray-700 mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1.5">Role</label>
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-[#080d18] px-4 py-2.5">
              <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${roleCfg.bg} ${roleCfg.color}`}>
                {roleCfg.label}
              </span>
              <span className="text-sm text-gray-700">Contact an admin to change your role.</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors flex items-center gap-2"
          >
            {saving && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5">
        <h2 className="text-[13px] font-semibold text-white tracking-wide mb-4">Change Password</h2>

        {pwMessage && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            pwMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {pwMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'New Password',     value: newPassword,      setter: setNewPassword,      ac: 'new-password' },
            { label: 'Confirm Password', value: confirmPassword,   setter: setConfirmPassword,  ac: 'new-password' },
          ].map(({ label, value, setter, ac }) => (
            <div key={label}>
              <label className="text-sm font-medium text-gray-500 block mb-1.5">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete={ac}
                className="w-full rounded-lg border border-white/[0.08] bg-[#080d18] px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors flex items-center gap-2"
          >
            {changingPassword && <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            Update Password
          </button>
        </form>
      </div>

      {/* Account details */}
      <div className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-5">
        <h2 className="text-[13px] font-semibold text-white tracking-wide mb-4">Account Details</h2>
        <div className="space-y-2">
          {[
            { label: 'User ID',         value: user?.id?.slice(0, 8) + '…' },
            { label: 'Member Since',    value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
            { label: 'Email Verified',  value: user?.email_confirmed_at ? 'Verified' : 'Not verified' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-2.5">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-sm font-medium text-gray-400">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
