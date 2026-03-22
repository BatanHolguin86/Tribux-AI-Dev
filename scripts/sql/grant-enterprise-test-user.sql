-- Grant full plan (enterprise + active) for a test user — run in Supabase SQL Editor.
-- Replace the email with yours. Requires existing row in public.user_profiles (after onboarding).

update public.user_profiles up
set
  plan = 'enterprise',
  subscription_status = 'active',
  updated_at = now()
from auth.users u
where up.id = u.id
  and lower(u.email) = lower('tu-email@ejemplo.com');

-- Verify:
-- select id, plan, subscription_status from public.user_profiles;
