import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import Link             from 'next/link'
import JournalFeed      from '@/components/journal/JournalFeed'
import type { Metadata } from 'next'
import type { JournalEntry } from '@/lib/types'

export const metadata: Metadata = { title: 'Trade Journal — TONY ELITE AI' }
export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const totalEntries = entries?.length ?? 0
  const wins         = entries?.filter((e) => e.is_winner === true).length ?? 0
  const losses       = entries?.filter((e) => e.is_winner === false).length ?? 0
  const avgPips      = totalEntries > 0
    ? (entries?.reduce((acc, e) => acc + (Number(e.pips_result) || 0), 0) ?? 0) / totalEntries
    : 0

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">Reflect, review, and refine your trading edge</p>
        </div>
        <Link
          href="/dashboard/journal/new"
          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          + New Entry
        </Link>
      </div>

      {/* Summary strip */}
      {totalEntries > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Entries',    value: totalEntries.toString(),                                color: 'text-white' },
            { label: 'Wins',       value: wins.toString(),                                        color: 'text-emerald-400' },
            { label: 'Losses',     value: losses.toString(),                                      color: 'text-red-400' },
            { label: 'Avg Pips',   value: `${avgPips > 0 ? '+' : ''}${avgPips.toFixed(1)}`,      color: avgPips >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-[#0d1520] border border-white/[0.07] p-4">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <JournalFeed entries={(entries ?? []) as JournalEntry[]} />
    </div>
  )
  } catch (e) {
    if (isRedirectError(e)) throw e
    redirect('/login')
  }
}
