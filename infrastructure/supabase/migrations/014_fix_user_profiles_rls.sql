-- 014_fix_user_profiles_rls.sql
-- Fix incomplete RLS on user_profiles: add INSERT and DELETE policies
-- INSERT is handled by handle_new_user() trigger (security definer),
-- but we add a policy for safety. DELETE restricted to own profile.

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on user_profiles for delete
  using (auth.uid() = id);
