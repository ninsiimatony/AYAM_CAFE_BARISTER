-- ──────────────────────────────────────────────
-- Orders placed via the AI assistant
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id  TEXT NOT NULL,
  items            JSONB NOT NULL DEFAULT '[]',
  total            INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  payment_method   TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Table reservations
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id  TEXT,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT,
  party_size       INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 20),
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Orders: customers see own, staff see all
CREATE POLICY "orders_customer_select" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "orders_customer_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "orders_staff_select" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

CREATE POLICY "orders_staff_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- Reservations: customers see own, staff see all
CREATE POLICY "reservations_customer_select" ON public.reservations
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "reservations_customer_insert" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "reservations_staff_select" ON public.reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

CREATE POLICY "reservations_staff_update" ON public.reservations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff','admin'))
  );

-- ──────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
