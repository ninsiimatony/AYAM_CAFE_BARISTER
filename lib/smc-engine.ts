// ============================================================
// SMC Engine — Institutional Smart Money Concepts Analysis
// Pure TypeScript. No external dependencies.
// ============================================================

import type {
  SignalDirection, MarketBias, SmcPattern,
  SignalTimeframe, MarketSession,
} from './types'

// ─── Candle ──────────────────────────────────────────────────────────────────

export interface Candle {
  time:   number   // Unix timestamp (seconds)
  open:   number
  high:   number
  low:    number
  close:  number
  volume?: number
}

// ─── Internal structures ──────────────────────────────────────────────────────

export interface SwingPoint {
  index:    number
  time:     number
  price:    number
  type:     'high' | 'low'
  strength: number  // how many candles on each side confirmed this swing
}

export interface MarketStructure {
  bias:           MarketBias
  trend_strength: number      // 0–10
  last_bos:       { price: number; time: number; direction: 'up' | 'down' } | null
  last_choch:     { price: number; time: number; direction: 'up' | 'down' } | null
  swing_highs:    SwingPoint[]
  swing_lows:     SwingPoint[]
}

export interface OrderBlock {
  id:         string
  type:       'bullish' | 'bearish'
  high:       number
  low:        number
  mid:        number
  time:       number
  mitigated:  boolean
  strength:   number   // impulse size in pips after the OB
  is_premium: boolean  // above 50% equilibrium
  is_discount:boolean  // below 50% equilibrium
}

export interface FairValueGap {
  id:     string
  type:   'bullish' | 'bearish'
  high:   number
  low:    number
  mid:    number
  time:   number
  pips:   number
  filled: boolean
}

export interface LiquidityLevel {
  id:      string
  type:    'buy_side' | 'sell_side'   // SSL = below swing lows, BSL = above swing highs
  price:   number
  time:    number
  swept:   boolean
  swept_at?: number
  equal_highs_lows: boolean
}

export interface Inducement {
  id:        string
  type:      'bullish' | 'bearish'
  high:      number
  low:       number
  time:      number
  confirmed: boolean
}

export interface KeyLevel {
  price:    number
  type:     string
  strength: number
  label:    string
}

// ─── Full SMC Analysis Output ─────────────────────────────────────────────────

export interface SMCAnalysis {
  pair:              string
  timeframe:         SignalTimeframe
  timestamp:         number
  candle_count:      number

  // Core
  market_structure:  MarketStructure
  order_blocks:      OrderBlock[]
  fair_value_gaps:   FairValueGap[]
  liquidity_levels:  LiquidityLevel[]
  inducements:       Inducement[]
  key_levels:        KeyLevel[]

  // Session
  current_session:   MarketSession | null
  session_bias:      MarketBias

  // Signal
  bias:              MarketBias
  htf_bias:          MarketBias
  direction:         SignalDirection | null
  smc_patterns:      SmcPattern[]
  confluence_score:  number    // 1–10
  signal_quality:    'A+' | 'A' | 'B' | 'C' | 'skip'

  // Suggested levels
  entry_zone_low:    number | null
  entry_zone_high:   number | null
  stop_loss:         number | null
  take_profit_1:     number | null
  take_profit_2:     number | null
  take_profit_3:     number | null
  risk_reward_1:     number | null
  pip_risk:          number | null

  // News filter
  high_impact_news:  boolean

  // Debug
  reasoning_steps:   string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pipSize(pair: string): number {
  const jpyPairs = ['JPY', 'HUF', 'KRW']
  const isJpy = jpyPairs.some((c) => pair.toUpperCase().includes(c))
  return isJpy ? 0.01 : 0.0001
}

function toPips(diff: number, pair: string): number {
  return Math.abs(diff) / pipSize(pair)
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── 1. Swing Point Detection ─────────────────────────────────────────────────

function detectSwingPoints(candles: Candle[], lookback = 5): { highs: SwingPoint[]; lows: SwingPoint[] } {
  const highs: SwingPoint[] = []
  const lows:  SwingPoint[] = []

  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i]
    let isHigh = true
    let isLow  = true

    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j].high >= c.high) isHigh = false
      if (candles[i + j].high >= c.high) isHigh = false
      if (candles[i - j].low  <= c.low)  isLow  = false
      if (candles[i + j].low  <= c.low)  isLow  = false
    }

    if (isHigh) {
      highs.push({ index: i, time: c.time, price: c.high, type: 'high', strength: lookback })
    }
    if (isLow) {
      lows.push({ index: i, time: c.time, price: c.low, type: 'low', strength: lookback })
    }
  }

  return { highs, lows }
}

