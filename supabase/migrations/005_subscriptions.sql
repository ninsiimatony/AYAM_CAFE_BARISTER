-- ============================================================
-- Migration: 005_subscriptions
-- Stripe subscription state tracking
-- Source of truth for billing; Stripe webhooks update this table.
-- ============================================================

CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused'
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT              UNIQUE,
  stripe_customer_id      TEXT              NOT NULL,
  stripe_price_id         TEXT,
  tier                    subscription_tier NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN           NOT NULL DEFAULT false,
  cancelled_at            TIMESTAMPTZ,
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX subscriptions_user_id_idx           ON public.subscriptions(user_id);
CREATE INDEX subscriptions_stripe_sub_id_idx     ON public.subscriptions(stripe_subscription_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx            ON public.subscriptions(status);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users see only their own subscription
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "subscriptions_admin_select"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only service role can insert/update (Stripe webhook uses service role key)
CREATE POLICY "subscriptions_service_insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() IS NULL); -- service_role bypasses RLS entirely

CREATE POLICY "subscriptions_service_update"
  ON public.subscriptions FOR UPDATE
  USING (true); -- service_role only; anon/authenticated cannot reach this

-- updated_at trigger
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: get user's active subscription tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (
      SELECT tier FROM public.subscriptions
      WHERE user_id = p_user_id
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
      ORDER BY
        CASE tier WHEN 'elite' THEN 3 WHEN 'pro' THEN 2 ELSE 1 END DESC
      LIMIT 1
    ),
    'free'::subscription_tier
  );
$$;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier TO authenticated;
