import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEMO_CATEGORIES = [
  { id: 'cat-coffee',   name: 'Coffee',      color: '#7b4116', icon: '☕', display_order: 1, created_at: new Date().toISOString() },
  { id: 'cat-tea',      name: 'Tea',          color: '#5a3018', icon: '🍵', display_order: 2, created_at: new Date().toISOString() },
  { id: 'cat-cold',     name: 'Cold Drinks',  color: '#2c7a9e', icon: '🧃', display_order: 3, created_at: new Date().toISOString() },
  { id: 'cat-pastries', name: 'Pastries',     color: '#c87020', icon: '🥐', display_order: 4, created_at: new Date().toISOString() },
  { id: 'cat-food',     name: 'Food',         color: '#2d8a4e', icon: '🍽️', display_order: 5, created_at: new Date().toISOString() },
]

// GET /api/pos/categories
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.json({ data: DEMO_CATEGORIES })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pos_categories')
    .select('*')
    .order('display_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/pos/categories
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, color, icon, display_order } = body
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pos_categories')
    .insert({ name, color, icon, display_order })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