// ─── 2. Market Structure (BOS / CHOCH) ───────────────────────────────────────

function analyzeMarketStructure(
  candles:  Candle[],
  highs:    SwingPoint[],
  lows:     SwingPoint[],
  pair:     string,
): MarketStructure {
  const steps: string[] = []
  let last_bos:   MarketStructure['last_bos']   = null
  let last_choch: MarketStructure['last_choch'] = null

  const closes = candles.map((c) => c.close)
  const lastClose = closes[closes.length - 1]

  // Count higher highs / higher lows
  let hh = 0, ll = 0, lh = 0, hl = 0
  for (let i = 1; i < highs.length; i++) {
    if (highs[i].price > highs[i - 1].price) hh++
    else lh++
  }
  for (let i = 1; i < lows.length; i++) {
    if (lows[i].price > lows[i - 1].price) hl++
    else ll++
  }

  const bullishStructure = hh >= lh && hl >= ll
  const bearishStructure = lh > hh && ll > hl
  let bias: MarketBias = bullishStructure ? 'bullish' : bearishStructure ? 'bearish' : 'neutral'
  steps.push(`Structure: HH=${hh} LH=${lh} HL=${hl} LL=${ll} → ${bias}`)

  // BOS detection: price breaks last swing in direction of trend
  if (highs.length >= 2) {
    const prevHigh = highs[highs.length - 2].price
    if (lastClose > prevHigh) {
      last_bos = { price: prevHigh, time: candles[candles.length - 1].time, direction: 'up' }
      steps.push(`BOS UP at ${prevHigh.toFixed(5)}`)
    }
  }
  if (lows.length >= 2) {
    const prevLow = lows[lows.length - 2].price
    if (lastClose < prevLow) {
      last_bos = { price: prevLow, time: candles[candles.length - 1].time, direction: 'down' }
      steps.push(`BOS DOWN at ${prevLow.toFixed(5)}`)
    }
  }

  // CHOCH: break against the prevailing trend
  if (bias === 'bullish' && lows.length >= 2) {
    const lastHL = lows[lows.length - 1].price
    if (lastClose < lastHL) {
      last_choch = { price: lastHL, time: candles[candles.length - 1].time, direction: 'down' }
      bias = 'bearish'
      steps.push(`CHOCH DOWN — trend flip at ${lastHL.toFixed(5)}`)
    }
  } else if (bias === 'bearish' && highs.length >= 2) {
    const lastLH = highs[highs.length - 1].price
    if (lastClose > lastLH) {
      last_choch = { price: lastLH, time: candles[candles.length - 1].time, direction: 'up' }
      bias = 'bullish'
      steps.push(`CHOCH UP — trend flip at ${lastLH.toFixed(5)}`)
    }
  }

  const trend_strength = Math.min(10, Math.round(((hh + hl) / Math.max(1, hh + lh + hl + ll)) * 10))

  return { bias, trend_strength, last_bos, last_choch, swing_highs: highs, swing_lows: lows }
}

// ─── 3. Order Block Detection ─────────────────────────────────────────────────

