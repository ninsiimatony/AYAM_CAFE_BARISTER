-- ============================================================
-- Migration: 004_pos_system
-- Point of Sale: categories, products, tables, transactions
-- ============================================================

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_categories (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  color         TEXT        NOT NULL DEFAULT '#7b4116',
  icon          TEXT        NOT NULL DEFAULT '🍽️',
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_products (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL,
  description  TEXT,
  category_id  UUID         REFERENCES public.pos_categories(id) ON DELETE SET NULL,
  price        DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  image_url    TEXT,
  is_available BOOLEAN      NOT NULL DEFAULT true,
  stock_count  INTEGER,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Restaurant Tables ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_tables (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL UNIQUE,
  capacity     INTEGER NOT NULL DEFAULT 4,
  status       TEXT    NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available','occupied','reserved','cleaning')),
  location     TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Transactions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_transactions (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT          NOT NULL UNIQUE,
  table_id           UUID          REFERENCES public.pos_tables(id) ON DELETE SET NULL,
  cashier_id         UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  items              JSONB         NOT NULL DEFAULT '[]',
  subtotal           DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate           DECIMAL(5,4)  NOT NULL DEFAULT 0.0,
  tax_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  total              DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method     TEXT          NOT NULL
                       CHECK (payment_method IN ('cash','card','mobile_money','complimentary')),
  amount_paid        DECIMAL(12,2),
  change_amount      DECIMAL(12,2),
  status             TEXT          NOT NULL DEFAULT 'completed'
                       CHECK (status IN ('pending','completed','voided','refunded')),
  notes              TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.pos_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;

-- Categories: public read, staff write
CREATE POLICY "pos_categories_read"   ON public.pos_categories FOR SELECT USING (true);
CREATE POLICY "pos_categories_write"  ON public.pos_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Products: public read, staff write
CREATE POLICY "pos_products_read"    ON public.pos_products FOR SELECT USING (true);
CREATE POLICY "pos_products_write"   ON public.pos_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Tables: staff read & write
CREATE POLICY "pos_tables_read"      ON public.pos_tables FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY "pos_tables_write"     ON public.pos_tables FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Transactions: staff read, staff insert, admin full
CREATE POLICY "pos_tx_read"          ON public.pos_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY "pos_tx_insert"        ON public.pos_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY "pos_tx_admin"         ON public.pos_transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Triggers ─────────────────────────────────────────────────
CREATE TRIGGER set_pos_products_updated_at
  BEFORE UPDATE ON public.pos_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pos_tables_updated_at
  BEFORE UPDATE ON public.pos_tables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_pos_transactions_updated_at
  BEFORE UPDATE ON public.pos_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Grants ───────────────────────────────────────────────────
GRANT SELECT ON public.pos_categories   TO authenticated;
GRANT SELECT ON public.pos_products     TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pos_tables       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pos_transactions TO authenticated;

-- ── Seed: Categories ─────────────────────────────────────────
INSERT INTO public.pos_categories (name, color, icon, display_order) VALUES
  ('Coffee',      '#7b4116', '☕', 1),
  ('Tea',         '#5a3018', '🍵', 2),
  ('Cold Drinks', '#2c7a9e', '🧃', 3),
  ('Pastries',    '#c87020', '🥐', 4),
  ('Food',        '#2d8a4e', '🍽️', 5)
ON CONFLICT (name) DO NOTHING;

-- ── Seed: Products ───────────────────────────────────────────
INSERT INTO public.pos_products (name, description, category_id, price)
SELECT m.name, m.description, c.id, m.price
FROM (VALUES
  ('Espresso',          'Classic rich double shot',             'Coffee',      7000),
  ('Americano',         'Espresso topped with hot water',       'Coffee',      7000),
  ('Cappuccino',        'Espresso, steamed milk & velvety foam','Coffee',      9000),
  ('Latte',             'Espresso with lots of steamed milk',   'Coffee',     10000),
  ('Flat White',        'Double ristretto with silky microfoam','Coffee',      9000),
  ('Mocha',             'Espresso, chocolate & steamed milk',   'Coffee',     11000),
  ('Hot Chocolate',     'Rich Belgian chocolate blend',         'Coffee',      8000),
  ('Cold Brew',         '12-hour slow-steeped cold coffee',     'Coffee',     12000),
  ('Macchiato',         'Espresso marked with a dot of foam',   'Coffee',      8500),
  ('English Breakfast', 'Bold classic black tea',               'Tea',         6000),
  ('Green Tea',         'Light Japanese sencha',                'Tea',         6000),
  ('Chai Latte',        'Spiced masala tea with steamed milk',  'Tea',         8500),
  ('Herbal Tea',        'Rotating seasonal blend',              'Tea',         6000),
  ('Iced Latte',        'Espresso & milk over ice',             'Cold Drinks',11000),
  ('Frappuccino',       'Blended iced coffee',                  'Cold Drinks',13000),
  ('Mango Smoothie',    'Fresh mango blend',                    'Cold Drinks',10000),
  ('Fresh Juice',       'Daily seasonal fruits',                'Cold Drinks', 8000),
  ('Soda',              'Assorted canned sodas',                'Cold Drinks', 4000),
  ('Still Water',       'Chilled mineral water',                'Cold Drinks', 2000),
  ('Croissant',         'Buttery, flaky pastry',                'Pastries',    8000),
  ('Muffin',            'Blueberry or choc-chip',               'Pastries',    7000),
  ('Banana Bread',      'Moist homemade slice',                 'Pastries',    7500),
  ('Brownie',           'Dense chocolate fudge square',         'Pastries',    8000),
  ('Cheesecake',        'New York style, daily flavour',        'Pastries',   12000),
  ('Avocado Toast',     'Sourdough, smashed avo, poached egg',  'Food',       14000),
  ('Toast & Jam',       'Thick-cut toast with assorted jams',   'Food',        6000),
  ('Chicken Wrap',      'Grilled chicken, salad, sweet chilli', 'Food',       15000),
  ('Club Sandwich',     'Triple-decker with fries',             'Food',       16000),
  ('Caesar Salad',      'Romaine, croutons, parmesan',          'Food',       15000)
) AS m(name, description, category_name, price)
JOIN public.pos_categories c ON c.name = m.category_name;

-- ── Seed: Tables ─────────────────────────────────────────────
INSERT INTO public.pos_tables (table_number, capacity, location) VALUES
  (1,  2, 'Window'),  (2,  2, 'Window'),
  (3,  4, 'Main'),    (4,  4, 'Main'),
  (5,  4, 'Main'),    (6,  6, 'Main'),
  (7,  6, 'Main'),    (8,  8, 'Private'),
  (9,  2, 'Bar'),     (10, 2, 'Bar')
ON CONFLICT (table_number) DO NOTHING;

-- ============================================================
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================
