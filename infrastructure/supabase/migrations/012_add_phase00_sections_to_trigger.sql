-- 012_add_phase00_sections_to_trigger.sql
-- Update the project creation trigger to also insert Phase 00 sections

create or replace function initialize_project_phases()
returns trigger as $$
declare
  i integer;
  sections text[] := array['problem_statement', 'personas', 'value_proposition', 'metrics', 'competitive_analysis'];
  sec text;
begin
  -- Create 8 project phases
  for i in 0..7 loop
    insert into project_phases (project_id, phase_number, status, started_at)
    values (
      new.id,
      i,
      case when i = 0 then 'active' else 'locked' end,
      case when i = 0 then now() else null end
    );
  end loop;

  -- Create 5 sections for Phase 00
  foreach sec in array sections loop
    insert into phase_sections (project_id, phase_number, section, status)
    values (
      new.id,
      0,
      sec,
      case when sec = 'problem_statement' then 'pending' else 'pending' end
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer;
