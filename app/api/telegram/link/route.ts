import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: max 3 tokens per user per 5 minutes
  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', user.id)
    .eq('endpoint', 'telegram_link')
    .gte('window_start', windowStart)

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'Too many token requests — wait 5 minutes' }, { status: 429 })
  }

  // Log this attempt (non-blocking, ignore errors)
  admin.from('rate_limits').insert({
    identifier:   user.id,
    endpoint:     'telegram_link',
    window_start: new Date().toISOString(),
  }).then(() => null, () => null)

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
