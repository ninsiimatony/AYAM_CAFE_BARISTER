import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, STRIPE_PLANS } from '@/lib/stripe'
import type { SubscriptionTier } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const tier = body.tier as Exclude<SubscriptionTier, 'free'>

  if (!['pro', 'elite'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const plan = STRIPE_PLANS[tier]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Fetch profile for existing Stripe customer ID
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, stripe_customer_id, subscription_tier')
    .eq('id', user.id)
    .single()

  // Already on this tier or higher
  if (profile?.subscription_tier === tier || (tier === 'pro' && profile?.subscription_tier === 'elite')) {
    return NextResponse.json({ error: 'Already subscribed to this tier or higher' }, { status: 400 })
  }

  let customerId = profile?.stripe_customer_id

  // Create Stripe customer if not exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name:  profile?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await admin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer:    customerId,
    mode:        'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: { supabase_user_id: user.id, tier },
    },
    metadata: { supabase_user_id: user.id, tier },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    success_url: `${siteUrl}/dashboard/billing?success=true&tier=${tier}`,
    cancel_url:  `${siteUrl}/pricing?cancelled=true`,
    automatic_tax: { enabled: false },
  })

  return NextResponse.json({ url: session.url })
}
