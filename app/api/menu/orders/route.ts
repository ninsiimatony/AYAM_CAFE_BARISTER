import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { kot_number, table_number, items, total, payment_method, comment } = body

    if (!kot_number || !Array.isArray(items) || typeof total !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Use the server client — this works whether or not Supabase is configured.
    // If Supabase env vars are absent the client is a no-op and we return 200
    // so the customer experience is never interrupted.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ ok: true, stored: false })
    }

    const supabase = await createClient()

    const { error } = await supabase.from('menu_orders').insert({
      kot_number,
      table_number: table_number ?? null,
      items,
      total,
      payment_method: payment_method ?? 'cash',
      comment: comment ?? null,
      whatsapp_sent: true,
      status: 'pending',
    })

    if (error) {
      console.error('[menu/orders] Supabase insert error:', error.message)
      // Still return 200 — the WhatsApp message already went through
      return NextResponse.json({ ok: true, stored: false })
    }

    return NextResponse.json({ ok: true, stored: true })
  } catch (err) {
    console.error('[menu/orders] Unexpected error:', err)
    return NextResponse.json({ ok: true, stored: false })
  }
}
