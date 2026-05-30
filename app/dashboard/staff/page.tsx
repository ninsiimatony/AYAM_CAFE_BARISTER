import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoleBadge from '@/components/RoleBadge'
import { hasRole } from '@/lib/types'
import type { Profile } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Management' }

const shifts = [
  { name: 'Morning', time: '6:00 AM – 12:00 PM', staff: 3, icon: '🌅' },
  { name: 'Afternoon', time: '12:00 PM – 6:00 PM', staff: 2, icon: '☀️' },
  { name: 'Evening', time: '6:00 PM – 11:00 PM', staff: 1, icon: '🌙' },
]

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'customer'

  if (!hasRole(userRole, 'staff')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mb-2">Access Restricted</h1>
        <p className="text-coffee-500 dark:text-coffee-400 mb-6 text-center max-w-sm">
          Staff management requires <strong>staff</strong> or <strong>admin</strong> role.
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

  const { data: staffMembers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'staff'])
    .order('role', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Staff Management</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Manage your barista team and shifts</p>
        </div>
        <RoleBadge role={userRole as 'admin' | 'staff' | 'customer'} />
      </div>

      {/* Shift Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div key={shift.name} className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{shift.icon}</span>
              <div>
                <p className="font-semibold text-coffee-900 dark:text-cream-100">{shift.name} Shift</p>
                <p className="text-xs text-coffee-400 dark:text-coffee-500">{shift.time}</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-coffee-900 dark:text-cream-100">{shift.staff}</p>
            <p className="text-xs text-coffee-400 dark:text-coffee-500 mt-1">staff members</p>
          </div>
        ))}
      </div>

      {/* Staff List */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">Team Members</h2>
          <span className="text-xs text-coffee-400 dark:text-coffee-500">{staffMembers?.length ?? 0} members</span>
        </div>

        {staffMembers && staffMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffMembers.map((member: Profile) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-coffee-100 dark:border-coffee-700 p-4 hover:shadow-coffee transition-shadow dark:bg-coffee-800/50">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-coffee-gradient text-white font-semibold text-lg">
                  {(member.full_name ?? member.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-coffee-900 dark:text-cream-100 truncate">{member.full_name ?? 'Unnamed'}</p>
                  <p className="text-xs text-coffee-400 dark:text-coffee-500 truncate mb-1.5">{member.email}</p>
                  <RoleBadge role={member.role} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-coffee-500 dark:text-coffee-400">No staff members found.</p>
            <p className="text-sm text-coffee-400 dark:text-coffee-500 mt-1">Staff will appear here once they sign up.</p>
          </div>
        )}
      </div>

      {/* Performance placeholder */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Orders Served Today', value: '142', icon: '☕' },
            { label: 'Avg. Service Time', value: '4.2 min', icon: '⏱' },
            { label: 'Customer Satisfaction', value: '4.8★', icon: '⭐' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl bg-cream-50 dark:bg-coffee-800 p-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-xl font-bold text-coffee-900 dark:text-cream-100">{item.value}</p>
                <p className="text-xs text-coffee-400 dark:text-coffee-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
