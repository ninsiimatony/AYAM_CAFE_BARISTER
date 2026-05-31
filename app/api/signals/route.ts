import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier, SignalTimeframe, SignalDirection, MarketBias } from '@/lib/types'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url    = new URL(req.url)
  const status = url.searchParams.get('status')
  const pair   = url.searchParams.get('pair')
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(url.searchParams.get('offset') ?? '0')

  let query = supabase
    .from('signals')
    .select(`
      *,
      creator:profiles!signals_created_by_fkey(id, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)  query = query.eq('status', status)
  if (pair)    query = query.ilike('pair', pair)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signals: data, total: count })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'staff'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let rawBody: Record<string, unknown>
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const pair             = rawBody.pair             as string
  const direction        = rawBody.direction        as SignalDirection
  const timeframe        = rawBody.timeframe        as SignalTimeframe
  const session          = rawBody.session          as string | undefined
  const entry_zone_low   = rawBody.entry_zone_low   as number
  const entry_zone_high  = rawBody.entry_zone_high  as number
  const stop_loss        = rawBody.stop_loss        as number
  const take_profit_1    = rawBody.take_profit_1    as number
  const take_profit_2    = rawBody.take_profit_2    as number | undefined
  const take_profit_3    = rawBody.take_profit_3    as number | undefined
  const risk_reward_1    = rawBody.risk_reward_1    as number | undefined
  const risk_reward_2    = rawBody.risk_reward_2    as number | undefined
  const risk_reward_3    = rawBody.risk_reward_3    as number | undefined
  const pip_risk         = rawBody.pip_risk         as number | undefined
  const smc_patterns     = rawBody.smc_patterns     as string[]
  const bias             = rawBody.bias             as MarketBias
  const htf_bias         = rawBody.htf_bias         as MarketBias | undefined
  const confluence_score = rawBody.confluence_score as number | undefined
  const tier_required    = rawBody.tier_required    as SubscriptionTier
  const analysis_text    = rawBody.analysis_text    as string | undefined
  const chart_url        = rawBody.chart_url        as string | undefined
  const notes            = rawBody.notes            as string | undefined

  // Validate required fields
  if (!pair || !direction || !timeframe || !entry_zone_low || !stop_loss || !take_profit_1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['buy', 'sell'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
  }
  if (!Array.isArray(smc_patterns) || smc_patterns.some((p) => typeof p !== 'string' || p.length > 50)) {
    return NextResponse.json({ error: 'Invalid smc_patterns' }, { status: 400 })
  }
  if (typeof pair !== 'string' || pair.length > 10) {
    return NextResponse.json({ error: 'Invalid pair' }, { status: 400 })
  }

  const { data: signal, error } = await supabase
    .from('signals')
    .insert({
      created_by: user.id,
      pair, direction, timeframe, session,
      entry_zone_low, entry_zone_high,
      stop_loss, take_profit_1, take_profit_2, take_profit_3,
      risk_reward_1, risk_reward_2, risk_reward_3, pip_risk,
      smc_patterns: smc_patterns ?? [],
      bias, htf_bias, confluence_score,
      tier_required,
      analysis_text, chart_url, notes,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signal }, { status: 201 })
}