function detectOrderBlocks(candles: Candle[], pair: string): OrderBlock[] {
  const obs: OrderBlock[] = []
  const minImpulse = 15  // minimum pips for impulse to validate OB

  for (let i = 2; i < candles.length - 3; i++) {
    const c = candles[i]
    const isBearish = c.close < c.open  // OB candle is opposite colour

    // Bullish OB: last bearish candle before a bullish impulse
    if (isBearish) {
      let impulseUp = 0
      for (let j = i + 1; j < Math.min(i + 8, candles.length); j++) {
        if (candles[j].close > candles[j].open) impulseUp += toPips(candles[j].high - candles[j].low, pair)
        else break
      }
      if (impulseUp >= minImpulse) {
        const recent = candles.slice(i + 1)
        const mitigated = recent.some((r) => r.low <= c.high && r.high >= c.low)
        obs.push({
          id: uid(),
          type: 'bullish',
          high: c.open,
          low: c.close,
          mid: (c.open + c.close) / 2,
          time: c.time,
          mitigated,
          strength: impulseUp,
          is_premium: false,
          is_discount: true,
        })
      }
    }

    // Bearish OB: last bullish candle before a bearish impulse
    if (!isBearish) {
      let impulseDown = 0
      for (let j = i + 1; j < Math.min(i + 8, candles.length); j++) {
        if (candles[j].close < candles[j].open) impulseDown += toPips(candles[j].high - candles[j].low, pair)
        else break
      }
      if (impulseDown >= minImpulse) {
        const recent = candles.slice(i + 1)
        const mitigated = recent.some((r) => r.low <= c.high && r.high >= c.low)
        obs.push({
          id: uid(),
          type: 'bearish',
          high: c.close,
          low: c.open,
          mid: (c.open + c.close) / 2,
          time: c.time,
          mitigated,
          strength: impulseDown,
          is_premium: true,
          is_discount: false,
        })
      }
    }
  }

  // Return only last 5 unmitigated OBs
  return obs.filter((o) => !o.mitigated).slice(-5)
}

// ─── 4. Fair Value Gap Detection ─────────────────────────────────────────────

function detectFairValueGaps(candles: Candle[], pair: string): FairValueGap[] {
  const fvgs: FairValueGap[] = []
  const minPips = 3

  for (let i = 2; i < candles.length; i++) {
    const prev  = candles[i - 2]
    const curr  = candles[i]

    // Bullish FVG: gap between prev candle high and curr candle low
    if (curr.low > prev.high) {
      const pips = toPips(curr.low - prev.high, pair)
      if (pips >= minPips) {
        const recent  = candles.slice(i + 1)
        const filled  = recent.some((r) => r.low <= prev.high)
        fvgs.push({
          id: uid(),
          type: 'bullish',
          high: curr.low,
          low: prev.high,
          mid: (curr.low + prev.high) / 2,
          time: candles[i - 1].time,
          pips,
          filled,
        })
      }
    }

    // Bearish FVG: gap between prev candle low and curr candle high
    if (curr.high < prev.low) {
      const pips = toPips(prev.low - curr.high, pair)
      if (pips >= minPips) {
        const recent  = candles.slice(i + 1)
        const filled  = recent.some((r) => r.high >= prev.low)
        fvgs.push({
          id: uid(),
          type: 'bearish',
          high: prev.low,
          low: curr.high,
          mid: (prev.low + curr.high) / 2,
          time: candles[i - 1].time,
          pips,
          filled,
        })
      }
    }
  }

  return fvgs.filter((f) => !f.filled).slice(-6)
}

// ─── 5. Liquidity Level Detection ────────────────────────────────────────────

function detectLiquidityLevels(
  candles: Candle[],
  highs:   SwingPoint[],
  lows:    SwingPoint[],
): LiquidityLevel[] {
  const levels: LiquidityLevel[] = []
  const lastClose = candles[candles.length - 1].close
  const equalThreshold = 0.0005  // 5 pips for equal highs/lows

  // Buy-side liquidity = above swing highs (stop hunts above)
  highs.slice(-6).forEach((sh) => {
    const equalHighs = highs.filter((h) => Math.abs(h.price - sh.price) < equalThreshold).length > 1
    const swept = candles.slice(sh.index + 1).some(
      (c) => c.high > sh.price && c.close < sh.price,
    )
    levels.push({
      id: uid(),
      type: 'buy_side',
      price: sh.price,
      time: sh.time,
      swept,
      equal_highs_lows: equalHighs,
    })
  })

  // Sell-side liquidity = below swing lows
  lows.slice(-6).forEach((sl) => {
    const equalLows = lows.filter((l) => Math.abs(l.price - sl.price) < equalThreshold).length > 1
    const swept = candles.slice(sl.index + 1).some(
      (c) => c.low < sl.price && c.close > sl.price,
    )
    levels.push({
      id: uid(),
      type: 'sell_side',
      price: sl.price,
      time: sl.time,
      swept,
      equal_highs_lows: equalLows,
    })
  })

  return levels
}

