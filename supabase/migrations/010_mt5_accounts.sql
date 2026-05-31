-- ============================================================
-- Migration: 010_mt5_accounts
-- MT5 trading account connections (via MetaAPI or custom bridge)
-- Elite tier only
-- ============================================================

DO $$ BEGIN
  CREATE TYPE mt5_account_type AS ENUM ('demo', 'live');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mt5_sync_status AS ENUM (
    'disconnected', 'connecting', 'connected', 'error', 'deploy_started'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.mt5_accounts (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- MT5 account info
  account_number      BIGINT            NOT NULL,
  broker_name         TEXT              NOT NULL,
  server_name         TEXT              NOT NULL,
  account_type        mt5_account_type  NOT NULL DEFAULT 'demo',
  currency            TEXT              NOT NULL DEFAULT 'USD',
  leverage            INTEGER           NOT NULL DEFAULT 100,

  -- MetaAPI integration
  metaapi_account_id  TEXT              UNIQUE,  -- MetaAPI account UUID
  metaapi_token       TEXT,             -- encrypted in application layer

  -- Live account state (synced periodically)
  balance             NUMERIC(14,2),
  equity              NUMERIC(14,2),
  margin              NUMERIC(14,2),
  free_margin         NUMERIC(14,2),
  margin_level        NUMERIC(8,2),    -- equity/margin * 100
  open_positions      INTEGER          DEFAULT 0,
  sync_status         mt5_sync_status  NOT NULL DEFAULT 'disconnected',
  last_sync_at        TIMESTAMPTZ,

  -- Settings
  is_active           BOOLEAN          NOT NULL DEFAULT true,
  auto_copy_signals   BOOLEAN          NOT NULL DEFAULT false,  -- Phase 5 feature
  max_lot_size        NUMERIC(10,2),
  max_open_trades     INTEGER          DEFAULT 5,

  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, account_number, server_name)
);

CREATE INDEX mt5_accounts_user_id_idx   ON public.mt5_accounts(user_id);
CREATE INDEX mt5_accounts_active_idx    ON public.mt5_accounts(is_active) WHERE is_active = true;
CREATE INDEX mt5_accounts_metaapi_idx   ON public.mt5_accounts(metaapi_account_id)
  WHERE metaapi_account_id IS NOT NULL;

-- RLS
ALTER TABLE public.mt5_accounts ENABLE ROW LEVEL SECURITY;

-- Users see only their own MT5 accounts
CREATE POLICY "mt5_select_own"
  ON public.mt5_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mt5_admin_select"
  ON public.mt5_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only Elite subscribers can add MT5 accounts
CREATE POLICY "mt5_insert_elite"
  ON public.mt5_accounts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.get_user_tier(auth.uid()) = 'elite'
  );

CREATE POLICY "mt5_update_own"
  ON public.mt5_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "mt5_delete_own"
  ON public.mt5_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER mt5_accounts_updated_at
  BEFORE UPDATE ON public.mt5_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mt5_accounts TO authenticated;
