import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSMC, type Candle } from '@/lib/smc-engine'
import { generateSignalAnalysis, getNewsContext } from '@/lib/anthropic'
import type { SignalTimeframe, MarketBias } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_tier')
    .eq('id', user.id)
    .single()

  // Only admin/staff or Elite subscribers can run AI analysis
  if (!['admin', 'staff'].includes(profile?.role ?? '') && profile?.subscription_tier !== 'elite') {
    return NextResponse.json({ error: 'Elite subscription required' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const candles          = body.candles          as Candle[]
  const pair             = body.pair             as string
  const timeframe        = body.timeframe        as SignalTimeframe
  const htf_bias         = (body.htf_bias        as MarketBias | undefined) ?? 'neutral'
  const high_impact_news = (body.high_impact_news as boolean | undefined) ?? false
  const htf_context      = (body.htf_context     as string | undefined) ?? ''

  if (!candles || !Array.isArray(candles) || candles.length < 20) {
    return NextResponse.json({ error: 'Need at least 20 candles' }, { status: 400 })
  }
  if (!pair || !timeframe) {
    return NextResponse.json({ error: 'pair and timeframe are required' }, { status: 400 })
  }

  try {
    // 1. Run SMC algorithm
    const smc = analyzeSMC(candles, pair, timeframe, htf_bias, high_impact_news)

    // 2. Get news context
    const newsContext = htf_context || (await getNewsContext(pair))

    // 3. AI analysis (only if signal quality is worth analyzing)
    let aiAnalysis = null
    if (smc.signal_quality !== 'skip') {
      aiAnalysis = await generateSignalAnalysis(smc, pair, timeframe, newsContext)
    }

    return NextResponse.json({
      smc,
      ai:        aiAnalysis,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.error('[AI Analyze]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 },
    )
  }
}
