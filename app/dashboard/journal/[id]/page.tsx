import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { JournalEntry } from '@/lib/types'
import { SMC_PATTERN_LABELS } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Journal Entry — TONY ELITE AI` }
}

const EMOTION_LABEL: Record<string, string> = {
  disciplined:   '🎯 Disciplined',
  confident:     '💪 Confident',
  neutral:       '😐 Neutral',
  impatient:     '⏩ Impatient',
  fearful:       '😰 Fearful',
  greedy:        '💰 Greedy',
  fomo:          '🚀 FOMO',
  revenge:       '😤 Revenge',
  overconfident: '😎 Overconfident',
}

const RATING_COLOR = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400']
const STARS = (r: string) => '★'.repeat(parseInt(r)) + '☆'.repeat(5 - parseInt(r))

export default async function JournalDetailPage({ params }: Props) {
  try {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!entry) notFound()

  const e = entry as JournalEntry
  const dirColor = e.direction === 'buy' ? 'text-emerald-400' : 'text-red-400'
  const dirBg    = e.direction === 'buy' ? 'bg-emerald-900/30' : 'bg-red-900/30'

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/journal" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Journal
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-lg px-2.5 py-1.5 text-sm font-bold uppercase ${dirColor} ${dirBg}`}>{e.direction}</span>
          <h1 className="text-2xl font-bold text-white">{e.pair}</h1>
          {e.timeframe_used && <span className="text-sm text-gray-500">{e.timeframe_used}</span>}
        </div>
        <div className="flex items-center gap-2">
          {e.pips_result != null && (
            <span className={`text-lg font-bold ${e.pips_result >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {e.pips_result > 0 ? '+' : ''}{e.pips_result.toFixed(1)} pips
            </span>
          )}
          {e.is_winner != null && (
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${e.is_winner ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
              {e.is_winner ? 'WIN' : 'LOSS'}
            </span>
          )}
        </div>
      </div>

      {/* Trade details */}
      <Section title="Trade Details">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {e.session_traded && <InfoBox label="Session" value={e.session_traded.replace('_', ' ')} />}
          {e.bias_used && <InfoBox label="Bias" value={e.bias_used} />}
          {e.confluence_met != null && <InfoBox label="Confluence" value={e.confluence_met ? 'Met ✓' : 'Not met ✗'} />}
          {e.followed_plan != null && <InfoBox label="Plan" value={e.followed_plan ? 'Followed ✓' : 'Broke plan ✗'} warn={!e.followed_plan} />}
          {e.revenge_trade && <InfoBox label="Revenge Trade" value="Yes ⚠" warn />}
          {e.overtraded && <InfoBox label="Overtraded" value="Yes ⚠" warn />}
        </div>
      </Section>

      {/* SMC patterns */}
      {e.setup_type && e.setup_type.length > 0 && (
        <Section title="SMC Patterns Used">
          <div className="flex flex-wrap gap-2">
            {e.setup_type.map((p) => (
              <span key={p} className="rounded-md bg-purple-900/30 border border-purple-800/40 px-2.5 py-1 text-xs font-medium text-purple-300">
                {SMC_PATTERN_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Analysis */}
      <Section title="Trade Analysis">
        <div className="space-y-4">
          {e.entry_reason && <AnalysisBlock label="Why I took this trade" text={e.entry_reason} />}
          {e.exit_reason && <AnalysisBlock label="Exit reason" text={e.exit_reason} />}
          <div className="grid grid-cols-2 gap-4">
            {e.what_went_right && <AnalysisBlock label="✓ What went right" text={e.what_went_right} good />}
            {e.what_went_wrong && <AnalysisBlock label="✗ What went wrong" text={e.what_went_wrong} bad />}
          </div>
          {e.lessons && <AnalysisBlock label="Lessons learned" text={e.lessons} />}
        </div>
      </Section>

      {/* Psychology */}
      <Section title="Psychology">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <InfoBox label="Before trade" value={EMOTION_LABEL[e.emotion_before] ?? e.emotion_before} />
          <InfoBox label="During trade" value={EMOTION_LABEL[e.emotion_during] ?? e.emotion_during} />
          <InfoBox label="After trade"  value={EMOTION_LABEL[e.emotion_after]  ?? e.emotion_after} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="Execution" value={`${STARS(e.execution_rating)} (${e.execution_rating}/5)`} className={RATING_COLOR[parseInt(e.execution_rating)]} />
          <InfoBox label="Management" value={`${STARS(e.management_rating)} (${e.management_rating}/5)`} className={RATING_COLOR[parseInt(e.management_rating)]} />
        </div>
      </Section>

      {/* Tags */}
      {e.tags && e.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {e.tags.map((t) => (
            <span key={t} className="rounded-full bg-[#111d2e] px-3 py-1 text-xs text-gray-400">#{t}</span>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600">
        Logged {new Date(e.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    </div>
  )
  } catch (e) {
    if (isRedirectError(e)) throw e
    redirect('/login')
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#0d1520] border border-white/[0.07] p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )
}

function InfoBox({ label, value, warn, good, className }: { label: string; value: string; warn?: boolean; good?: boolean; className?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.05] px-3 py-2.5">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium capitalize ${warn ? 'text-amber-400' : good ? 'text-emerald-400' : className ?? 'text-gray-200'}`}>{value}</p>
    </div>
  )
}

function AnalysisBlock({ label, text, good, bad }: { label: string; text: string; good?: boolean; bad?: boolean }) {
  return (
    <div>
      <p className={`text-xs font-medium mb-1.5 ${good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-gray-400'}`}>{label}</p>
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}
