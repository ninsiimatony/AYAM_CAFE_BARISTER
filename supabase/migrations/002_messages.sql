-- ============================================================
-- Migration: 002_messages
-- Chat messages + AI configuration tables
-- ============================================================

-- 1. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID        NOT NULL,
  content         TEXT        NOT NULL,
  sender_type     TEXT        NOT NULL CHECK (sender_type IN ('customer', 'ai', 'staff')),
  staff_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read         BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_customer_id_idx      ON public.messages(customer_id);
CREATE INDEX messages_conversation_id_idx  ON public.messages(conversation_id);
CREATE INDEX messages_created_at_idx       ON public.messages(created_at DESC);

-- 2. AI configuration table (singleton: always id = 1)
CREATE TABLE IF NOT EXISTS public.ai_config (
  id                   INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  system_prompt        TEXT        NOT NULL,
  auto_reply_enabled   BOOLEAN     NOT NULL DEFAULT true,
  model                TEXT        NOT NULL DEFAULT 'gpt-4o-mini',
  temperature          FLOAT       NOT NULL DEFAULT 0.7,
  max_tokens           INT         NOT NULL DEFAULT 400,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by           UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default AI config row
INSERT INTO public.ai_config (id, system_prompt) VALUES (1,
  'You are Barista Bot ☕, the friendly AI assistant for Ayam Café Barister — a modern café in Uganda. Help customers with orders, menu questions, café info, and feedback. Be warm, concise (2-4 sentences), and empathetic. For complex issues or refunds, say: "I''m connecting you with a staff member right away 🙏". Menu highlights: Cappuccino 9,000 UGX, Latte 10,000 UGX, Espresso 7,000 UGX. Hours: Mon-Fri 7AM-10PM, Sat 8AM-11PM, Sun 9AM-8PM.'
) ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- 4. Messages RLS Policies

-- Customers can see their own messages
CREATE POLICY "Customers view own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = customer_id);

-- Staff and admins can view all messages
CREATE POLICY "Staff view all messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Customers can insert their own messages (customer sender)
CREATE POLICY "Customers insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND sender_type = 'customer'
  );

-- Staff and service role can insert AI/staff messages
CREATE POLICY "Staff insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Staff can mark messages as read
CREATE POLICY "Staff update messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 5. AI Config RLS Policies

-- Everyone can read AI config (to know if auto-reply is on)
CREATE POLICY "Anyone can view ai_config"
  ON public.ai_config FOR SELECT
  USING (true);

-- Only admins can update AI config
CREATE POLICY "Admins can update ai_config"
  ON public.ai_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Convenience view: one row per conversation with latest message
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
  m.conversation_id,
  m.customer_id,
  p.full_name  AS customer_name,
  p.email      AS customer_email,
  COUNT(*)     AS message_count,
  SUM(CASE WHEN m.is_read = false AND m.sender_type = 'customer' THEN 1 ELSE 0 END) AS unread_count,
  MAX(m.created_at) AS last_message_at,
  (
    SELECT content FROM public.messages
    WHERE conversation_id = m.conversation_id
    ORDER BY created_at DESC LIMIT 1
  ) AS last_message
FROM public.messages m
JOIN public.profiles p ON p.id = m.customer_id
GROUP BY m.conversation_id, m.customer_id, p.full_name, p.email;

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, UPDATE ON public.ai_config TO authenticated;

-- ============================================================
-- Usage: Run this in Supabase SQL Editor after 001_profiles.sql
-- ============================================================
