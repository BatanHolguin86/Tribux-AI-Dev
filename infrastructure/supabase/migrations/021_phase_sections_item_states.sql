-- 021_phase_sections_item_states.sql
-- Per-checklist-item completion within a phase section (JSON map index -> boolean)

alter table phase_sections
  add column if not exists item_states jsonb not null default '{}'::jsonb;

comment on column phase_sections.item_states is 'Per-item checklist progress: keys are string indices "0","1", values boolean';
