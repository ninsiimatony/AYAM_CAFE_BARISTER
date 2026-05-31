// ============================================================
// Telegram Bot API client — no external SDK, pure fetch
// ============================================================

import type { Signal, SubscriptionTier } from './types'

const BASE = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

// ─── Core API calls ───────────────────────────────────────────────────────────

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) {
    console.error(`[Telegram] ${method} failed:`, data)
    throw new Error(`Telegram API error: ${data.description}`)
  }
  return data.result as T
}

// ─── Send messages ────────────────────────────────────────────────────────────

export async function sendMessage(chatId: number | string, text: string, parseMode: 'HTML' | 'MarkdownV2' = 'HTML') {
  return call('sendMessage', {
    chat_id:    chatId,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  })
}

export async function editMessage(chatId: number | string, messageId: number, text: string) {
  return call('editMessageText', {
    chat_id:    chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
}

// ─── Channel management ───────────────────────────────────────────────────────

export async function createInviteLink(chatId: string, name: string): Promise<string> {
  const result = await call<{ invite_link: string }>('createChatInviteLink', {
    chat_id:      chatId,
    name,
    creates_join_request: false,
    member_limit: 1,
  })
  return result.invite_link
}

export async function kickMember(chatId: string, userId: number): Promise<void> {
  await call('banChatMember', { chat_id: chatId, user_id: userId })
  await call('unbanChatMember', { chat_id: chatId, user_id: userId, only_if_banned: true })
}

export async function getChatMember(chatId: string, userId: number): Promise<{ status: string }> {
  return call<{ status: string }>('getChatMember', { chat_id: chatId, user_id: userId })
}

// ─── Signal formatter ─────────────────────────────────────────────────────────

export function formatSignalMessage(signal: Signal): string {
  const dirEmoji  = signal.direction === 'buy' ? '🟢' : '🔴'
  const dirLabel  = signal.direction === 'buy' ? 'BUY' : 'SELL'
  const tierLabel = { free: '', pro: '⚡ PRO+', elite: '👑 ELITE ONLY' }[signal.tier_required]

  const patterns = signal.smc_patterns
    .map((p) => {
      const labels: Record<string, string> = {
        BOS: 'Break of Structure',
        CHOCH: 'Change of Character',
        MSS: 'Market Structure Shift',
        OB: 'Order Block',
        BREAKER: 'Breaker Block',
        FVG: 'Fair Value Gap',
        LIQUIDITY_SWEEP: 'Liquidity Sweep',
        POI: 'Point of Interest',
        PREMIUM_OB: 'Premium OB',
        DISCOUNT_OB: 'Discount OB',
        INDUCEMENT: 'Inducement',
        MITIGATION: 'Mitigation Block',
      }
      return `• ${labels[p] ?? p}`
    })
    .join('\n')

  const entryMid = ((signal.entry_zone_low + signal.entry_zone_high) / 2).toFixed(5)
  const pipRisk  = signal.pip_risk ? `${signal.pip_risk.toFixed(1)} pips` : '—'

  let msg = `${dirEmoji} <b>${dirLabel} ${signal.pair}</b>`
  if (tierLabel) msg += `   ${tierLabel}`
  msg += `\n${'━'.repeat(28)}\n`
  msg += `📊 <b>Timeframe:</b> ${signal.timeframe}\n`
  if (signal.session) msg += `🕐 <b>Session:</b> ${signal.session.replace('_', '/')}\n`
  msg += `\n`
  msg += `📍 <b>Entry Zone:</b> ${signal.entry_zone_low.toFixed(5)} – ${signal.entry_zone_high.toFixed(5)}\n`
  msg += `🛑 <b>Stop Loss:</b> ${signal.stop_loss.toFixed(5)}\n`
  msg += `\n`
  msg += `✅ <b>TP1:</b> ${signal.take_profit_1.toFixed(5)}`
  if (signal.risk_reward_1) msg += ` <i>(1:${signal.risk_reward_1.toFixed(1)}R)</i>`
  msg += `\n`
  if (signal.take_profit_2) {
    msg += `✅ <b>TP2:</b> ${signal.take_profit_2.toFixed(5)}`
    if (signal.risk_reward_2) msg += ` <i>(1:${signal.risk_reward_2.toFixed(1)}R)</i>`
    msg += `\n`
  }
  if (signal.take_profit_3) {
    msg += `🏆 <b>TP3:</b> ${signal.take_profit_3.toFixed(5)}`
    if (signal.risk_reward_3) msg += ` <i>(1:${signal.risk_reward_3.toFixed(1)}R)</i>`
    msg += `\n`
  }
  msg += `\n`

  if (patterns) {
    msg += `🔍 <b>SMC Setup:</b>\n${patterns}\n\n`
  }

  if (signal.confluence_score) {
    const bars = '█'.repeat(Math.round(signal.confluence_score)) + '░'.repeat(10 - Math.round(signal.confluence_score))
    msg += `📊 <b>Confluence:</b> ${bars} ${signal.confluence_score}/10\n`
  }

  msg += `⚠️ <b>Risk:</b> ${pipRisk} | <i>Manage size. SL is mandatory.</i>\n`

  if (signal.analysis_text) {
    msg += `\n${'─'.repeat(28)}\n`
    msg += `📋 <b>Analysis:</b>\n<i>${signal.analysis_text.slice(0, 400)}</i>\n`
  }

  msg += `\n${'─'.repeat(28)}\n`
  msg += `⚡ <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/signals">View on platform</a>`

  return msg
}

export function formatTPUpdateMessage(
  signal:  Signal,
  event:   string,
  price:   number,
  pips:    number,
): string {
  const tpLabels: Record<string, string> = {
    tp1_hit: '✅ TP1 HIT',
    tp2_hit: '✅✅ TP2 HIT',
    tp3_hit: '🏆 TP3 HIT — FULL TARGET!',
    sl_hit:  '❌ SL HIT',
    be_hit:  '🔒 MOVED TO BREAK-EVEN',
  }

  const emoji  = event === 'sl_hit' ? '❌' : '✅'
  const pipStr = pips > 0 ? `+${pips.toFixed(1)} pips` : `${pips.toFixed(1)} pips`

  return (
    `${emoji} <b>${signal.direction?.toUpperCase()} ${signal.pair} UPDATE</b>\n` +
    `${'━'.repeat(28)}\n` +
    `📍 ${tpLabels[event] ?? event.toUpperCase()}\n` +
    `💰 Price: ${price.toFixed(5)}   ${pipStr}\n\n` +
    `<a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/signals">View signal →</a>`
  )
}

export function formatWelcomeMessage(planTier: SubscriptionTier): string {
  const tierMsg = {
    free:  '🔓 You have a <b>Free</b> plan. Upgrade for VIP signals.',
    pro:   '⚡ You have a <b>Pro</b> subscription. Welcome to VIP!',
    elite: '👑 You have an <b>Elite</b> subscription. Maximum access granted.',
  }

  return (
    `✅ <b>Account linked successfully!</b>\n\n` +
    `${tierMsg[planTier]}\n\n` +
    `You will receive:\n` +
    (planTier !== 'free' ? `• Signal alerts\n• TP/SL updates\n• News alerts\n\n` : '') +
    `/status — Check your plan\n` +
    `/help — All commands\n\n` +
    `<a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard">Open platform →</a>`
  )
}

// ─── Channel delivery ─────────────────────────────────────────────────────────

export async function deliverSignalToChannels(signal: Signal): Promise<{
  proMessageId:   number | null
  eliteMessageId: number | null
}> {
  const msg = formatSignalMessage(signal)
  let proMessageId:   number | null = null
  let eliteMessageId: number | null = null

  // Send to Elite channel (all signals go there)
  const eliteChannelId = process.env.TELEGRAM_VIP_ELITE_CHANNEL_ID
  if (eliteChannelId) {
    try {
      const result = await call<{ message_id: number }>('sendMessage', {
        chat_id:    eliteChannelId,
        text:       msg,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
      eliteMessageId = result.message_id
    } catch (err) {
      console.error('[Telegram] Elite channel delivery failed:', err)
    }
  }

  // Send free/pro signals to Pro channel too
  const proChannelId = process.env.TELEGRAM_VIP_PRO_CHANNEL_ID
  if (proChannelId && signal.tier_required !== 'elite') {
    try {
      const result = await call<{ message_id: number }>('sendMessage', {
        chat_id:    proChannelId,
        text:       msg,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      })
      proMessageId = result.message_id
    } catch (err) {
      console.error('[Telegram] Pro channel delivery failed:', err)
    }
  }

  return { proMessageId, eliteMessageId }
}

// ─── Set webhook ──────────────────────────────────────────────────────────────

export async function setWebhook(url: string): Promise<void> {
  await call('setWebhook', {
    url,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  })
}
