# RLS Audit — AI Squad Command Center

**Fecha:** 2026-03-10
**Resultado:** PASS (1 gap corregido)

## Resumen

| Tabla | RLS | Policy | Cobertura | Estado |
|-------|-----|--------|-----------|--------|
| user_profiles | ON | 4 policies | SELECT, INSERT, UPDATE, DELETE | OK (fix en 014) |
| projects | ON | 1 policy (for all) | Completa | OK |
| project_phases | ON | 1 policy (for all) | Completa | OK |
| phase_sections | ON | 1 policy (for all) | Completa | OK |
| agent_conversations | ON | 1 policy (for all) | Completa | OK |
| project_documents | ON | 1 policy (for all) | Completa | OK |
| project_features | ON | 1 policy (for all) | Completa | OK |
| feature_documents | ON | 1 policy (for all) | Completa | OK |
| conversation_threads | ON | 1 policy (for all) | Completa | OK |
| design_artifacts | ON | 1 policy (for all) | Completa | OK |
| project_tasks | ON | 1 policy (for all) | Completa | OK |

## Patron de acceso

Todas las tablas de proyecto usan el mismo patron:
```sql
using (project_id in (select id from projects where user_id = auth.uid()))
```

Esto garantiza que un usuario solo accede a datos de sus propios proyectos.

## Gap corregido

**user_profiles** (migracion 014):
- Antes: solo SELECT + UPDATE
- Despues: SELECT + INSERT + UPDATE + DELETE
- INSERT ya estaba protegido via trigger `security definer`, pero la policy cierra el gap
- DELETE restringido a perfil propio

## Migraciones pendientes de aplicar

1. `013_create_project_tasks.sql` — Tabla de tasks para Kanban (Phase 04)
2. `014_fix_user_profiles_rls.sql` — Fix RLS en user_profiles
