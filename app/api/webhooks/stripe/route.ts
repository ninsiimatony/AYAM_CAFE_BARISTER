import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, tierFromPriceId, mapStripeStatus } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Disable Next.js body parsing — Stripe needs the raw bytes for signature verification
export const runtime = 'nodejs'

async function syncSubscription(
  sub: Stripe.Subscription,
  userId: string,
  admin: ReturnType<typeof createAdminClient>,
) {
  const priceId = sub.items.data[0]?.price?.id ?? null
  const tier    = tierFromPriceId(priceId)
  const status  = mapStripeStatus(sub.status)

  // Upsert subscription row
  await admin.from('subscriptions').upsert(
    {
      user_id:                userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id:     sub.customer as string,
      stripe_price_id:        priceId,
      tier,
      status,
      current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
      current_period_end:   new Date((sub as any).current_period_end   * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      cancelled_at:         sub.canceled_at
        ? new Date(sub.canceled_at * 1000).toISOString()
        : null,
      trial_start: (sub as any).trial_start
        ? new Date((sub as any).trial_start * 1000).toISOString()
        : null,
      trial_end: (sub as any).trial_end
        ? new Date((sub as any).trial_end * 1000).toISOString()
        : null,
    },
    { onConflict: 'stripe_subscription_id' },
  )

  // Mirror active tier onto profiles for fast RLS lookups
  const activeTier =
    ['active', 'trialing'].includes(status) ? tier : 'free'

  await admin
    .from('profiles')
    .update({ subscription_tier: activeTier })
    .eq('id', userId)

  // Write audit log
  await admin.rpc('write_audit_log', {
    p_user_id:       userId,
    p_action:        `subscription.${status}`,
    p_resource_type: 'subscription',
    p_resource_id:   sub.id,
    p_new_value:     { tier, status },
  })
}

async function resolveUserId(
  event: Stripe.Event,
  admin: ReturnType<typeof createAdminClient>,
): Promise<string | null> {
  // Prefer metadata set at checkout / subscription creation
  const meta =
    (event.data.object as Record<string, any>).metadata ??
    (event.data.object as Record<string, any>).subscription_details?.metadata

  if (meta?.supabase_user_id) return meta.supabase_user_id as string

  // Fall back to looking up by Stripe customer ID
  const customerId =
    (event.data.object as Record<string, any>).customer as string | undefined

  if (!customerId) return null

  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  return data?.id ?? null
}

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const userId = await resolveUserId(event, admin)
        if (!userId) {
          console.error('[Stripe webhook] No user found for session', session.id)
          break
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await syncSubscription(sub, userId, admin)
        break
      }

      // ── Subscription created / updated ─────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(event, admin)
        if (!userId) break
        await syncSubscription(sub, userId, admin)
        break
      }

      // ── Subscription deleted (cancelled) ───────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await admin
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        const userId = await resolveUserId(event, admin)
        if (userId) {
          await admin
            .from('profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', userId)

          await admin.rpc('write_audit_log', {
            p_user_id:       userId,
            p_action:        'subscription.cancelled',
            p_resource_type: 'subscription',
            p_resource_id:   sub.id,
            p_new_value:     { tier: 'free', status: 'cancelled' },
          })
        }
        break
      }

      // ── Payment succeeded (renewal) ────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (!(invoice as any).subscription) break

        await admin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', (invoice as any).subscription as string)
        break
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!(invoice as any).subscription) break

        await admin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', (invoice as any).subscription as string)

        // Create in-app notification
        const userId = await resolveUserId(event, admin)
        if (userId) {
          await admin.from('notifications').insert({
            user_id: userId,
            type:    'payment_failed',
            title:   'Payment failed',
            body:    'Your subscription payment failed. Please update your payment method to avoid losing access.',
            data:    { invoice_id: invoice.id },
          })
        }
        break
      }

      // ── Trial ending soon (3 days notice) ─────────────────────────────────
      case 'customer.subscription.trial_will_end': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = await resolveUserId(event, admin)
        if (!userId) break

        const tier = tierFromPriceId(sub.items.data[0]?.price?.id ?? null)
        await admin.from('notifications').insert({
          user_id: userId,
          type:    'trial_ending',
          title:   'Trial ending in 3 days',
          body:    `Your ${tier} trial ends in 3 days. Add a payment method to keep access.`,
          data:    { tier, subscription_id: sub.id },
        })
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
