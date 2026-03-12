# Aplicar migraciones en staging (TASK-174)

Para que Phase 01 (KIRO) funcione en staging, la base de datos de Supabase **staging** debe tener las tablas `project_features` y `feature_documents` (migraciones 007 y 008).

---

## Opción A: Supabase Dashboard (SQL Editor)

1. Abre el proyecto **staging** en [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor.
2. Ejecuta en este orden:

**Migración 007 — `project_features`**

Copia y ejecuta el contenido de:

`infrastructure/supabase/migrations/007_create_project_features.sql`

**Migración 008 — `feature_documents`**

Copia y ejecuta el contenido de:

`infrastructure/supabase/migrations/008_create_feature_documents.sql`

3. Comprueba que no haya errores (por ejemplo, "relation already exists" si ya estaban aplicadas).

---

## Opción B: Supabase CLI

Con el CLI enlazado al proyecto de staging:

```bash
# Enlazar a staging (si usas un proyecto distinto a producción)
supabase link --project-ref <STAGING_PROJECT_REF>

# Aplicar migraciones pendientes (incluye 007 y 008 si no están)
supabase db push
```

O aplicar solo 007 y 008:

```bash
psql "$DATABASE_URL_STAGING" -f infrastructure/supabase/migrations/007_create_project_features.sql
psql "$DATABASE_URL_STAGING" -f infrastructure/supabase/migrations/008_create_feature_documents.sql
```

---

## Verificación

En SQL Editor de staging:

```sql
select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'project_features');
select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'feature_documents');
```

Ambas deben devolver `true`. Después de esto, el smoke test (TASK-176) puede ejecutarse contra staging.
