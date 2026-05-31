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

  const body = await req.json()
  const {
    pair, direction, timeframe, session,
    entry_zone_low, entry_zone_high,
    stop_loss, take_profit_1, take_profit_2, take_profit_3,
    risk_reward_1, risk_reward_2, risk_reward_3, pip_risk,
    smc_patterns, bias, htf_bias, confluence_score,
    tier_required, analysis_text, chart_url, notes,
  }: {
    pair:             string
    direction:        SignalDirection
    timeframe:        SignalTimeframe
    session?:         string
    entry_zone_low:   number
    entry_zone_high:  number
    stop_loss:        number
    take_profit_1:    number
    take_profit_2?:   number
    take_profit_3?:   number
    risk_reward_1?:   number
    risk_reward_2?:   number
    risk_reward_3?:   number
    pip_risk?:        number
    smc_patterns:     string[]
    bias:             MarketBias
    htf_bias?:        MarketBias
    confluence_score?: number
    tier_required:    SubscriptionTier
    analysis_text?:   string
    chart_url?:       string
    notes?:           string
  } = body

  // Validate required fields
  if (!pair || !direction || !timeframe || !entry_zone_low || !stop_loss || !take_profit_1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
