// ============================================================
// Risk Management Engine — Position Sizing & Portfolio Protection
// ============================================================

// ─── Pip values per standard lot (100,000 units) ──────────────────────────────
// All values expressed as USD value per pip per standard lot

const PIP_VALUES_USD: Record<string, number> = {
  EURUSD: 10,    GBPUSD: 10,    AUDUSD: 10,
  NZDUSD: 10,    USDCAD: 7.5,   USDCHF: 10.5,
  USDJPY: 8.5,   EURJPY: 8.5,   GBPJPY: 8.5,
  AUDJPY: 8.5,   CADJPY: 8.5,   CHFJPY: 8.5,
  NZDJPY: 8.5,   EURGBP: 12.5,  EURAUD: 7,
  GBPAUD: 7,     EURCZK: 0.5,   XAUUSD: 10,
  XAGUSD: 50,    USOIL: 10,
}

function getPipValueUSD(pair: string): number {
  return PIP_VALUES_USD[pair.toUpperCase()] ?? 10
}

export interface PositionSizeResult {
  lot_size:        number   // standard lots (e.g. 0.05)
  micro_lots:      number   // micro lots (x100)
  units:           number   // actual units
  risk_amount:     number   // USD at risk
  risk_pct:        number   // % of account at risk
  pip_risk:        number   // pips from entry to SL
  pip_value_usd:   number   // $ value per pip (for this lot size)
  reward_1:        number   // $ reward at TP1
  reward_2:        number   // $ reward at TP2 (if provided)
  rr_ratio_1:      number
  rr_ratio_2:      number
  valid:           boolean
  warnings:        string[]
}

export interface RiskInput {
  account_balance:  number
  risk_pct:         number   // e.g. 1 = 1%
  pair:             string
  entry_price:      number
  stop_loss:        number
  take_profit_1:    number
  take_profit_2?:   number
  account_currency: string   // 'USD' | 'EUR' | 'GBP' etc.
}

export function calculatePositionSize(input: RiskInput): PositionSizeResult {
  const warnings: string[] = []

  // Pip size
  const isJpy = input.pair.toUpperCase().includes('JPY')
  const pipSize = isJpy ? 0.01 : 0.0001

  // Raw pip counts
  const pip_risk    = Math.abs(input.entry_price - input.stop_loss) / pipSize
  const pip_reward1 = Math.abs(input.entry_price - input.take_profit_1) / pipSize
  const pip_reward2 = input.take_profit_2
    ? Math.abs(input.entry_price - input.take_profit_2) / pipSize
    : 0

  // Risk amount in account currency (simplified: assume USD account)
  const risk_amount = (input.account_balance * input.risk_pct) / 100

  // Pip value per lot for this pair
  const pip_value_per_lot = getPipValueUSD(input.pair)

  // Lot size
  const raw_lots = risk_amount / (pip_risk * pip_value_per_lot)
  const lot_size = parseFloat(Math.max(0.01, Math.floor(raw_lots * 100) / 100).toFixed(2))

  const pip_value_usd = lot_size * pip_value_per_lot
  const reward_1 = pip_reward1 * pip_value_usd
  const reward_2 = pip_reward2 * pip_value_usd
  const rr_ratio_1 = parseFloat((pip_reward1 / pip_risk).toFixed(2))
  const rr_ratio_2 = pip_reward2 > 0 ? parseFloat((pip_reward2 / pip_risk).toFixed(2)) : 0

  // Warnings
  if (input.risk_pct > 2) warnings.push(`Risk ${input.risk_pct}% exceeds recommended 1-2% per trade`)
  if (input.risk_pct > 5) warnings.push('DANGER: Risk above 5% — account at severe risk')
  if (rr_ratio_1 < 1.5)  warnings.push(`RR of ${rr_ratio_1} is below minimum 1.5R — reconsider TP`)
  if (pip_risk > 50)     warnings.push('Wide stop loss — consider a tighter entry zone')
  if (lot_size < 0.01)   warnings.push('Position too small — minimum lot size is 0.01')

  return {
    lot_size,
    micro_lots:    parseFloat((lot_size * 100).toFixed(0)),
    units:         Math.floor(lot_size * 100_000),
    risk_amount:   parseFloat(risk_amount.toFixed(2)),
    risk_pct:      input.risk_pct,
    pip_risk:      parseFloat(pip_risk.toFixed(1)),
    pip_value_usd: parseFloat(pip_value_usd.toFixed(2)),
    reward_1:      parseFloat(reward_1.toFixed(2)),
    reward_2:      parseFloat(reward_2.toFixed(2)),
    rr_ratio_1,
    rr_ratio_2,
    valid:         warnings.every((w) => !w.startsWith('DANGER')),
    warnings,
  }
}

// ─── Drawdown protection ──────────────────────────────────────────────────────

export interface DrawdownStatus {
  daily_loss:      number
  daily_loss_pct:  number
  weekly_loss:     number
  weekly_loss_pct: number
  max_drawdown:    number
  max_drawdown_pct:number
  trading_allowed: boolean
  reason:          string | null
}

