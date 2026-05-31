-- ============================================================
-- Migration: 011_analytics
-- Performance analytics — daily snapshots + computed stats
-- Populated by a Supabase Edge Function cron job (daily at 00:05 UTC)
-- ============================================================

-- Daily performance snapshot per user
CREATE TABLE IF NOT EXISTS public.performance_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date       DATE        NOT NULL,
  mt5_account_id      UUID        REFERENCES public.mt5_accounts(id) ON DELETE SET NULL,

  -- Trade counts
  total_trades        INTEGER     NOT NULL DEFAULT 0,
  winning_trades      INTEGER     NOT NULL DEFAULT 0,
  losing_trades       INTEGER     NOT NULL DEFAULT 0,
  breakeven_trades    INTEGER     NOT NULL DEFAULT 0,

  -- Rate metrics
  win_rate            NUMERIC(6,3),    -- 0.000 to 100.000
  profit_factor       NUMERIC(8,3),    -- gross_profit / abs(gross_loss)

  -- Pip metrics
  total_pips          NUMERIC(10,1),
  avg_win_pips        NUMERIC(8,1),
  avg_loss_pips       NUMERIC(8,1),
  best_trade_pips     NUMERIC(8,1),
  worst_trade_pips    NUMERIC(8,1),
  largest_win_run     INTEGER,         -- consecutive winning trades
  largest_loss_run    INTEGER,

  -- P&L
  gross_profit        NUMERIC(14,2),
  gross_loss          NUMERIC(14,2),
  net_profit          NUMERIC(14,2),
  avg_win_amount      NUMERIC(12,2),
  avg_loss_amount     NUMERIC(12,2),

  -- Risk / drawdown
  max_drawdown        NUMERIC(14,2),
  max_drawdown_pct    NUMERIC(6,2),
  daily_drawdown      NUMERIC(14,2),
  daily_drawdown_pct  NUMERIC(6,2),

  -- Equity curve
  equity_start        NUMERIC(14,2),
  equity_end          NUMERIC(14,2),

  -- Pair breakdown (JSONB: { "EURUSD": { trades: 5, pips: 34.5, win_rate: 60 }, ... })
  pair_breakdown      JSONB       NOT NULL DEFAULT '{}',
  session_breakdown   JSONB       NOT NULL DEFAULT '{}',
  pattern_breakdown   JSONB       NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, snapshot_date, mt5_account_id)
);

CREATE INDEX perf_snap_user_id_idx   ON public.performance_snapshots(user_id);
CREATE INDEX perf_snap_date_idx      ON public.performance_snapshots(snapshot_date DESC);
CREATE INDEX perf_snap_mt5_idx       ON public.performance_snapshots(mt5_account_id);

-- RLS
ALTER TABLE public.performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perf_snap_select_own"
  ON public.performance_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "perf_snap_admin_select"
  ON public.performance_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only service role inserts snapshots (cron job)
-- No authenticated insert policy → service_role bypasses RLS

-- ─── Computed stats view (last 30 days) ────────────────────────────────────────
CREATE OR REPLACE VIEW public.user_stats_30d AS
SELECT
  user_id,
  COUNT(*)                                       AS trading_days,
  SUM(total_trades)                              AS total_trades,
  SUM(winning_trades)                            AS winning_trades,
  SUM(losing_trades)                             AS losing_trades,
  ROUND(AVG(win_rate), 2)                        AS avg_win_rate,
  ROUND(SUM(net_profit), 2)                      AS net_profit_30d,
  ROUND(SUM(total_pips), 1)                      AS total_pips_30d,
  ROUND(AVG(profit_factor), 3)                   AS avg_profit_factor,
  ROUND(MAX(max_drawdown_pct), 2)                AS max_drawdown_pct_30d,
  MIN(equity_end)                                AS equity_low,
  MAX(equity_end)                                AS equity_high
FROM public.performance_snapshots
WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- Platform-wide signal performance view
CREATE OR REPLACE VIEW public.signal_performance AS
SELECT
  pair,
  COUNT(*)                                                    AS total_signals,
  COUNT(*) FILTER (WHERE status IN ('tp1_hit','tp2_hit','tp3_hit')) AS wins,
  COUNT(*) FILTER (WHERE status = 'sl_hit')                   AS losses,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('tp1_hit','tp2_hit','tp3_hit'))::NUMERIC
    / NULLIF(COUNT(*) FILTER (WHERE status IN ('tp1_hit','tp2_hit','tp3_hit','sl_hit')), 0) * 100,
    1
  )                                                           AS win_rate_pct,
  ROUND(AVG(result_pips) FILTER (WHERE result_pips IS NOT NULL), 1) AS avg_pips,
  ROUND(SUM(result_pips) FILTER (WHERE result_pips IS NOT NULL), 1) AS total_pips,
  ROUND(AVG(risk_reward_1), 2)                                AS avg_rr,
  MAX(published_at)                                           AS last_signal_at
FROM public.signals
WHERE published_at IS NOT NULL
GROUP BY pair;

GRANT SELECT ON public.performance_snapshots TO authenticated;
GRANT SELECT ON public.user_stats_30d TO authenticated;
GRANT SELECT ON public.signal_performance TO authenticated;
