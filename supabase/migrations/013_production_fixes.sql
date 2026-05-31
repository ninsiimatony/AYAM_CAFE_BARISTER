-- ============================================================
-- Migration: 013_production_fixes
-- Fills gaps identified in production audit:
--   • Missing RLS DELETE/UPDATE policies on signals & signal_results
--   • Missing performance indexes on legacy café tables
--   • Stripe customer ID index on profiles
--   • signals_created_by index for JOINs
-- ============================================================

-- ─── signals: add explicit DELETE policy for admin/staff ─────────────────────
DO $$ BEGIN
  CREATE POLICY "signals_delete_admin"
    ON public.signals FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── signal_results: explicit UPDATE/DELETE for admin/staff ──────────────────
DO $$ BEGIN
  CREATE POLICY "signal_results_update_admin"
    ON public.signal_results FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "signal_results_delete_admin"
    ON public.signal_results FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── profiles: index stripe_customer_id for webhook lookups ──────────────────
-- (UNIQUE constraint already creates a unique index, but an explicit one is safer
--  if the constraint is ever changed)
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ─── profiles: index telegram_user_id for webhook lookups ────────────────────
CREATE INDEX IF NOT EXISTS profiles_telegram_user_id_idx
  ON public.profiles(telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

-- ─── signals: index created_by for JOIN performance ──────────────────────────
CREATE INDEX IF NOT EXISTS signals_created_by_idx
  ON public.signals(created_by);

-- ─── signals: composite index for feed queries (status + published_at) ───────
CREATE INDEX IF NOT EXISTS signals_status_published_idx
  ON public.signals(status, published_at DESC)
  WHERE published_at IS NOT NULL;

-- ─── journal_entries: compound index for user + date queries ─────────────────
CREATE INDEX IF NOT EXISTS journal_entries_user_created_idx
  ON public.journal_entries(user_id, created_at DESC);

-- ─── notifications: ensure idx covers the common mark-read pattern ────────────
-- Already exists from 012, but IF NOT EXISTS is safe to re-run
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, is_read)
  WHERE is_read = false;

-- ─── Legacy café tables: status indexes for query performance ────────────────
-- (Orders and reservations still used by the chat/ordering feature)
CREATE INDEX IF NOT EXISTS orders_status_idx       ON public.orders(status)       WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations(status) WHERE status IS NOT NULL;

-- ─── subscriptions: index for Stripe webhook lookups ─────────────────────────
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx
  ON public.subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx
  ON public.subscriptions(stripe_customer_id);

-- ─── Verify telegram_accounts can handle simultaneous token generation ─────────
-- The unique constraint (user_id) already handles concurrent token upserts.
-- This migration is idempotent and safe to re-run.
