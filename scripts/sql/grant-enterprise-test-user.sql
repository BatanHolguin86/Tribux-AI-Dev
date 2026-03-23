-- =============================================================================
-- INSTRUCCIONES
-- =============================================================================
-- "Success. No rows returned" en un UPDATE sin RETURNING es NORMAL en Supabase:
-- no devuelve tabla. Usa el UPDATE con RETURNING de abajo para ver si tocó filas.
-- Si RETURNING viene vacío → el email no coincide o no hay user_profiles (onboarding).
-- =============================================================================

-- (Opcional) Ver usuarios y si tienen perfil — ejecutar primero si dudas del email:
-- SELECT u.id, u.email, up.plan, up.subscription_status
-- FROM auth.users u
-- LEFT JOIN public.user_profiles up ON up.id = u.id
-- ORDER BY u.created_at DESC
-- LIMIT 25;

UPDATE public.user_profiles AS up
SET
  plan = 'enterprise',
  subscription_status = 'active',
  updated_at = now()
FROM auth.users AS u
WHERE up.id = u.id
  AND lower(u.email) = lower('REEMPLAZA_CON_TU_EMAIL@ejemplo.com')
RETURNING up.id, u.email, up.plan, up.subscription_status;

-- Si el RETURNING anterior no muestra ninguna fila: revisa el email o crea perfil (onboarding).
