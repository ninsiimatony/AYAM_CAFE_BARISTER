-- ============================================================
-- Migration: 015_menu_orders
-- Customer-facing menu ordering system.
-- Orders are inserted anonymously (no auth required).
-- Admin/staff can read all orders.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.menu_orders (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  kot_number      TEXT         NOT NULL UNIQUE,
  table_number    TEXT,
  items           JSONB        NOT NULL DEFAULT '[]',
  total           NUMERIC(10,3) NOT NULL DEFAULT 0,
  payment_method  TEXT         NOT NULL DEFAULT 'cash'
                               CHECK (payment_method IN ('cash', 'card')),
  comment         TEXT,
  status          TEXT         NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  whatsapp_sent   BOOLEAN      NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS menu_orders_created_at_idx  ON public.menu_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS menu_orders_status_idx      ON public.menu_orders(status)        WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX IF NOT EXISTS menu_orders_table_idx       ON public.menu_orders(table_number)  WHERE table_number IS NOT NULL;

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE TRIGGER set_menu_orders_updated_at
  BEFORE UPDATE ON public.menu_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.menu_orders ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated customers) may INSERT
CREATE POLICY "menu_orders_insert_public"
  ON public.menu_orders FOR INSERT
  WITH CHECK (true);

-- Admin and staff may read all orders
CREATE POLICY "menu_orders_select_staff"
  ON public.menu_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin and staff may update order status
CREATE POLICY "menu_orders_update_staff"
  ON public.menu_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT INSERT ON public.menu_orders TO anon;
GRANT SELECT, UPDATE ON public.menu_orders TO authenticated;
