import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { menu } from '@/lib/menu-data'

export const dynamic = 'force-dynamic'

// GET /api/pos/products — list all products with category info
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('category_id')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const isDemo = !supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co'

  if (isDemo) {
    // Return menu-data seeded products in demo mode
    const categories: Record<string, string> = {
      Coffee: 'cat-coffee', Tea: 'cat-tea',
      'Cold Drinks': 'cat-cold', Pastries: 'cat-pastries', Food: 'cat-food',
    }
    const items = menu
      .filter(m => !categoryId || categories[m.category] === categoryId)
      .map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category_id: categories[m.category],
        price: m.price,
        image_url: null,
        is_available: true,
        stock_count: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pos_categories: {
          id: categories[m.category],
          name: m.category,
          color: '#7b4116',
          icon: '☕',
          display_order: 1,
          created_at: new Date().toISOString(),
        },
      }))
    return NextResponse.json({ data: items })
  }

  const supabase = await createClient()
  let query = supabase
    .from('pos_products')
    .select('*, pos_categories(*)')
    .order('name')

  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/pos/products — create a new product (staff/admin)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, category_id, price, image_url, is_available, stock_count } = body

  if (!name || price === undefined) {
    return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pos_products')
    .insert({ name, description, category_id, price, image_url, is_available, stock_count })
    .select('*, pos_categories(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// PUT /api/pos/products — update a product (staff/admin)
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pos_products')
    .update(updates)
    .eq('id', id)
    .select('*, pos_categories(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/pos/products — delete a product (admin only)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase.from('pos_products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
