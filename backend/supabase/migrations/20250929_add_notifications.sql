-- Notifications & Alerts schema for BNPL default alerts and general notifications
-- Safe-guarded with IF NOT EXISTS to allow re-runs

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'BNPL_DEFAULT',
    'BNPL_PAYMENT_DUE',
    'BNPL_PAYMENT_POSTED',
    'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'IN_APP',
    'WHATSAPP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) notifications table - single table design
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users.id (via RLS or soft constraint)
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'IN_APP',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  priority notification_priority NOT NULL DEFAULT 'NORMAL',
  related_bnpl_terms_id TEXT NULL, -- references bnpl_terms.id (stored as text/uuid depending on existing type)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_related_bnpl ON public.notifications(related_bnpl_terms_id);
-- 3) Convenience view for unread count (optional, safe create)
CREATE OR REPLACE VIEW public.v_user_unread_notifications AS
SELECT n.user_id, count(*) AS unread_count
FROM public.notifications n
WHERE n.read_at IS NULL AND n.archived_at IS NULL
GROUP BY n.user_id;

-- Minimal design: no deliveries/preferences tables, channels are captured on notification rows.

-- Note: RLS can be added later to restrict row access per user_id


