-- 011_create_updated_at_triggers.sql

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on user_profiles
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on projects
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_phases
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on phase_sections
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on agent_conversations
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_documents
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on project_features
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on feature_documents
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on conversation_threads
  for each row execute procedure update_updated_at();
create trigger set_updated_at before update on design_artifacts
  for each row execute procedure update_updated_at();
