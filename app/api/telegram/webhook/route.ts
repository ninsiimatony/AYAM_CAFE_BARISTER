import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, createInviteLink, formatWelcomeMessage } from '@/lib/telegram'
import type { SubscriptionTier } from '@/lib/types'

export const runtime = 'nodejs'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id:         number
      is_bot:     boolean
      first_name: string
      last_name?:  string
      username?:   string
    }
    chat: { id: number; type: string }
    text?:   string
    date:    number
  }
}

export async function POST(req: Request) {
  // Verify secret token — reject if env var missing (fail-closed not fail-open)
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update: TelegramUpdate = await req.json()
  const msg = update.message
  if (!msg?.text) return NextResponse.json({ ok: true })

  const chatId   = msg.chat.id
  const from     = msg.from
  const text     = msg.text.trim()

  const admin = createAdminClient()

  // ── /start or /help ─────────────────────────────────────────────────────────
  if (text === '/start' || text === '/help') {
    await sendMessage(chatId,
      `🤖 <b>TONY ELITE AI Bot</b>\n\n` +
      `Commands:\n` +
      `/link &lt;token&gt; — Link your account\n` +
      `/status — Your subscription status\n` +
      `/signals — Latest active signals\n` +
      `/help — Show this menu\n\n` +
      `To link your account:\n` +
      `1. Go to <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/telegram">Platform → Telegram</a>\n` +
      `2. Click "Generate Link Token"\n` +
      `3. Send <code>/link YOUR_TOKEN</code> here`,
    )
    return NextResponse.json({ ok: true })
  }

  // ── /link <token> ───────────────────────────────────────────────────────────
  if (text.startsWith('/link')) {
    const token = text.split(' ')[1]?.trim()
    if (!token) {
      await sendMessage(chatId, '❌ Usage: <code>/link YOUR_TOKEN</code>\n\nGet your token from the platform.')
      return NextResponse.json({ ok: true })
    }

    // Look up token
    const { data: account } = await admin
      .from('telegram_accounts')
      .select('*, profiles!telegram_accounts_user_id_fkey(subscription_tier)')
      .eq('verification_token', token)
      .maybeSingle()

    if (!account) {
      await sendMessage(chatId, '❌ Invalid token. Generate a new one from the platform.')
      return NextResponse.json({ ok: true })
    }

    if (new Date(account.verification_token_expires_at) < new Date()) {
      await sendMessage(chatId, '❌ Token expired. Generate a new one from the platform.')
      return NextResponse.json({ ok: true })
    }

    // Check if this Telegram ID is already linked to another account
    const { data: existing } = await admin
      .from('telegram_accounts')
      .select('id')
      .eq('telegram_user_id', from.id)
      .neq('user_id', account.user_id)
      .maybeSingle()

    if (existing) {
      await sendMessage(chatId, '❌ This Telegram account is already linked to another platform account.')
      return NextResponse.json({ ok: true })
    }

    // Link the account
    await admin
      .from('telegram_accounts')
      .update({
        telegram_user_id:   from.id,
        telegram_username:  from.username ?? null,
        telegram_first_name: from.first_name,
        telegram_last_name:  from.last_name ?? null,
        is_verified:         true,
        verified_at:         new Date().toISOString(),
        verification_token:  null,
        verification_token_expires_at: null,
      })
      .eq('user_id', account.user_id)

    // Also update profiles.telegram_user_id
    await admin
      .from('profiles')
      .update({ telegram_user_id: from.id })
      .eq('id', account.user_id)

    const tier = (account.profiles as { subscription_tier: SubscriptionTier })?.subscription_tier ?? 'free'

    // Send invite links based on tier
    const proChannelId   = process.env.TELEGRAM_VIP_PRO_CHANNEL_ID
    const eliteChannelId = process.env.TELEGRAM_VIP_ELITE_CHANNEL_ID

    await sendMessage(chatId, formatWelcomeMessage(tier))

    if ((tier === 'pro' || tier === 'elite') && proChannelId) {
      try {
        const link = await createInviteLink(proChannelId, `${from.first_name} Pro Access`)
        await sendMessage(chatId, `⚡ <b>Pro VIP Channel:</b>\n${link}\n<i>Single-use link — expires in 1 hour</i>`)
        await admin
          .from('telegram_accounts')
          .update({ pro_channel_member: true })
          .eq('user_id', account.user_id)
      } catch {}
    }

    if (tier === 'elite' && eliteChannelId) {
      try {
        const link = await createInviteLink(eliteChannelId, `${from.first_name} Elite Access`)
        await sendMessage(chatId, `👑 <b>Elite VIP Channel:</b>\n${link}\n<i>Single-use link — expires in 1 hour</i>`)
        await admin
          .from('telegram_accounts')
          .update({ elite_channel_member: true })
          .eq('user_id', account.user_id)
      } catch {}
    }

    return NextResponse.json({ ok: true })
  }

  // ── /status ─────────────────────────────────────────────────────────────────
  if (text === '/status') {
    const { data: account } = await admin
      .from('telegram_accounts')
      .select('user_id, profiles!telegram_accounts_user_id_fkey(subscription_tier, email)')
      .eq('telegram_user_id', from.id)
      .maybeSingle()

    if (!account) {
      await sendMessage(chatId, '❌ Account not linked. Send /link YOUR_TOKEN to connect.')
      return NextResponse.json({ ok: true })
    }

    const p = (account.profiles as unknown) as { subscription_tier: SubscriptionTier; email: string } | null
    const tierEmoji = { free: '🔓', pro: '⚡', elite: '👑' }[p?.subscription_tier ?? 'free']

    await sendMessage(chatId,
      `${tierEmoji} <b>${(p?.subscription_tier ?? 'free').toUpperCase()} Plan</b>\n` +
      `📧 ${p?.email ?? 'Unknown'}\n\n` +
      (p?.subscription_tier === 'free'
        ? `Upgrade at: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pricing">Platform pricing →</a>`
        : `Manage at: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/billing">Billing portal →</a>`)
    )
    return NextResponse.json({ ok: true })
  }

  // ── /signals ─────────────────────────────────────────────────────────────────
  if (text === '/signals') {
    const { data: signals } = await admin
      .from('signals')
      .select('pair, direction, status, take_profit_1, stop_loss, confluence_score')
      .eq('status', 'active')
      .order('published_at', { ascending: false })
      .limit(5)

    if (!signals?.length) {
      await sendMessage(chatId, 'No active signals right now. Stay sharp! 📊')
      return NextResponse.json({ ok: true })
    }

    let msg = `📊 <b>Active Signals (${signals.length})</b>\n${'━'.repeat(24)}\n`
    for (const s of signals) {
      const dir = s.direction === 'buy' ? '🟢 BUY' : '🔴 SELL'
      msg += `${dir} <b>${s.pair}</b> | SL: ${(s.stop_loss as number).toFixed(5)} | TP1: ${(s.take_profit_1 as number).toFixed(5)}\n`
    }
    msg += `\n<a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/signals">Full details →</a>`

    await sendMessage(chatId, msg)
    return NextResponse.json({ ok: true })
  }

  // Unknown command
  await sendMessage(chatId, 'Unknown command. Send /help for available commands.')
  return NextResponse.json({ ok: true })
}
