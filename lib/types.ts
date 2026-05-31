// ============================================================
// TONY ELITE AI — Centralised TypeScript types
// Mirrors the Supabase schema exactly.
// ============================================================

// ─── Auth & Roles ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'staff' | 'customer'

export type SubscriptionTier = 'free' | 'pro' | 'elite'

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

// ─── Profiles ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  subscription_tier: SubscriptionTier
  stripe_customer_id: string | null
  telegram_user_id: number | null
  timezone: string
  preferred_pairs: string[]
  risk_per_trade_pct: number
  created_at: string
  updated_at: string
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string
  stripe_price_id: string | null
  tier: SubscriptionTier
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  trial_start: string | null
  trial_end: string | null
  created_at: string
  updated_at: string
}

// ─── Signals ──────────────────────────────────────────────────────────────────

export type SignalDirection = 'buy' | 'sell'

export type SignalStatus =
  | 'pending'
  | 'active'
  | 'tp1_hit'
  | 'tp2_hit'
  | 'tp3_hit'
  | 'sl_hit'
  | 'be_hit'
  | 'cancelled'
  | 'expired'

export type SignalTimeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN'

export type MarketSession = 'asian' | 'london' | 'newyork' | 'london_newyork_overlap' | 'sydney'

export type SmcPattern =
  | 'BOS'
  | 'CHOCH'
  | 'MSS'
  | 'OB'
  | 'BREAKER'
  | 'FVG'
  | 'LIQUIDITY_SWEEP'
  | 'POI'
  | 'PREMIUM_OB'
  | 'DISCOUNT_OB'
  | 'INDUCEMENT'
  | 'MITIGATION'

export type MarketBias = 'bullish' | 'bearish' | 'neutral'

export interface Signal {
  id: string
  created_by: string
  pair: string
  direction: SignalDirection
  timeframe: SignalTimeframe
  session: MarketSession | null
  entry_zone_low: number
  entry_zone_high: number
  stop_loss: number
  take_profit_1: number
  take_profit_2: number | null
  take_profit_3: number | null
  risk_reward_1: number | null
  risk_reward_2: number | null
  risk_reward_3: number | null
  pip_risk: number | null
  smc_patterns: SmcPattern[]
  bias: MarketBias
  htf_bias: MarketBias | null
  confluence_score: number | null
  status: SignalStatus
  tier_required: SubscriptionTier
  result_pips: number | null
  closed_price: number | null
  analysis_text: string | null
  chart_url: string | null
  notes: string | null
  telegram_message_id: number | null
  published_at: string | null
  invalidated_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  // joined
  creator?: Pick<Profile, 'id' | 'full_name'>
}

export interface SignalResult {
  id: string
  signal_id: string
  event: string
  price: number
  pips: number | null
  occurred_at: string
}

// ─── Trades ───────────────────────────────────────────────────────────────────

export type TradeStatus = 'pending' | 'open' | 'closed' | 'cancelled'
export type TradeSource = 'manual' | 'mt5_sync' | 'signal'

