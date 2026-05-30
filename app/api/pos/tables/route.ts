import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEMO_TABLES = Array.from({ length: 10 }, (_, i) => ({
  id:           `table-${i + 1}`,
  table_number: i + 1,
  capacity:     i < 2 ? 2 : i < 7 ? 4 : i < 9 ? 6 : 8,
  status:       'available' as const,
  location:     i < 2 ? 'Window' : i < 7 ? 'Main' : i < 9 ? 'Bar' : 'Private',
  created_at:   new Date().toISOString(),
  updated_at:   new Date().toISOString(),
}))

// GET /api/pos/tables
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.json({ data: DEMO_TABLES })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pos_tables')
    .select('*')
    .order('table_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH /api/pos/tables — update table status
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pos_tables')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/pos/tables — add a new table
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { table_number, capacity, location } = await req.json()
  if (!table_number) return NextResponse.json({ error: 'table_number required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pos_tables')
    .insert({ table_number, capacity: capacity ?? 4, location })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
