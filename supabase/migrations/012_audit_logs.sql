-- ============================================================
-- Migration: 012_audit_logs
-- Immutable audit trail for all sensitive actions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              BIGSERIAL       PRIMARY KEY,
  user_id         UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT            NOT NULL,       -- e.g. 'signal.published', 'user.role_changed'
  resource_type   TEXT            NOT NULL,       -- e.g. 'signal', 'subscription', 'profile'
  resource_id     TEXT,                           -- UUID or other ID of affected resource
  old_value       JSONB,                          -- state before change
  new_value       JSONB,                          -- state after change
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB           NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes — optimize by time and action type (no update ever hits this table)
CREATE INDEX audit_logs_user_id_idx      ON public.audit_logs(user_id);
CREATE INDEX audit_logs_action_idx       ON public.audit_logs(action);
CREATE INDEX audit_logs_resource_idx     ON public.audit_logs(resource_type, resource_id);
CREATE INDEX audit_logs_created_at_idx   ON public.audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs
CREATE POLICY "audit_logs_admin_select"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can see audit logs for their own resources
CREATE POLICY "audit_logs_user_select"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- No authenticated INSERT — only service_role (API routes) can write logs.
-- This prevents users from injecting fake audit entries.

-- ─── Helper: write audit log from API routes ────────────────────────────────
-- Called from server-side API routes using the service role client
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_user_id     UUID,
  p_action      TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT    DEFAULT NULL,
  p_old_value   JSONB   DEFAULT NULL,
  p_new_value   JSONB   DEFAULT NULL,
  p_ip_address  INET    DEFAULT NULL,
  p_user_agent  TEXT    DEFAULT NULL,
  p_metadata    JSONB   DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, resource_type, resource_id,
    old_value, new_value, ip_address, user_agent, metadata
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_old_value, p_new_value, p_ip_address, p_user_agent, p_metadata
  );
END;
$$;

-- Rate limiting tracking (simple token-bucket via DB, replace with Redis in prod)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          BIGSERIAL   PRIMARY KEY,
  identifier  TEXT        NOT NULL,   -- IP or user_id
  endpoint    TEXT        NOT NULL,
  requests    INTEGER     NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (identifier, endpoint, window_start)
);

CREATE INDEX rate_limits_identifier_idx ON public.rate_limits(identifier, endpoint, window_start);

-- Notification preferences (for in-app notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,   -- 'signal_published', 'tp_hit', 'sl_hit', 'subscription_renewed'
  title       TEXT        NOT NULL,
  body        TEXT,
  data        JSONB       NOT NULL DEFAULT '{}',
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_id_idx   ON public.notifications(user_id);
CREATE INDEX notifications_unread_idx    ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX notifications_created_idx  ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (is_read = true)  -- can only mark as read, nothing else
  );

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
