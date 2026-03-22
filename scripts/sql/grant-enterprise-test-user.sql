-- =============================================================================
-- INSTRUCCIONES (leer antes de ejecutar)
-- =============================================================================
-- 1. Abre Supabase → SQL Editor → New query.
-- 2. NO pegues la ruta del archivo (ej. "scripts/sql/..."). Eso NO es SQL.
-- 3. Copia SOLO el bloque UPDATE de abajo (desde "UPDATE" hasta el punto y coma).
-- 4. Cambia el email entre comillas por el tuyo.
-- 5. Run.
-- =============================================================================

UPDATE public.user_profiles AS up
SET
  plan = 'enterprise',
  subscription_status = 'active',
  updated_at = now()
FROM auth.users AS u
WHERE up.id = u.id
  AND lower(u.email) = lower('REEMPLAZA_CON_TU_EMAIL@ejemplo.com');

-- Comprobar resultado (opcional; ejecutar aparte):
-- SELECT u.email, up.plan, up.subscription_status
-- FROM public.user_profiles up
-- JOIN auth.users u ON u.id = up.id
-- WHERE lower(u.email) = lower('REEMPLAZA_CON_TU_EMAIL@ejemplo.com');
