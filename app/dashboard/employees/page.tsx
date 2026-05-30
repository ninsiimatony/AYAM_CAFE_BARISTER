import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/types'
import DataTable from '@/components/dashboard/DataTable'
import { mockEmployees } from '@/lib/dashboard-data'
import type { Employee } from '@/lib/dashboard-data'

export const metadata: Metadata = { title: 'Employees' }

const statusStyles: Record<Employee['status'], string> = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  'On Leave': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  'Off Duty': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const shiftColors: Record<Employee['shift'], string> = {
  Morning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Afternoon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Evening: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const roleIcons: Record<Employee['role'], string> = {
  Manager: '👔', Supervisor: '📋', Barista: '☕', Cashier: '💳',
}

const columns = [
  {
    key: 'name' as keyof Employee,
    label: 'Employee',
    sortable: true,
    render: (_: unknown, row: Employee) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coffee-gradient text-white text-sm font-semibold">
          {row.name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div>
          <p className="font-medium text-coffee-900 dark:text-cream-100">{row.name}</p>
          <p className="text-xs text-coffee-400">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'role' as keyof Employee,
    label: 'Role',
    render: (v: unknown) => (
      <span className="text-sm text-coffee-700 dark:text-cream-300">
        {roleIcons[v as Employee['role']]} {v as string}
      </span>
    ),
  },
  {
    key: 'shift' as keyof Employee,
    label: 'Shift',
    render: (v: unknown) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${shiftColors[v as Employee['shift']]}`}>{v as string}</span>
    ),
  },
  {
    key: 'status' as keyof Employee,
    label: 'Status',
    render: (v: unknown) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[v as Employee['status']]}`}>{v as string}</span>
    ),
  },
  {
    key: 'ordersToday' as keyof Employee,
    label: "Today's Orders",
    sortable: true,
    render: (v: unknown) => <span className="font-semibold text-coffee-900 dark:text-cream-100">{v as number}</span>,
  },
  {
    key: 'rating' as keyof Employee,
    label: 'Rating',
    sortable: true,
    render: (v: unknown) => (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">★</span>
        <span className="text-sm font-semibold text-coffee-900 dark:text-cream-100">{v as number}</span>
      </div>
    ),
  },
  {
    key: 'hireDate' as keyof Employee,
    label: 'Hire Date',
    sortable: true,
    render: (v: unknown) => <span className="text-sm text-coffee-400">{v as string}</span>,
  },
]

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!hasRole(profile?.role ?? null, 'staff')) redirect('/dashboard')

  const activeCount = mockEmployees.filter((e) => e.status === 'Active').length
  const shifts = {
    Morning: mockEmployees.filter((e) => e.shift === 'Morning' && e.status === 'Active').length,
    Afternoon: mockEmployees.filter((e) => e.shift === 'Afternoon' && e.status === 'Active').length,
    Evening: mockEmployees.filter((e) => e.shift === 'Evening' && e.status === 'Active').length,
  }
  const avgRating = (mockEmployees.reduce((s, e) => s + e.rating, 0) / mockEmployees.length).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-900 dark:text-cream-100">Employees</h1>
          <p className="text-coffee-500 dark:text-coffee-400 mt-1">Team management, shifts, and performance</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-coffee-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-coffee hover:brightness-110 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Shift overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-2xl">👥</span>
          <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{activeCount}</p>
          <p className="text-xs text-coffee-500 dark:text-coffee-400">Active Staff</p>
        </div>
        {Object.entries(shifts).map(([shift, count]) => (
          <div key={shift} className="stat-card">
            <span className="text-2xl">{shift === 'Morning' ? '🌅' : shift === 'Afternoon' ? '☀️' : '🌙'}</span>
            <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{count}</p>
            <p className="text-xs text-coffee-500 dark:text-coffee-400">{shift} Shift</p>
          </div>
        ))}
        <div className="stat-card">
          <span className="text-2xl">⭐</span>
          <p className="text-2xl font-bold text-coffee-900 dark:text-cream-100 mt-1">{avgRating}</p>
          <p className="text-xs text-coffee-500 dark:text-coffee-400">Avg Rating</p>
        </div>
      </div>

      {/* Shift schedule visual */}
      <div className="dashboard-card">
        <h2 className="font-semibold text-coffee-900 dark:text-cream-100 mb-5">Today&apos;s Shift Schedule</h2>
        <div className="space-y-3">
          {(['Morning', 'Afternoon', 'Evening'] as const).map((shift) => {
            const staff = mockEmployees.filter((e) => e.shift === shift)
            return (
              <div key={shift} className={`rounded-xl p-4 ${
                shift === 'Morning' ? 'bg-orange-50 dark:bg-orange-900/20' :
                shift === 'Afternoon' ? 'bg-blue-50 dark:bg-blue-900/20' :
                'bg-purple-50 dark:bg-purple-900/20'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{shift === 'Morning' ? '🌅' : shift === 'Afternoon' ? '☀️' : '🌙'}</span>
                    <span className="font-semibold text-coffee-800 dark:text-cream-200">{shift}</span>
                    <span className="text-xs text-coffee-500 dark:text-coffee-400">
                      {shift === 'Morning' ? '7:00 – 12:00' : shift === 'Afternoon' ? '12:00 – 18:00' : '18:00 – 23:00'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-coffee-600 dark:text-coffee-400">{staff.length} staff</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {staff.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-1.5 rounded-full bg-white dark:bg-coffee-800 border border-coffee-100 dark:border-coffee-700 px-3 py-1.5">
                      <span className={`h-2 w-2 rounded-full ${emp.status === 'Active' ? 'bg-green-500' : emp.status === 'On Leave' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                      <span className="text-xs font-medium text-coffee-800 dark:text-cream-200">{emp.name.split(' ')[0]}</span>
                      <span className="text-xs text-coffee-400">{roleIcons[emp.role]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Employee table */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-coffee-900 dark:text-cream-100">All Employees</h2>
          <span className="text-xs text-coffee-400">{mockEmployees.length} total</span>
        </div>
        <DataTable
          data={mockEmployees as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          searchKeys={['name', 'email', 'role'] as never[]}
          pageSize={6}
        />
      </div>
    </div>
  )
}
