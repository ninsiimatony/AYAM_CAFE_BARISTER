import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleBadge from '@/components/RoleBadge'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Panel' }

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mb-2">Access Restricted</h1>
        <p className="text-coffee-500 dark:text-coffee-400 mb-6 text-center max-w-sm">
          The Admin Panel requires <strong>admin</strong> role access.
          Your current role is <strong>{profile?.role ?? 'unknown'}</strong>.
        </p>
        {profile?.role && <RoleBadge role={profile.role} />}
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-coffee-gradient px-6 py-3 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all"
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

  const usersByRole = {
    admin: (allUsers ?? []).filter((u: Profile) => u.role === 'admin'),
    staff: (allUsers ?? []).filter((u: Profile) => u.role === 'staff'),
    customer: (allUsers ?? []).filter((u: Profile) => u.role === 'customer'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Admin Panel</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">System administration and user management</p>
        </div>
        <RoleBadge role="admin" />
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(usersByRole).map(([role, users]) => (
          <div key={role} className="stat-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-coffee-500 dark:text-coffee-400 capitalize">{role}s</p>
              <RoleBadge role={role as 'admin' | 'staff' | 'customer'} size="sm" />
            </div>
            <p className="text-3xl font-bold text-coffee-900 dark:text-cream-100 mt-2">{users.length}</p>
            <p className="text-xs text-coffee-400 dark:text-coffee-500 mt-1">registered users</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Users</h2>
          <span className="text-xs text-coffee-400 dark:text-coffee-500">{allUsers?.length ?? 0} total</span>
        </div>

        {allUsers && allUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coffee-100 dark:border-coffee-700">
                  <th className="pb-3 text-left font-medium text-coffee-500 dark:text-coffee-400">User</th>
                  <th className="pb-3 text-left font-medium text-coffee-500 dark:text-coffee-400">Role</th>
                  <th className="pb-3 text-left font-medium text-coffee-500 dark:text-coffee-400 hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coffee-50 dark:divide-coffee-800">
                {allUsers.map((u: Profile) => (
                  <tr key={u.id} className="hover:bg-cream-50 dark:hover:bg-coffee-800/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coffee-gradient text-white text-xs font-semibold flex-shrink-0">
                          {(u.full_name ?? u.email)?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-coffee-900 dark:text-cream-100 truncate">{u.full_name ?? '—'}</p>
                          <p className="text-xs text-coffee-400 dark:text-coffee-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={u.role} size="sm" />
                    </td>
                    <td className="py-3 text-coffee-400 dark:text-coffee-500 hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-coffee-400 dark:text-coffee-500 py-8">No users found.</p>
        )}
      </div>

      {/* System Info */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">System Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Application', value: 'Ayam Café Barister v1.0' },
            { label: 'Auth Provider', value: 'Supabase Auth' },
            { label: 'Framework', value: 'Next.js 14 (App Router)' },
            { label: 'Database', value: 'Supabase PostgreSQL' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-cream-50 dark:bg-coffee-800 px-4 py-3">
              <p className="text-xs font-medium text-coffee-400 dark:text-coffee-500 mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-coffee-800 dark:text-cream-200">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
