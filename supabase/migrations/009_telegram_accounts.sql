-- ============================================================
-- Migration: 009_telegram_accounts
-- Links Telegram user accounts to platform users
-- Used for VIP channel access control and signal delivery
-- ============================================================

CREATE TABLE IF NOT EXISTS public.telegram_accounts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Telegram identity
  telegram_user_id      BIGINT      NOT NULL UNIQUE,
  telegram_username     TEXT,       -- @handle (no @)
  telegram_first_name   TEXT,
  telegram_last_name    TEXT,

  -- Verification state
  is_verified           BOOLEAN     NOT NULL DEFAULT false,
  verification_token    TEXT        UNIQUE,   -- one-time token for /link command
  verification_token_expires_at TIMESTAMPTZ,
  verified_at           TIMESTAMPTZ,

  -- Channel membership (synced by bot)
  pro_channel_member    BOOLEAN     NOT NULL DEFAULT false,
  elite_channel_member  BOOLEAN     NOT NULL DEFAULT false,
  last_channel_sync_at  TIMESTAMPTZ,

  -- Preferences
  signal_notifications  BOOLEAN     NOT NULL DEFAULT true,
  news_alerts           BOOLEAN     NOT NULL DEFAULT true,
  tp_sl_updates         BOOLEAN     NOT NULL DEFAULT true,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX telegram_accounts_user_id_idx       ON public.telegram_accounts(user_id);
CREATE INDEX telegram_accounts_telegram_uid_idx  ON public.telegram_accounts(telegram_user_id);
CREATE INDEX telegram_accounts_token_idx         ON public.telegram_accounts(verification_token)
  WHERE verification_token IS NOT NULL;

-- RLS
ALTER TABLE public.telegram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telegram_select_own"
  ON public.telegram_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "telegram_admin_select"
  ON public.telegram_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "telegram_insert_own"
  ON public.telegram_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "telegram_update_own"
  ON public.telegram_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER telegram_accounts_updated_at
  BEFORE UPDATE ON public.telegram_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Generate a secure link token for the /link Telegram bot command
CREATE OR REPLACE FUNCTION public.generate_telegram_link_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Verify caller is the user themselves
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');

  INSERT INTO public.telegram_accounts (user_id, telegram_user_id, verification_token, verification_token_expires_at)
  VALUES (p_user_id, 0, v_token, NOW() + INTERVAL '15 minutes')
  ON CONFLICT (user_id) DO UPDATE
    SET verification_token = v_token,
        verification_token_expires_at = NOW() + INTERVAL '15 minutes',
        updated_at = NOW();

  RETURN v_token;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON public.telegram_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_telegram_link_token TO authenticated;
