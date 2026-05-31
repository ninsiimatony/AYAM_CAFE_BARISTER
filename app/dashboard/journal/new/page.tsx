import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import JournalEditor    from '@/components/journal/JournalEditor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Journal Entry — TONY ELITE AI' }

export default async function NewJournalPage() {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Journal Entry</h1>
        <p className="text-sm text-gray-400 mt-0.5">Document this trade and your mental state</p>
      </div>
      <JournalEditor />
    </div>
  )
  } catch (e) {
    if (isRedirectError(e)) throw e
    redirect('/login')
  }
}
