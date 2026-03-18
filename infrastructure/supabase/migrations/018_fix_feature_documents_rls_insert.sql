-- 018_fix_feature_documents_rls_insert.sql
-- Fix: ensure RLS allows INSERT/UPSERT into feature_documents
-- by adding WITH CHECK clause to the existing policy.

drop policy if exists "Users can manage own feature documents" on feature_documents;

create policy "Users can manage own feature documents"
  on feature_documents
  for all
  using (
    project_id in (select id from projects where user_id = auth.uid())
  )
  with check (
    project_id in (select id from projects where user_id = auth.uid())
  );

