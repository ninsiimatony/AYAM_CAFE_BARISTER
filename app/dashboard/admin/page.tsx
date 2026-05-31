import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Panel' }

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',    color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  staff:    { label: 'Staff',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  customer: { label: 'Trader',   color: 'text-gray-400',   bg: 'bg-white/[0.06] border-white/10' },
}

function RoleChip({ role }: { role: string }) {
  const cfg = ROLE_BADGE[role] ?? ROLE_BADGE.customer
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Admin Panel requires <strong className="text-gray-300">admin</strong> role.
          Your role: <strong className="text-gray-300">{profile?.role ?? 'unknown'}</strong>
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    )
  }

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const roleCount = {
    admin:    (allUsers ?? []).filter((u: Profile) => u.role === 'admin').length,
    staff:    (allUsers ?? []).filter((u: Profile) => u.role === 'staff').length,
    customer: (allUsers ?? []).filter((u: Profile) => u.role === 'customer').length,
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-1">System</p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Admin Panel</h1>
        </div>
        <RoleChip role="admin" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(roleCount) as [string, number][]).map(([role, count]) => (
          <div key={role} className="rounded-xl bg-[#0d1117] border border-white/[0.07] p-4">
            <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest mb-2">{role}s</p>
            <p className="text-2xl font-bold text-white tabular-nums">{count}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.07] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[13px] font-semibold text-white tracking-wide">All Users</h2>
          <span className="text-[11px] text-gray-600">{allUsers?.length ?? 0} total</span>
        </div>

        {allUsers && allUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-widest">User</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-widest">Role</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-widest hidden sm:table-cell">Tier</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-700 uppercase tracking-widest hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {allUsers.map((u: Profile) => {
                  const initials = (u.full_name ?? u.email ?? '?')[0].toUpperCase()
                  const tier = (u as { subscription_tier?: string }).subscription_tier ?? 'free'
                  const tierColor = tier === 'elite' ? 'text-amber-400' : tier === 'pro' ? 'text-blue-400' : 'text-gray-600'
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/80 to-blue-800/80 text-white text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-200 truncate text-[13px]">{u.full_name ?? '—'}</p>
                            <p className="text-xs text-gray-600 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <RoleChip role={u.role} />
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-bold uppercase tracking-widest ${tierColor}`}>{tier}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-700 text-sm py-10">No users found.</p>
        )}
      </div>

      {/* System info */}
      <div className="rounded-xl bg-[#0d1117] border border-white/[0.07] p-5">
        <h2 className="text-[13px] font-semibold text-white tracking-wide mb-4">System Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Platform',   value: 'TONY ELITE AI v1.0' },
            { label: 'Auth',       value: 'Supabase Auth' },
            { label: 'Framework',  value: 'Next.js 14' },
            { label: 'Database',   value: 'PostgreSQL' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/[0.02] px-4 py-3">
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-medium text-gray-300">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
