import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasRole } from '@/lib/types'
import AIAssistantAdmin from '@/components/admin/AIAssistantAdmin'

export const metadata: Metadata = { title: 'AI Assistant Admin' }

export default async function AIAssistantPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!hasRole(profile?.role ?? null, 'staff')) redirect('/dashboard')

  return <AIAssistantAdmin />
}
