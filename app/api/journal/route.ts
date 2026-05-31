import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = [
    'pair', 'direction', 'pips_result', 'is_winner',
    'setup_type', 'bias_used', 'timeframe_used', 'session_traded',
    'confluence_met', 'entry_reason', 'exit_reason',
    'what_went_right', 'what_went_wrong', 'lessons', 'improvements',
    'emotion_before', 'emotion_during', 'emotion_after',
    'followed_plan', 'revenge_trade', 'overtraded',
    'execution_rating', 'management_rating',
    'screenshots', 'tags', 'trade_id', 'signal_id',
  ]

  const payload: Record<string, unknown> = { user_id: user.id }
  for (const key of allowed) {
    if (key in body) payload[key] = body[key]
  }

  const { data: entry, error } = await supabase
    .from('journal_entries')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry }, { status: 201 })
}
