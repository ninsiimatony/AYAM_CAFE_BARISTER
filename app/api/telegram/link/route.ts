import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Call the DB function to generate a secure link token
  const { data: token, error } = await supabase
    .rpc('generate_telegram_link_token', { p_user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'tonyeliteai_bot'

  return NextResponse.json({
    token,
    command: `/link ${token}`,
    bot_url: `https://t.me/${botUsername}?start=link`,
    expires_in_minutes: 15,
  })
}
