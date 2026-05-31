-- ============================================================
-- Migration: 014_fix_telegram_unique
-- CRITICAL: telegram_user_id was NOT NULL UNIQUE with placeholder 0.
-- A second user calling generate_telegram_link_token() would hit a
-- UNIQUE constraint violation (telegram_user_id=0 already exists).
-- Fix: make nullable, drop column-level unique, add partial unique index.
-- ============================================================

-- Allow NULL for unverified (not yet linked) accounts
ALTER TABLE public.telegram_accounts
  ALTER COLUMN telegram_user_id DROP NOT NULL;

-- Drop the column-level UNIQUE constraint
ALTER TABLE public.telegram_accounts
  DROP CONSTRAINT IF EXISTS telegram_accounts_telegram_user_id_key;

-- Add a partial unique index — enforces uniqueness only for real Telegram user IDs
-- NULL values (unverified pending tokens) are excluded, allowing multiple unverified rows
DROP INDEX IF EXISTS public.telegram_accounts_telegram_uid_idx;

CREATE UNIQUE INDEX telegram_accounts_telegram_uid_idx
  ON public.telegram_accounts(telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

-- Fix any existing rows that used 0 as placeholder (pre-migration data)
UPDATE public.telegram_accounts
  SET telegram_user_id = NULL
  WHERE telegram_user_id = 0 AND is_verified = false;

-- Replace generate_telegram_link_token to insert NULL instead of 0
CREATE OR REPLACE FUNCTION public.generate_telegram_link_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.telegram_accounts (
    user_id,
    telegram_user_id,
    verification_token,
    verification_token_expires_at
  )
  VALUES (
    p_user_id,
    NULL,
    v_token,
    NOW() + INTERVAL '15 minutes'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET verification_token             = v_token,
        verification_token_expires_at  = NOW() + INTERVAL '15 minutes',
        updated_at                     = NOW();

  RETURN v_token;
END;
$$;