// ─── 6. Session Detection ─────────────────────────────────────────────────────

function detectCurrentSession(timestampMs?: number): MarketSession | null {
  const now  = new Date(timestampMs ?? Date.now())
  const hour = now.getUTCHours()

  if (hour >= 13 && hour < 17) return 'london_newyork_overlap'
  if (hour >= 8  && hour < 17) return 'london'
  if (hour >= 13 && hour < 22) return 'newyork'
  if (hour >= 22 || hour < 7)  return 'sydney'
  if (hour >= 0  && hour < 9)  return 'asian'
  return null
}

// ─── 7. Confluence Scoring ────────────────────────────────────────────────────

function scoreConfluence(
  ms:  MarketStructure,
  obs: OrderBlock[],
  fvgs: FairValueGap[],
  liq: LiquidityLevel[],
  direction: SignalDirection | null,
  session: MarketSession | null,
): { score: number; patterns: SmcPattern[]; reasoning: string[] } {
  let score = 0
  const patterns: SmcPattern[] = []
  const reasoning: string[] = []

  // Market structure alignment
  if (ms.bias !== 'neutral') {
    score += 2
    reasoning.push(`Market structure: ${ms.bias} (${ms.trend_strength}/10 strength)`)
  }

  // BOS confirmation
  if (ms.last_bos) {
    score += 1.5
    patterns.push('BOS')
    reasoning.push(`BOS confirmed at ${ms.last_bos.price.toFixed(5)} (${ms.last_bos.direction})`)
  }

  // CHOCH (trend reversal setup — high value)
  if (ms.last_choch) {
    score += 2
    patterns.push('CHOCH')
    reasoning.push(`CHOCH confirmed — trend flip setup`)
  }

  // Order block in trade direction
  const alignedOB = obs.find((ob) =>
    direction === 'buy' ? ob.type === 'bullish' : ob.type === 'bearish',
  )
  if (alignedOB) {
    score += 2
    patterns.push('OB')
    reasoning.push(`${alignedOB.type === 'bullish' ? 'Bullish' : 'Bearish'} OB at ${alignedOB.low.toFixed(5)}–${alignedOB.high.toFixed(5)} (${alignedOB.strength.toFixed(1)} pip impulse)`)
  }

  // FVG confluence
  const alignedFVG = fvgs.find((f) =>
    direction === 'buy' ? f.type === 'bullish' : f.type === 'bearish',
  )
  if (alignedFVG) {
    score += 1.5
    patterns.push('FVG')
    reasoning.push(`${alignedFVG.type === 'bullish' ? 'Bullish' : 'Bearish'} FVG at ${alignedFVG.low.toFixed(5)}–${alignedFVG.high.toFixed(5)} (${alignedFVG.pips.toFixed(1)} pips)`)
  }

  // Liquidity sweep (high-probability entry signal)
  const sweptLiq = liq.find((l) =>
    l.swept && (direction === 'buy' ? l.type === 'sell_side' : l.type === 'buy_side'),
  )
  if (sweptLiq) {
    score += 2
    patterns.push('LIQUIDITY_SWEEP')
    reasoning.push(`${sweptLiq.type === 'sell_side' ? 'Sell-side' : 'Buy-side'} liquidity swept at ${sweptLiq.price.toFixed(5)}`)
  }

  // Equal highs/lows (inducement)
  const inducedLiq = liq.find((l) => l.equal_highs_lows && !l.swept)
  if (inducedLiq) {
    patterns.push('INDUCEMENT')
    reasoning.push(`Equal ${inducedLiq.type === 'buy_side' ? 'highs' : 'lows'} acting as inducement at ${inducedLiq.price.toFixed(5)}`)
  }

  // Session bonus (London/NY overlap is highest quality)
  if (session === 'london_newyork_overlap') {
    score += 0.5
    reasoning.push('London/NY overlap — highest institutional activity')
  } else if (session === 'london' || session === 'newyork') {
    score += 0.25
    reasoning.push(`${session === 'london' ? 'London' : 'New York'} session — active market`)
  }

  const finalScore = Math.min(10, Math.round(score * 10) / 10)
  return { score: finalScore, patterns, reasoning }
}

