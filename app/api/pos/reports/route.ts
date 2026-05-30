import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { POSCartItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/pos/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? new Date().toISOString().slice(0, 10)
  const to   = searchParams.get('to')   ?? from

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.json({
      data: {
        from, to,
        transaction_count: 0,
        total_revenue: 0,
        subtotal: 0,
        tax_collected: 0,
        discounts_given: 0,
        by_payment_method: {},
        top_items: [],
      }
    })
  }

  const supabase = await createClient()
  const { data: txns, error } = await supabase
    .from('pos_transactions')
    .select('*')
    .eq('status', 'completed')
    .gte('created_at', `${from}T00:00:00Z`)
    .lte('created_at', `${to}T23:59:59Z`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const report = {
    from,
    to,
    transaction_count: txns.length,
    total_revenue:     0,
    subtotal:          0,
    tax_collected:     0,
    discounts_given:   0,
    by_payment_method: {} as Record<string, { count: number; total: number }>,
    top_items:         {} as Record<string, { name: string; quantity: number; revenue: number }>,
  }

  for (const tx of txns) {
    report.total_revenue   += Number(tx.total)
    report.subtotal        += Number(tx.subtotal)
    report.tax_collected   += Number(tx.tax_amount)
    report.discounts_given += Number(tx.discount_amount)

    const pm = tx.payment_method as string
    if (!report.by_payment_method[pm]) report.by_payment_method[pm] = { count: 0, total: 0 }
    report.by_payment_method[pm].count++
    report.by_payment_method[pm].total += Number(tx.total)

    const items = (tx.items ?? []) as POSCartItem[]
    for (const item of items) {
      if (!report.top_items[item.product_id]) {
        report.top_items[item.product_id] = { name: item.name, quantity: 0, revenue: 0 }
      }
      report.top_items[item.product_id].quantity += item.quantity
      report.top_items[item.product_id].revenue  += item.price * item.quantity
    }
  }

  const top_items = Object.values(report.top_items)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return NextResponse.json({
    data: { ...report, top_items, top_items_map: undefined },
  })
}
