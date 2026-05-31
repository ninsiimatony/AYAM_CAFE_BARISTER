import Stripe from 'stripe'
import type { SubscriptionTier } from './types'

// Lazy singleton — prevents module-level Stripe init from failing at build time
// when STRIPE_SECRET_KEY is not available in the build environment.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}

// Back-compat named export (for callers using `import { stripe }`)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string]
  },
})

export const STRIPE_PLANS: Record<
  Exclude<SubscriptionTier, 'free'>,
  { priceId: string; tier: SubscriptionTier; trialDays: number; amount: number }
> = {
  pro: {
    priceId:   process.env.STRIPE_PRO_PRICE_ID ?? '',
    tier:      'pro',
    trialDays: 7,
    amount:    2900,
  },
  elite: {
    priceId:   process.env.STRIPE_ELITE_PRICE_ID ?? '',
    tier:      'elite',
    trialDays: 7,
    amount:    9900,
  },
}

export function tierFromPriceId(priceId: string | null | undefined): SubscriptionTier {
  if (!priceId) return 'free'
  if (priceId === process.env.STRIPE_ELITE_PRICE_ID) return 'elite'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  return 'free'
}

export function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
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
