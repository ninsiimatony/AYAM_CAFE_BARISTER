-- ============================================================
-- Migration: 007_trades
-- Trade execution records — both manual and MT5-synced
-- ============================================================

DO $$ BEGIN
  CREATE TYPE trade_status AS ENUM ('pending', 'open', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trade_source AS ENUM (
    'manual',   -- user entered manually in journal
    'mt5_sync', -- synced from MT5 account via MetaAPI
    'signal'    -- executed from a platform signal
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.trades (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mt5_account_id    UUID            REFERENCES public.mt5_accounts(id) ON DELETE SET NULL,
  signal_id         UUID            REFERENCES public.signals(id) ON DELETE SET NULL,

  -- MT5 identifiers
  mt5_ticket        BIGINT,         -- MT5 order/position ticket
  mt5_deal_id       BIGINT,         -- MT5 deal ticket (for closed trades)

  -- Trade details
  pair              TEXT            NOT NULL,
  direction         signal_direction NOT NULL,
  lot_size          NUMERIC(10,2)   NOT NULL,
  source            trade_source    NOT NULL DEFAULT 'manual',

  -- Prices
  entry_price       NUMERIC(12,5)   NOT NULL,
  stop_loss         NUMERIC(12,5),
  take_profit       NUMERIC(12,5),
  close_price       NUMERIC(12,5),

  -- Timing
  opened_at         TIMESTAMPTZ     NOT NULL,
  closed_at         TIMESTAMPTZ,

  -- Results
  profit_loss       NUMERIC(12,2),  -- in account currency
  swap              NUMERIC(10,2)   DEFAULT 0,
  commission        NUMERIC(10,2)   DEFAULT 0,
  pips              NUMERIC(8,1),   -- positive = win, negative = loss
  status            trade_status    NOT NULL DEFAULT 'open',

  -- Risk metrics at entry time
  account_balance_at_entry  NUMERIC(14,2),
  risk_amount               NUMERIC(12,2),
  risk_pct                  NUMERIC(6,2),

  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX trades_user_id_idx       ON public.trades(user_id);
CREATE INDEX trades_mt5_account_idx   ON public.trades(mt5_account_id);
CREATE INDEX trades_signal_id_idx     ON public.trades(signal_id);
CREATE INDEX trades_pair_idx          ON public.trades(pair);
CREATE INDEX trades_status_idx        ON public.trades(status);
CREATE INDEX trades_opened_at_idx     ON public.trades(opened_at DESC);
CREATE INDEX trades_mt5_ticket_idx    ON public.trades(mt5_ticket);

-- RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trades_select_own"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trades_admin_select"
  ON public.trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "trades_insert_own"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own"
  ON public.trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "trades_delete_own"
  ON public.trades FOR DELETE
  USING (
    auth.uid() = user_id
    AND source = 'manual'  -- only manual trades can be deleted
  );

-- Trigger
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
