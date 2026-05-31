import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deliverSignalToChannels, formatTPUpdateMessage } from '@/lib/telegram'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: signal, error } = await supabase
    .from('signals')
    .select(`*, creator:profiles!signals_created_by_fkey(id, full_name), signal_results(*)`)
    .eq('id', id)
    .single()

  if (error || !signal) return NextResponse.json({ error: 'Signal not found' }, { status: 404 })

  return NextResponse.json({ signal })
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
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

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const admin   = createAdminClient()

  // ── Publish action ──────────────────────────────────────────────────────────
  if (body.action === 'publish') {
    const { data: signal } = await admin.from('signals').select('*').eq('id', id).single()
    if (!signal) return NextResponse.json({ error: 'Signal not found' }, { status: 404 })
    if (signal.status !== 'pending') return NextResponse.json({ error: 'Signal already published' }, { status: 400 })

    // Deliver to Telegram channels
    let telegramMessageId: number | null = null
    try {
      const { eliteMessageId, proMessageId } = await deliverSignalToChannels(signal)
      telegramMessageId = eliteMessageId ?? proMessageId
    } catch (err) {
      console.error('[Signal publish] Telegram delivery failed:', err)
    }

    const { data: updated } = await admin
      .from('signals')
      .update({
        status:              'active',
        published_at:        new Date().toISOString(),
        telegram_message_id: telegramMessageId,
      })
      .eq('id', id)
      .select()
      .single()

    await admin.rpc('write_audit_log', {
      p_user_id:       user.id,
      p_action:        'signal.published',
      p_resource_type: 'signal',
      p_resource_id:   id,
      p_new_value:     { status: 'active', pair: signal.pair },
    })

    return NextResponse.json({ signal: updated })
  }

  // ── Update TP/SL result ─────────────────────────────────────────────────────
  if (body.action === 'result') {
    const { event, price, pips } = body as { event: string; price: number; pips?: number }
    const validEvents = ['tp1_hit', 'tp2_hit', 'tp3_hit', 'sl_hit', 'be_hit', 'cancelled', 'expired']
    if (!validEvents.includes(event)) return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    if (typeof price !== 'number' || price <= 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    if (pips !== undefined && typeof pips !== 'number') return NextResponse.json({ error: 'Invalid pips' }, { status: 400 })

    const { data: signal } = await admin.from('signals').select('*').eq('id', id).single()
    if (!signal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Log the result event
    await admin.from('signal_results').insert({ signal_id: id, event, price, pips })

    // Update signal status
    const isClosed = ['tp3_hit', 'sl_hit', 'cancelled', 'expired'].includes(event)
    await admin.from('signals').update({
      status:       event as string,
      result_pips:  ['tp3_hit', 'sl_hit'].includes(event) ? pips : signal.result_pips,
      closed_price: isClosed ? price : null,
      closed_at:    isClosed ? new Date().toISOString() : null,
    }).eq('id', id)

    // Send Telegram update
    if (signal.telegram_message_id) {
      try {
        const proChannelId   = process.env.TELEGRAM_VIP_PRO_CHANNEL_ID
        const eliteChannelId = process.env.TELEGRAM_VIP_ELITE_CHANNEL_ID
        const updateMsg = formatTPUpdateMessage(signal, event, price, pips ?? 0)

        const channelId = eliteChannelId ?? proChannelId
        if (channelId) {
          const { sendMessage } = await import('@/lib/telegram')
          await sendMessage(channelId, updateMsg)
        }
      } catch (err) {
        console.error('[Signal result] Telegram update failed:', err)
      }
    }

    return NextResponse.json({ ok: true })
  }

  // ── General update ──────────────────────────────────────────────────────────
  const allowedFields = ['analysis_text', 'chart_url', 'notes', 'confluence_score', 'tier_required']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowedFields.includes(k)),
  )

  const { data: updated, error } = await admin
    .from('signals')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signal: updated })
}