export interface Trade {
  id: string
  user_id: string
  mt5_account_id: string | null
  signal_id: string | null
  mt5_ticket: number | null
  mt5_deal_id: number | null
  pair: string
  direction: SignalDirection
  lot_size: number
  source: TradeSource
  entry_price: number
  stop_loss: number | null
  take_profit: number | null
  close_price: number | null
  opened_at: string
  closed_at: string | null
  profit_loss: number | null
  swap: number
  commission: number
  pips: number | null
  status: TradeStatus
  account_balance_at_entry: number | null
  risk_amount: number | null
  risk_pct: number | null
  created_at: string
  updated_at: string
  // joined
  signal?: Pick<Signal, 'id' | 'pair' | 'direction' | 'smc_patterns'>
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export type TraderEmotion =
  | 'disciplined'
  | 'confident'
  | 'neutral'
  | 'impatient'
  | 'fearful'
  | 'greedy'
  | 'fomo'
  | 'revenge'
  | 'overconfident'

export type JournalRating = '1' | '2' | '3' | '4' | '5'

export interface JournalEntry {
  id: string
  user_id: string
  trade_id: string | null
  signal_id: string | null
  pair: string
  direction: SignalDirection
  opened_at: string | null
  closed_at: string | null
  pips_result: number | null
  is_winner: boolean | null
  setup_type: SmcPattern[] | null
  bias_used: MarketBias | null
  timeframe_used: SignalTimeframe | null
  session_traded: MarketSession | null
  confluence_met: boolean
  entry_reason: string | null
  exit_reason: string | null
  what_went_right: string | null
  what_went_wrong: string | null
  lessons: string | null
  improvements: string | null
  emotion_before: TraderEmotion
  emotion_during: TraderEmotion
  emotion_after: TraderEmotion
  followed_plan: boolean
  revenge_trade: boolean
  overtraded: boolean
  execution_rating: JournalRating
  management_rating: JournalRating
  screenshots: Array<{ url: string; caption?: string }>
  tags: string[]
  created_at: string
  updated_at: string
}

// ─── Telegram Accounts ────────────────────────────────────────────────────────

export interface TelegramAccount {
  id: string
  user_id: string
  telegram_user_id: number
  telegram_username: string | null
  telegram_first_name: string | null
  telegram_last_name: string | null
  is_verified: boolean
  verification_token: string | null
  verification_token_expires_at: string | null
  verified_at: string | null
  pro_channel_member: boolean
  elite_channel_member: boolean
  last_channel_sync_at: string | null
  signal_notifications: boolean
  news_alerts: boolean
  tp_sl_updates: boolean
  created_at: string
  updated_at: string
}

// ─── MT5 Accounts ─────────────────────────────────────────────────────────────

export type Mt5AccountType = 'demo' | 'live'
export type Mt5SyncStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'deploy_started'

export interface Mt5Account {
  id: string
  user_id: string
  account_number: number
  broker_name: string
  server_name: string
  account_type: Mt5AccountType
  currency: string
  leverage: number
  metaapi_account_id: string | null
  balance: number | null
  equity: number | null
  margin: number | null
  free_margin: number | null
  margin_level: number | null
  open_positions: number
  sync_status: Mt5SyncStatus
  last_sync_at: string | null
  is_active: boolean
  auto_copy_signals: boolean
  max_lot_size: number | null
  max_open_trades: number
  created_at: string
  updated_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PerformanceSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  mt5_account_id: string | null
  total_trades: number
  winning_trades: number
  losing_trades: number
  breakeven_trades: number
  win_rate: number | null
  profit_factor: number | null
  total_pips: number | null
  avg_win_pips: number | null
  avg_loss_pips: number | null
  best_trade_pips: number | null
  worst_trade_pips: number | null
  largest_win_run: number | null
  largest_loss_run: number | null
  gross_profit: number | null
  gross_loss: number | null
  net_profit: number | null
  avg_win_amount: number | null
  avg_loss_amount: number | null
  max_drawdown: number | null
  max_drawdown_pct: number | null
  daily_drawdown: number | null
  daily_drawdown_pct: number | null
  equity_start: number | null
  equity_end: number | null
  pair_breakdown: Record<string, { trades: number; pips: number; win_rate: number }>
  session_breakdown: Record<string, { trades: number; pips: number; win_rate: number }>
  pattern_breakdown: Record<string, { trades: number; pips: number; win_rate: number }>
  created_at: string
}

export interface UserStats30d {
  user_id: string
  trading_days: number
  total_trades: number
  winning_trades: number
  losing_trades: number
  avg_win_rate: number | null
  net_profit_30d: number | null
  total_pips_30d: number | null
  avg_profit_factor: number | null
  max_drawdown_pct_30d: number | null
  equity_low: number | null
  equity_high: number | null
}

export interface SignalPerformance {
  pair: string
  total_signals: number
  wins: number
  losses: number
  win_rate_pct: number | null
  avg_pips: number | null
  total_pips: number | null
  avg_rr: number | null
  last_signal_at: string | null
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Subscription Plan Config ─────────────────────────────────────────────────

export interface PlanConfig {
  tier: SubscriptionTier
  name: string
  price: number           // USD/month
  trialDays: number
  features: string[]
  signalAccess: SubscriptionTier[]
  telegramAccess: boolean
  mt5Access: boolean
  aiAnalysis: boolean
  maxJournalEntries: number | null  // null = unlimited
}

export const PLAN_CONFIGS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    trialDays: 0,
    features: [
      'Up to 3 free signals per week',
      'Basic signal feed',
      'Trade journal (50 entries)',
      'Risk calculator',
      'Community access',
    ],
    signalAccess: ['free'],
    telegramAccess: false,
    mt5Access: false,
    aiAnalysis: false,
    maxJournalEntries: 50,
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 29,
    trialDays: 7,
    features: [
      'Unlimited Pro + Free signals',
      'Telegram VIP Pro channel',
      'TP/SL real-time updates',
      'Full trade journal',
      'Performance analytics (30d)',
      'Session intelligence',
      'Multi-timeframe bias tool',
    ],
    signalAccess: ['free', 'pro'],
    telegramAccess: true,
    mt5Access: false,
    aiAnalysis: false,
    maxJournalEntries: null,
  },
  elite: {
    tier: 'elite',
    name: 'Elite',
    price: 99,
    trialDays: 7,
    features: [
      'Everything in Pro',
      'Elite-only signals (highest RR)',
      'Telegram VIP Elite channel',
      'MT5 account integration',
      'AI SMC signal analysis',
      'Auto TP/SL management',
      'Advanced analytics (all-time)',
      'Priority support',
    ],
    signalAccess: ['free', 'pro', 'elite'],
    telegramAccess: true,
    mt5Access: true,
    aiAnalysis: true,
    maxJournalEntries: null,
  },
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function canAccessSignal(userTier: SubscriptionTier, signalTier: SubscriptionTier): boolean {
  const tierRank: Record<SubscriptionTier, number> = { free: 1, pro: 2, elite: 3 }
  return tierRank[userTier] >= tierRank[signalTier]
}

export function formatPips(pips: number | null): string {
  if (pips === null) return '—'
  return `${pips > 0 ? '+' : ''}${pips.toFixed(1)} pips`
}

export function formatRR(rr: number | null): string {
  if (!rr) return '—'
  return `1:${rr.toFixed(1)}`
}

export const MAJOR_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
] as const

