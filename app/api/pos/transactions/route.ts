import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { POSCartItem, POSPaymentMethod } from '@/lib/types'

export const dynamic = 'force-dynamic'

function generateTxNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `TXN-${date}-${rand}`
}

// GET /api/pos/transactions — paginated list
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page   = parseInt(searchParams.get('page')   ?? '1')
  const limit  = parseInt(searchParams.get('limit')  ?? '20')
  const status = searchParams.get('status')
  const date   = searchParams.get('date') // YYYY-MM-DD

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.json({ data: [], total: 0, page, limit })
  }

  const supabase = await createClient()
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = supabase
    .from('pos_transactions')
    .select('*, pos_tables(table_number, location), profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (date) {
    query = query
      .gte('created_at', `${date}T00:00:00Z`)
      .lt( 'created_at', `${date}T23:59:59Z`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0, page, limit })
}

// POST /api/pos/transactions — create (complete) a sale
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isDemo = !supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co'

  const body = await req.json() as {
    table_id?: string
    items: POSCartItem[]
    tax_rate?: number
    discount_amount?: number
    payment_method: POSPaymentMethod
    amount_paid?: number
    notes?: string
  }

  const {
    table_id,
    items,
    tax_rate = 0,
    discount_amount = 0,
    payment_method,
    amount_paid,
    notes,
  } = body

  if (!items?.length)     return NextResponse.json({ error: 'items required'          }, { status: 400 })
  if (!payment_method)    return NextResponse.json({ error: 'payment_method required' }, { status: 400 })

  const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const tax_amount  = Math.round(subtotal * tax_rate)
  const total       = subtotal + tax_amount - discount_amount
  const change_amount = payment_method === 'cash' && amount_paid != null
    ? Math.max(0, amount_paid - total)
    : null

  const txPayload = {
    transaction_number: generateTxNumber(),
    table_id:           table_id ?? null,
    items,
    subtotal,
    tax_rate,
    tax_amount,
    discount_amount,
    total,
    payment_method,
    amount_paid:   amount_paid ?? null,
    change_amount,
    status:        'completed' as const,
    notes:         notes ?? null,
  }

  if (isDemo) {
    return NextResponse.json({
      data: {
        ...txPayload,
        id:         crypto.randomUUID(),
        cashier_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }, { status: 201 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('pos_transactions')
    .insert({ ...txPayload, cashier_id: user?.id ?? null })
    .select('*, pos_tables(table_number, location), profiles(full_name, email)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark table as available again if table_id provided
  if (table_id) {
    await supabase
      .from('pos_tables')
      .update({ status: 'available' })
      .eq('id', table_id)
  }

  return NextResponse.json({ data }, { status: 201 })
}

// PATCH /api/pos/transactions — void or refund
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, notes } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pos_transactions')
    .update({ status, notes })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
