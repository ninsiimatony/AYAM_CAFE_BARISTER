// ============================================================
// MT5 Bridge — MetaAPI REST integration
// Elite subscribers only
// ============================================================

const METAAPI_BASE = 'https://mt-client-api-v1.agiliumtrade.ai'

function metaApiHeaders() {
  return {
    'auth-token':   process.env.METAAPI_TOKEN ?? '',
    'Content-Type': 'application/json',
  }
}

export interface MT5AccountInfo {
  broker:       string
  currency:     string
  server:       string
  balance:      number
  equity:       number
  margin:       number
  freeMargin:   number
  leverage:     number
  marginLevel?: number
  name:         string
  login:        number
  type:         'ACCOUNT_TRADE_MODE_DEMO' | 'ACCOUNT_TRADE_MODE_REAL'
}

export interface MT5Position {
  id:           string
  type:         'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL'
  symbol:       string
  magic:        number
  openPrice:    number
  volume:       number
  currentPrice: number
  currentTickValue: number
  stopLoss?:    number
  takeProfit?:  number
  unrealizedProfit: number
  realizedProfit:   number
  openTime:     string
  comment?:     string
}

export interface MT5Order {
  id:           string
  type:         string
  symbol:       string
  openPrice:    number
  volume:       number
  state:        string
  clientId?:    string
}

export interface MT5TradeRequest {
  symbol:        string
  actionType:    'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL' | 'ORDER_TYPE_BUY_LIMIT' | 'ORDER_TYPE_SELL_LIMIT'
  volume:        number
  stopLoss?:     number
  takeProfit?:   number
  price?:        number
  comment?:      string
  clientId?:     string
}

// ─── Account management ───────────────────────────────────────────────────────

export async function deployAccount(metaapiAccountId: string): Promise<void> {
  await fetch(`${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/deploy`, {
    method:  'POST',
    headers: metaApiHeaders(),
  })
}

export async function getAccountInfo(metaapiAccountId: string): Promise<MT5AccountInfo> {
  const res = await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/information`,
    { headers: metaApiHeaders() },
  )
  if (!res.ok) throw new Error(`MetaAPI error: ${res.status}`)
  return res.json()
}

// ─── Positions & orders ───────────────────────────────────────────────────────

export async function getPositions(metaapiAccountId: string): Promise<MT5Position[]> {
  const res = await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/positions`,
    { headers: metaApiHeaders() },
  )
  if (!res.ok) throw new Error(`MetaAPI error: ${res.status}`)
  return res.json()
}

export async function getOrders(metaapiAccountId: string): Promise<MT5Order[]> {
  const res = await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/orders`,
    { headers: metaApiHeaders() },
  )
  if (!res.ok) return []
  return res.json()
}

// ─── Trade execution (Elite) ──────────────────────────────────────────────────

export async function executeTrade(
  metaapiAccountId: string,
  trade:            MT5TradeRequest,
): Promise<{ orderId: string; tradeExecutionTime: string }> {
  const res = await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/trade`,
    {
      method:  'POST',
      headers: metaApiHeaders(),
      body:    JSON.stringify(trade),
    },
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? `Trade execution failed: ${res.status}`)
  }
  return res.json()
}

export async function closePosition(
  metaapiAccountId: string,
  positionId:       string,
): Promise<void> {
  await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/positions/${positionId}/close`,
    { method: 'POST', headers: metaApiHeaders() },
  )
}

export async function modifyPosition(
  metaapiAccountId: string,
  positionId:       string,
  stopLoss?:        number,
  takeProfit?:      number,
): Promise<void> {
  await fetch(
    `${METAAPI_BASE}/users/current/accounts/${metaapiAccountId}/positions/${positionId}`,
    {
      method:  'PUT',
      headers: metaApiHeaders(),
      body:    JSON.stringify({ stopLoss, takeProfit }),
    },
  )
}

// ─── Create MetaAPI account connection ───────────────────────────────────────

export async function createMetaAPIAccount(params: {
  name:      string
  login:     string
  password:  string
  server:    string
  platform:  'mt5' | 'mt4'
  magic?:    number
}): Promise<{ id: string }> {
  const res = await fetch(`${METAAPI_BASE}/users/current/accounts`, {
    method:  'POST',
    headers: metaApiHeaders(),
    body: JSON.stringify({
      name:     params.name,
      type:     'cloud',
      login:    params.login,
      password: params.password,
      server:   params.server,
      platform: params.platform,
      magic:    params.magic ?? 12345,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? 'Failed to create MetaAPI account')
  }
  return res.json()
}

// ─── Sync helper — update DB with live data ──────────────────────────────────

export async function syncAccountToDb(
  metaapiAccountId: string,
  supabaseAdmin: ReturnType<typeof import('./supabase/admin').createAdminClient>,
  dbAccountId: string,
): Promise<void> {
  try {
    const info      = await getAccountInfo(metaapiAccountId)
    const positions = await getPositions(metaapiAccountId)

    await supabaseAdmin
      .from('mt5_accounts')
      .update({
        balance:        info.balance,
        equity:         info.equity,
        margin:         info.margin,
        free_margin:    info.freeMargin,
        margin_level:   info.marginLevel ?? null,
        open_positions: positions.length,
        sync_status:    'connected',
        last_sync_at:   new Date().toISOString(),
      })
      .eq('id', dbAccountId)
  } catch (err) {
    await supabaseAdmin
      .from('mt5_accounts')
      .update({ sync_status: 'error', last_sync_at: new Date().toISOString() })
      .eq('id', dbAccountId)
    throw err
  }
}
