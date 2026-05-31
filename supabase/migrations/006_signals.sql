-- ============================================================
-- Migration: 006_signals
-- Forex trading signals with full SMC metadata
-- ============================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE signal_direction AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signal_status AS ENUM (
    'pending',    -- signal drafted, not yet live
    'active',     -- live, awaiting entry
    'tp1_hit',    -- first take-profit reached
    'tp2_hit',    -- second take-profit reached
    'tp3_hit',    -- all targets hit
    'sl_hit',     -- stop loss hit (loss)
    'be_hit',     -- moved to break-even, then stopped
    'cancelled',  -- admin cancelled before entry
    'expired'     -- price never reached entry zone
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signal_timeframe AS ENUM (
    'M1','M5','M15','M30','H1','H4','D1','W1','MN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE market_session AS ENUM (
    'asian', 'london', 'newyork', 'london_newyork_overlap', 'sydney'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE smc_pattern AS ENUM (
    'BOS',             -- Break of Structure
    'CHOCH',           -- Change of Character
    'MSS',             -- Market Structure Shift
    'OB',              -- Order Block
    'BREAKER',         -- Breaker Block
    'FVG',             -- Fair Value Gap
    'LIQUIDITY_SWEEP', -- Stop Hunt / Liquidity Sweep
    'POI',             -- Point of Interest (generic)
    'PREMIUM_OB',      -- Premium zone Order Block
    'DISCOUNT_OB',     -- Discount zone Order Block
    'INDUCEMENT',      -- Inducement trap
    'MITIGATION'       -- Mitigation block
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE market_bias AS ENUM ('bullish', 'bearish', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Signals table
CREATE TABLE IF NOT EXISTS public.signals (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by          UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- Instrument
  pair                TEXT              NOT NULL,  -- e.g. 'EURUSD', 'XAUUSD'
  direction           signal_direction  NOT NULL,
  timeframe           signal_timeframe  NOT NULL DEFAULT 'H1',
  session             market_session,

  -- Levels
  entry_zone_low      NUMERIC(12,5)     NOT NULL,
  entry_zone_high     NUMERIC(12,5)     NOT NULL,
  stop_loss           NUMERIC(12,5)     NOT NULL,
  take_profit_1       NUMERIC(12,5)     NOT NULL,
  take_profit_2       NUMERIC(12,5),
  take_profit_3       NUMERIC(12,5),

  -- Risk metrics
  risk_reward_1       NUMERIC(6,2),     -- RR to TP1
  risk_reward_2       NUMERIC(6,2),     -- RR to TP2
  risk_reward_3       NUMERIC(6,2),     -- RR to TP3
  pip_risk            NUMERIC(8,1),     -- pips from mid-entry to SL

  -- SMC analysis
  smc_patterns        smc_pattern[]     NOT NULL DEFAULT '{}',
  bias                market_bias       NOT NULL DEFAULT 'neutral',
  htf_bias            market_bias,      -- Higher timeframe bias
  confluence_score    SMALLINT          CHECK (confluence_score BETWEEN 1 AND 10),

  -- Status & lifecycle
  status              signal_status     NOT NULL DEFAULT 'pending',
  tier_required       subscription_tier NOT NULL DEFAULT 'free',

  -- Results (set on close)
  result_pips         NUMERIC(8,1),
  closed_price        NUMERIC(12,5),

  -- Content
  analysis_text       TEXT,             -- AI-generated or manual analysis
  chart_url           TEXT,             -- screenshot URL
  notes               TEXT,

  -- Telegram delivery
  telegram_message_id BIGINT,           -- message ID in VIP channel

  -- Timestamps
  published_at        TIMESTAMPTZ,      -- when signal went live
  invalidated_at      TIMESTAMPTZ,      -- when price invalidated setup
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX signals_pair_idx         ON public.signals(pair);
CREATE INDEX signals_status_idx       ON public.signals(status);
CREATE INDEX signals_direction_idx    ON public.signals(direction);
CREATE INDEX signals_created_at_idx   ON public.signals(created_at DESC);
CREATE INDEX signals_tier_idx         ON public.signals(tier_required);
CREATE INDEX signals_created_by_idx   ON public.signals(created_by);

-- RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Free signals visible to all authenticated users
CREATE POLICY "signals_free_select"
  ON public.signals FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Free tier signals visible to everyone
      tier_required = 'free'
      -- Pro signals visible to pro + elite subscribers
      OR (tier_required = 'pro' AND public.get_user_tier(auth.uid()) IN ('pro', 'elite'))
      -- Elite signals visible to elite only
      OR (tier_required = 'elite' AND public.get_user_tier(auth.uid()) = 'elite')
      -- Admins and staff see all
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
      )
    )
  );

-- Only admins/staff can create signals
CREATE POLICY "signals_admin_insert"
  ON public.signals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "signals_admin_update"
  ON public.signals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Signal results: track TP/SL hits per signal (for partial close tracking)
CREATE TABLE IF NOT EXISTS public.signal_results (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id   UUID             NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  event       TEXT             NOT NULL, -- 'tp1_hit', 'tp2_hit', 'sl_hit', etc.
  price       NUMERIC(12,5)    NOT NULL,
  pips        NUMERIC(8,1),
  occurred_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX signal_results_signal_id_idx ON public.signal_results(signal_id);

ALTER TABLE public.signal_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signal_results_select"
  ON public.signal_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signals s
      WHERE s.id = signal_id AND (
        s.tier_required = 'free'
        OR (s.tier_required = 'pro' AND public.get_user_tier(auth.uid()) IN ('pro', 'elite'))
        OR (s.tier_required = 'elite' AND public.get_user_tier(auth.uid()) = 'elite')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
      )
    )
  );

CREATE POLICY "signal_results_admin_insert"
  ON public.signal_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Triggers
CREATE TRIGGER signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.signals TO authenticated;
GRANT SELECT ON public.signal_results TO authenticated;
