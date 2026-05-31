import Stripe from 'stripe'
import type { SubscriptionTier } from './types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export const STRIPE_PLANS: Record<
  Exclude<SubscriptionTier, 'free'>,
  { priceId: string; tier: SubscriptionTier; trialDays: number; amount: number }
> = {
  pro: {
    priceId:   process.env.STRIPE_PRO_PRICE_ID!,
    tier:      'pro',
    trialDays: 7,
    amount:    2900,   // cents
  },
  elite: {
    priceId:   process.env.STRIPE_ELITE_PRICE_ID!,
    tier:      'elite',
    trialDays: 7,
    amount:    9900,
  },
}

// Map a Stripe price ID back to a tier
export function tierFromPriceId(priceId: string | null | undefined): SubscriptionTier {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) return 'elite'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  return 'free'
}

// Map Stripe subscription status to our status type
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): string {
  const map: Record<Stripe.Subscription.Status, string> = {
    trialing:           'trialing',
    active:             'active',
    past_due:           'past_due',
    canceled:           'cancelled',
    incomplete:         'incomplete',
    incomplete_expired: 'incomplete_expired',
    unpaid:             'unpaid',
    paused:             'paused',
  }
  return map[stripeStatus] ?? 'cancelled'
}
