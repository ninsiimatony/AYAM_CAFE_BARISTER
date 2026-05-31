-- ============================================================
-- Migration: 008_journal
-- Trade journal — psychological + technical post-trade analysis
-- ============================================================

DO $$ BEGIN
  CREATE TYPE trader_emotion AS ENUM (
    'disciplined', 'confident', 'neutral', 'impatient',
    'fearful', 'greedy', 'fomo', 'revenge', 'overconfident'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE journal_rating AS ENUM ('1','2','3','4','5');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade_id        UUID            REFERENCES public.trades(id) ON DELETE SET NULL,
  signal_id       UUID            REFERENCES public.signals(id) ON DELETE SET NULL,

  -- Trade snapshot (denormalized so journal survives trade deletion)
  pair            TEXT            NOT NULL,
  direction       signal_direction NOT NULL,
  opened_at       TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  pips_result     NUMERIC(8,1),
  is_winner       BOOLEAN,

  -- SMC analysis
  setup_type      smc_pattern[],  -- patterns used
  bias_used       market_bias,
  timeframe_used  signal_timeframe,
  session_traded  market_session,
  confluence_met  BOOLEAN         DEFAULT false,

  -- Written analysis
  entry_reason    TEXT,           -- why did I enter?
  exit_reason     TEXT,           -- why did I exit?
  what_went_right TEXT,
  what_went_wrong TEXT,
  lessons         TEXT,
  improvements    TEXT,

  -- Psychology
  emotion_before  trader_emotion  DEFAULT 'neutral',
  emotion_during  trader_emotion  DEFAULT 'neutral',
  emotion_after   trader_emotion  DEFAULT 'neutral',
  followed_plan   BOOLEAN         DEFAULT true,
  revenge_trade   BOOLEAN         DEFAULT false,
  overtraded      BOOLEAN         DEFAULT false,
  execution_rating journal_rating DEFAULT '3',
  management_rating journal_rating DEFAULT '3',

  -- Media
  screenshots     JSONB           NOT NULL DEFAULT '[]',  -- [{url, caption}]
  tags            TEXT[]          NOT NULL DEFAULT '{}',

  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX journal_user_id_idx    ON public.journal_entries(user_id);
CREATE INDEX journal_trade_id_idx   ON public.journal_entries(trade_id);
CREATE INDEX journal_signal_id_idx  ON public.journal_entries(signal_id);
CREATE INDEX journal_pair_idx       ON public.journal_entries(pair);
CREATE INDEX journal_created_at_idx ON public.journal_entries(created_at DESC);
CREATE INDEX journal_is_winner_idx  ON public.journal_entries(is_winner);

-- RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_select_own"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "journal_insert_own"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_update_own"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "journal_delete_own"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER journal_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