export function checkDrawdown(
  starting_balance:  number,
  current_equity:    number,
  daily_starting:    number,
  weekly_starting:   number,
  max_daily_loss_pct:  number = 3,
  max_weekly_loss_pct: number = 8,
  max_drawdown_pct:    number = 20,
): DrawdownStatus {
  const daily_loss      = daily_starting - current_equity
  const daily_loss_pct  = (daily_loss / daily_starting) * 100
  const weekly_loss     = weekly_starting - current_equity
  const weekly_loss_pct = (weekly_loss / weekly_starting) * 100
  const max_drawdown    = starting_balance - current_equity
  const max_dd_pct      = (max_drawdown / starting_balance) * 100

  let trading_allowed = true
  let reason: string | null = null

  if (daily_loss_pct >= max_daily_loss_pct) {
    trading_allowed = false
    reason = `Daily loss limit reached (${daily_loss_pct.toFixed(1)}% / ${max_daily_loss_pct}%)`
  } else if (weekly_loss_pct >= max_weekly_loss_pct) {
    trading_allowed = false
    reason = `Weekly loss limit reached (${weekly_loss_pct.toFixed(1)}% / ${max_weekly_loss_pct}%)`
  } else if (max_dd_pct >= max_drawdown_pct) {
    trading_allowed = false
    reason = `Maximum drawdown reached (${max_dd_pct.toFixed(1)}% / ${max_drawdown_pct}%)`
  }

  return {
    daily_loss:       parseFloat(daily_loss.toFixed(2)),
    daily_loss_pct:   parseFloat(daily_loss_pct.toFixed(2)),
    weekly_loss:      parseFloat(weekly_loss.toFixed(2)),
    weekly_loss_pct:  parseFloat(weekly_loss_pct.toFixed(2)),
    max_drawdown:     parseFloat(max_drawdown.toFixed(2)),
    max_drawdown_pct: parseFloat(max_dd_pct.toFixed(2)),
    trading_allowed,
    reason,
  }
}

// ─── Performance Calculations ─────────────────────────────────────────────────

export interface TradeRecord {
  pips:         number
  profit_loss:  number
  direction:    'buy' | 'sell'
  pair:         string
  is_winner:    boolean
}

export interface PerformanceMetrics {
  total_trades:    number
  wins:            number
  losses:          number
  win_rate:        number
  profit_factor:   number
  avg_win_pips:    number
  avg_loss_pips:   number
  net_pips:        number
  net_pnl:         number
  max_win_streak:  number
  max_loss_streak: number
  expectancy:      number   // average $ expected per trade
}

export function computePerformance(trades: TradeRecord[]): PerformanceMetrics {
  if (trades.length === 0) {
    return { total_trades: 0, wins: 0, losses: 0, win_rate: 0, profit_factor: 0, avg_win_pips: 0, avg_loss_pips: 0, net_pips: 0, net_pnl: 0, max_win_streak: 0, max_loss_streak: 0, expectancy: 0 }
  }

  const wins   = trades.filter((t) => t.is_winner)
  const losses = trades.filter((t) => !t.is_winner)

  const gross_profit = wins.reduce((s, t) => s + t.profit_loss, 0)
  const gross_loss   = Math.abs(losses.reduce((s, t) => s + t.profit_loss, 0))
  const net_pips     = trades.reduce((s, t) => s + t.pips, 0)

  let max_win_streak  = 0
  let max_loss_streak = 0
  let cur_win = 0, cur_loss = 0

  for (const t of trades) {
    if (t.is_winner) { cur_win++; cur_loss = 0; max_win_streak  = Math.max(max_win_streak,  cur_win) }
    else             { cur_loss++; cur_win = 0; max_loss_streak = Math.max(max_loss_streak, cur_loss) }
  }

  const win_rate     = (wins.length / trades.length) * 100
  const avg_win      = wins.length   > 0 ? wins.reduce((s, t)   => s + t.pips, 0) / wins.length   : 0
  const avg_loss     = losses.length > 0 ? losses.reduce((s, t) => s + t.pips, 0) / losses.length : 0
  const expectancy   = (win_rate / 100) * (gross_profit / Math.max(wins.length, 1)) - ((1 - win_rate / 100) * (gross_loss / Math.max(losses.length, 1)))

  return {
    total_trades:    trades.length,
    wins:            wins.length,
    losses:          losses.length,
    win_rate:        parseFloat(win_rate.toFixed(2)),
    profit_factor:   gross_loss > 0 ? parseFloat((gross_profit / gross_loss).toFixed(2)) : gross_profit > 0 ? 999 : 0,
    avg_win_pips:    parseFloat(avg_win.toFixed(1)),
    avg_loss_pips:   parseFloat(avg_loss.toFixed(1)),
    net_pips:        parseFloat(net_pips.toFixed(1)),
    net_pnl:         parseFloat((gross_profit - gross_loss).toFixed(2)),
    max_win_streak,
    max_loss_streak,
    expectancy:      parseFloat(expectancy.toFixed(2)),
  }
}
