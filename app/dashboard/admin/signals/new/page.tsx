import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import NewSignalForm    from './NewSignalForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Signal — TONY ELITE AI Admin' }

export default async function NewSignalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'staff'].includes(profile?.role ?? '')) redirect('/dashboard/signals')

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Signal</h1>
        <p className="text-sm text-gray-400 mt-0.5">Create an institutional SMC signal</p>
      </div>
      <NewSignalForm />
    </div>
  )
}
