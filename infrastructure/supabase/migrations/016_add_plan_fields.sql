-- 016_add_plan_fields.sql
-- Add trial and subscription fields to user_profiles

alter table user_profiles
  add column trial_ends_at timestamptz,
  add column subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'free', 'canceled', 'past_due'));

-- Set trial_ends_at for existing users (7 days from now)
update user_profiles
  set trial_ends_at = now() + interval '7 days',
      subscription_status = 'trialing'
  where trial_ends_at is null;

-- Update the handle_new_user trigger to set trial_ends_at on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, full_name, trial_ends_at, subscription_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    now() + interval '7 days',
    'trialing'
  );
  return new;
end;
$$ language plpgsql security definer;
