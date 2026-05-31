import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMetaAPIAccount, syncAccountToDb } from '@/lib/mt5'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: accounts, error } = await supabase
    .from('mt5_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ accounts })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Elite or admin/staff only
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, role')
    .eq('id', user.id)
    .single()

  const isStaff = ['admin', 'staff'].includes(profile?.role ?? '')
  const isElite = profile?.subscription_tier === 'elite'

  if (!isElite && !isStaff) {
    return NextResponse.json({ error: 'Elite subscription required for MT5 integration' }, { status: 403 })
  }

  let parsed: Record<string, unknown>
  try { parsed = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { account_number, broker_name, server_name, account_type, currency, leverage, mt5_login, mt5_password } = parsed as {
    account_number: number; broker_name: string; server_name: string; account_type?: string
    currency?: string; leverage?: number; mt5_login?: string; mt5_password?: string
  }

  if (!account_number || !broker_name || !server_name) {
    return NextResponse.json({ error: 'account_number, broker_name, and server_name are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create MetaAPI account if credentials provided
  let metaapiAccountId: string | null = null
  if (mt5_login && mt5_password && server_name) {
    try {
      const metaAccount = await createMetaAPIAccount({
        name:     `${broker_name} ${account_number}`,
        login:    mt5_login,
        password: mt5_password,
        server:   server_name,
        platform: 'mt5',
      })
      metaapiAccountId = metaAccount.id
    } catch (err) {
      console.error('[MT5] MetaAPI account creation failed:', err)
      // Continue without MetaAPI — user can add credentials later
    }
  }

  const { data: account, error } = await admin
    .from('mt5_accounts')
    .insert({
      user_id:          user.id,
      account_number,
      broker_name,
      server_name,
      account_type:     account_type ?? 'demo',
      currency:         currency ?? 'USD',
      leverage:         leverage ?? 100,
      metaapi_account_id: metaapiAccountId,
      sync_status:      metaapiAccountId ? 'connecting' : 'disconnected',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This account is already connected' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger initial sync in background
  if (metaapiAccountId && account) {
    syncAccountToDb(metaapiAccountId, admin, account.id).catch(console.error)
  }

  return NextResponse.json({ account }, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Accept id from either URL query param or JSON body for flexibility
  const url = new URL(req.url)
  const id = url.searchParams.get('id') ?? (await req.json().catch(() => ({}))).id

  if (!id) return NextResponse.json({ error: 'Missing account id' }, { status: 400 })

  const { error } = await supabase
    .from('mt5_accounts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
