-- ============================================================
-- Migration: 004_fix_profiles_security
-- 1. Patches role-escalation vulnerability in handle_new_user()
-- 2. Extends profiles table for Forex platform (subscription fields)
-- 3. Adds subscription_tier enum
-- ============================================================

-- 1. Create subscription_tier enum
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'elite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add Forex-specific columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier  subscription_tier  NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT               UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_user_id   BIGINT             UNIQUE,
  ADD COLUMN IF NOT EXISTS timezone           TEXT               NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS preferred_pairs    TEXT[]             NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_per_trade_pct NUMERIC(4,2)       NOT NULL DEFAULT 1.00;

-- 3. SECURITY FIX: Remove role injection from signup metadata.
--    New users are ALWAYS assigned 'customer' (trader role).
--    Only admins can elevate a user's role via the admin panel.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'::user_role,   -- hardcoded: never read from metadata
    'free'::subscription_tier
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant new column permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