// ─── 8. Entry/SL/TP Calculation ──────────────────────────────────────────────

function calculateLevels(
  direction:  SignalDirection | null,
  obs:        OrderBlock[],
  fvgs:       FairValueGap[],
  swings:     { highs: SwingPoint[]; lows: SwingPoint[] },
  pair:       string,
): Pick<SMCAnalysis, 'entry_zone_low' | 'entry_zone_high' | 'stop_loss' | 'take_profit_1' | 'take_profit_2' | 'take_profit_3' | 'risk_reward_1' | 'pip_risk'> {
  if (!direction) return { entry_zone_low: null, entry_zone_high: null, stop_loss: null, take_profit_1: null, take_profit_2: null, take_profit_3: null, risk_reward_1: null, pip_risk: null }

  let entry_zone_low: number | null  = null
  let entry_zone_high: number | null = null
  let stop_loss: number | null       = null

  // Entry zone: prefer aligned OB, then FVG
  const alignedOB = obs.find((ob) => direction === 'buy' ? ob.type === 'bullish' : ob.type === 'bearish')
  const alignedFVG = fvgs.find((f) => direction === 'buy' ? f.type === 'bullish' : f.type === 'bearish')

  if (alignedOB) {
    entry_zone_low  = alignedOB.low
    entry_zone_high = alignedOB.high
  } else if (alignedFVG) {
    entry_zone_low  = alignedFVG.low
    entry_zone_high = alignedFVG.high
  } else {
    return { entry_zone_low: null, entry_zone_high: null, stop_loss: null, take_profit_1: null, take_profit_2: null, take_profit_3: null, risk_reward_1: null, pip_risk: null }
  }

  // Stop Loss: beyond the structure (10 pips past the entry zone)
  const slBuffer = pipSize(pair) * 10
  stop_loss = direction === 'buy'
    ? entry_zone_low - slBuffer
    : entry_zone_high + slBuffer

  const entryMid = (entry_zone_low + entry_zone_high) / 2
  const riskPips = toPips(Math.abs(entryMid - stop_loss), pair)

  // Take Profits: 1:2R, 1:4R, 1:6R
  const riskDiff = Math.abs(entryMid - stop_loss)
  const take_profit_1 = direction === 'buy' ? entryMid + riskDiff * 2 : entryMid - riskDiff * 2
  const take_profit_2 = direction === 'buy' ? entryMid + riskDiff * 4 : entryMid - riskDiff * 4
  const take_profit_3 = direction === 'buy' ? entryMid + riskDiff * 6 : entryMid - riskDiff * 6

  const risk_reward_1 = 2.0

  return {
    entry_zone_low,
    entry_zone_high,
    stop_loss: parseFloat(stop_loss.toFixed(5)),
    take_profit_1: parseFloat(take_profit_1.toFixed(5)),
    take_profit_2: parseFloat(take_profit_2.toFixed(5)),
    take_profit_3: parseFloat(take_profit_3.toFixed(5)),
    risk_reward_1,
    pip_risk: parseFloat(riskPips.toFixed(1)),
  }
}

// ─── 9. Signal Quality Rating ─────────────────────────────────────────────────

function rateSignal(score: number, hasBOS: boolean, hasLiquiditySweep: boolean): SMCAnalysis['signal_quality'] {
  if (score >= 8 && hasBOS && hasLiquiditySweep) return 'A+'
  if (score >= 7 && hasBOS) return 'A'
  if (score >= 5) return 'B'
  if (score >= 3) return 'C'
  return 'skip'
}