export const MINOR_PAIRS = [
  'EURGBP', 'EURJPY', 'GBPJPY', 'EURAUD', 'EURCHF', 'GBPAUD', 'AUDJPY',
  'CADJPY', 'CHFJPY', 'GBPCAD', 'GBPCHF', 'AUDCAD', 'AUDCHF', 'AUDNZD',
  'NZDJPY', 'NZDCAD',
] as const

export const COMMODITY_PAIRS = [
  'XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL',
] as const

export const ALL_PAIRS = [...MAJOR_PAIRS, ...MINOR_PAIRS, ...COMMODITY_PAIRS] as const

export const SMC_PATTERN_LABELS: Record<SmcPattern, string> = {
  BOS: 'Break of Structure',
  CHOCH: 'Change of Character',
  MSS: 'Market Structure Shift',
  OB: 'Order Block',
  BREAKER: 'Breaker Block',
  FVG: 'Fair Value Gap',
  LIQUIDITY_SWEEP: 'Liquidity Sweep',
  POI: 'Point of Interest',
  PREMIUM_OB: 'Premium Order Block',
  DISCOUNT_OB: 'Discount Order Block',
  INDUCEMENT: 'Inducement',
  MITIGATION: 'Mitigation Block',
}

export const SESSION_TIMES: Record<MarketSession, { open: string; close: string; timezone: string }> = {
  asian:                  { open: '00:00', close: '09:00', timezone: 'UTC' },
  london:                 { open: '08:00', close: '17:00', timezone: 'UTC' },
  newyork:                { open: '13:00', close: '22:00', timezone: 'UTC' },
  london_newyork_overlap: { open: '13:00', close: '17:00', timezone: 'UTC' },
  sydney:                 { open: '22:00', close: '07:00', timezone: 'UTC' },
}

// ─── Legacy café types (kept for backwards compatibility) ─────────────────────
// TODO: remove once all café pages are replaced with Forex equivalents.

export type UserRoleLegacy = UserRole
export type SenderType = 'customer' | 'ai' | 'staff'

export interface RoleConfig {
  label: string
  color: string
  bgColor: string
  description: string
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    label: 'Admin',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Full system access',
  },
  staff: {
    label: 'Analyst',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Signal publishing access',
  },
  customer: {
    label: 'Trader',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    description: 'Trading access',
  },
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  staff: 2,
  customer: 1,
}

export function hasRole(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export interface OrderItemLine {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string
}

export interface OrderMetadata {
  type: 'order'
  order_id: string
  items: OrderItemLine[]
  total: number
  status: string
  notes?: string
}

export interface ReservationMetadata {
  type: 'reservation'
  reservation_id: string
  customer_name: string
  party_size: number
  date: string
  time: string
  status: string
  notes?: string
}

export type ChatMetadata = OrderMetadata | ReservationMetadata | Record<string, unknown>

export interface Message {
  id: string
  customer_id: string
  conversation_id: string
  content: string
  sender_type: SenderType
  staff_id: string | null
  is_read: boolean
  metadata: ChatMetadata | null
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  conversation_id: string
  items: OrderItemLine[]
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; email: string } | null
}

export interface Reservation {
  id: string
  customer_id: string | null
  conversation_id: string | null
  customer_name: string
  customer_phone: string | null
  party_size: number
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MessageWithProfile extends Message {
  customer?: Pick<Profile, 'id' | 'full_name' | 'email' | 'role'>
  staff?: Pick<Profile, 'id' | 'full_name' | 'email'>
}

export interface Conversation {
  conversation_id: string
  customer_id: string
  customer_name: string | null
  customer_email: string
  last_message: string
  last_message_at: string
  message_count: number
  unread_count: number
  messages?: Message[]
}

export interface AIConfig {
  id: number
  system_prompt: string
  auto_reply_enabled: boolean
  model: string
  temperature: number
  max_tokens: number
  updated_at: string
  updated_by: string | null
}
