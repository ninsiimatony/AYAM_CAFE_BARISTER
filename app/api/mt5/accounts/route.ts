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

  // Elite only
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier !== 'elite' && profile?.subscription_tier !== undefined) {
    const isAdmin = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!['admin', 'staff'].includes(isAdmin.data?.role ?? '')) {
      return NextResponse.json({ error: 'Elite subscription required for MT5 integration' }, { status: 403 })
    }
  }

  const { account_number, broker_name, server_name, account_type, currency, leverage, mt5_login, mt5_password } = await req.json()

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

  const { id } = await req.json()
  const { error } = await supabase
    .from('mt5_accounts')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