// ─── 10. Main Analyze Function ────────────────────────────────────────────────

export function analyzeSMC(
  candles:   Candle[],
  pair:      string,
  timeframe: SignalTimeframe,
  htfBias:   MarketBias = 'neutral',
  highImpactNews = false,
): SMCAnalysis {
  if (candles.length < 20) {
    throw new Error(`Need at least 20 candles, got ${candles.length}`)
  }

  const reasoning_steps: string[] = []
  const lastCandle = candles[candles.length - 1]

  // 1. Swing points
  const lookback = timeframe === 'M15' ? 3 : timeframe === 'H1' ? 4 : 5
  const { highs, lows } = detectSwingPoints(candles, lookback)
  reasoning_steps.push(`Detected ${highs.length} swing highs, ${lows.length} swing lows`)

  // 2. Market structure
  const market_structure = analyzeMarketStructure(candles, highs, lows, pair)
  reasoning_steps.push(`Market bias: ${market_structure.bias} (strength ${market_structure.trend_strength}/10)`)

  // 3. Order blocks
  const order_blocks = detectOrderBlocks(candles, pair)
  reasoning_steps.push(`Found ${order_blocks.length} active order blocks`)

  // 4. FVGs
  const fair_value_gaps = detectFairValueGaps(candles, pair)
  reasoning_steps.push(`Found ${fair_value_gaps.length} unfilled FVGs`)

  // 5. Liquidity
  const liquidity_levels = detectLiquidityLevels(candles, highs, lows)
  const recentSweep = liquidity_levels.find((l) => l.swept)
  if (recentSweep) reasoning_steps.push(`Liquidity swept at ${recentSweep.price.toFixed(5)}`)

  // 6. Session
  const current_session = detectCurrentSession(lastCandle.time * 1000)
  reasoning_steps.push(`Current session: ${current_session ?? 'off-session'}`)

  // 7. Direction — follow structure bias, confirmed by HTF if provided
  let direction: SignalDirection | null = null
  const structureBias = market_structure.bias
  if (structureBias !== 'neutral') {
    direction = structureBias === 'bullish' ? 'buy' : 'sell'
    if (htfBias !== 'neutral' && htfBias !== structureBias) {
      direction = null  // HTF and LTF conflict — skip
      reasoning_steps.push('HTF/LTF bias conflict — no trade signal')
    }
  }

  // 8. Confluence
  const { score, patterns, reasoning } = scoreConfluence(
    market_structure, order_blocks, fair_value_gaps, liquidity_levels, direction, current_session,
  )
  reasoning_steps.push(...reasoning)
  reasoning_steps.push(`Confluence score: ${score}/10`)

  // 9. Levels
  const levels = calculateLevels(direction, order_blocks, fair_value_gaps, { highs, lows }, pair)

  // 10. Quality
  const signal_quality = rateSignal(
    score,
    !!market_structure.last_bos,
    liquidity_levels.some((l) => l.swept),
  )
  reasoning_steps.push(`Signal quality: ${signal_quality}`)

  // 11. Key levels
  const key_levels: KeyLevel[] = [
    ...highs.slice(-3).map((h) => ({ price: h.price, type: 'swing_high', strength: h.strength, label: 'BSL' })),
    ...lows.slice(-3).map((l)  => ({ price: l.price, type: 'swing_low',  strength: l.strength, label: 'SSL' })),
  ]

  return {
    pair,
    timeframe,
    timestamp: lastCandle.time,
    candle_count: candles.length,
    market_structure,
    order_blocks,
    fair_value_gaps,
    liquidity_levels,
    inducements: [],
    key_levels,
    current_session,
    session_bias: structureBias,
    bias: structureBias,
    htf_bias: htfBias,
    direction,
    smc_patterns: patterns,
    confluence_score: score,
    signal_quality,
    ...levels,
    high_impact_news: highImpactNews,
    reasoning_steps,
  }
}
