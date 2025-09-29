-- Seed a couple of sample notifications for demo
-- This assumes there is at least one user in auth.users and a mapped profile with hedera_accounts.user_id

-- Pick any existing hedera account's user_id as the target
WITH target AS (
  SELECT user_id
  FROM public.hedera_accounts
  WHERE user_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.notifications (user_id, type, channel, title, body, priority, metadata)
SELECT user_id, 'SYSTEM', 'IN_APP', 'Welcome to Direla', 'Your account is ready. Explore features and start transacting.', 'NORMAL', jsonb_build_object('cta', 'Get Started')
FROM target
ON CONFLICT DO NOTHING;

WITH target AS (
  SELECT user_id
  FROM public.hedera_accounts
  WHERE user_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO public.notifications (user_id, type, channel, title, body, priority, metadata)
SELECT user_id, 'BNPL_PAYMENT_DUE', 'IN_APP', 'BNPL payment due soon', 'Your BNPL installment is due in 2 days.', 'HIGH', jsonb_build_object('due_in_days', 2)
FROM target
ON CONFLICT DO NOTHING;


