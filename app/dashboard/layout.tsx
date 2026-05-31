import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import SubscriptionBanner from '@/components/billing/SubscriptionBanner'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co') {
    const { redirect } = await import('next/navigation')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <AuthProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[#0a0f1e]">
        <SubscriptionBanner />
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:flex flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
