# Backoffice de control financiero — Tribux AI

**Objetivo:** Panel para el administrador financiero del producto: costes de IA por cliente, márgenes y base para precios enterprise.

---

## Acceso

- **URL:** `/admin/finance` (dentro del dashboard).
- **Quién:** Solo usuarios con rol `financial_admin` o `super_admin` en `user_profiles`.
- **Cómo dar acceso:** En Supabase (SQL) ejecutar:
  ```sql
  update user_profiles set role = 'financial_admin' where id = 'UUID_DEL_USUARIO';
  ```
  Para asignar por email (si tienes el id):
  ```sql
  update user_profiles set role = 'financial_admin'
  where id = (select id from auth.users where email = 'admin@ejemplo.com');
  ```

---

## Funcionalidad

1. **Resumen (`/admin/finance`)**
   - Listado de todos los usuarios con: nombre, plan, estado de suscripción, coste IA del mes actual, coste del mes anterior, precio del plan, margen bruto (%), tokens in/out del mes.
   - Filtro por mes (selector de mes).
   - Resumen global: total usuarios, coste IA del mes, coste mes anterior, ingresos (activos + trial).
   - Enlace a detalle por usuario.

2. **Detalle por usuario (`/admin/finance/users/[userId]`)**
   - Perfil: plan, estado, precio del plan.
   - Coste IA total histórico.
   - Desglose por mes: coste, tokens in/out, número de eventos.
   - Desglose por tipo de evento: agent_chat, phase00_chat, phase00_generate, etc., con coste, llamadas y tokens.
   - Listado de últimos eventos (hasta 100) con fecha, tipo, modelo, tokens y coste.

---

## Datos de uso (costes)

- Los costes se registran en la tabla **`ai_usage_events`** (migración `017_ai_usage_and_admin_role.sql`).
- Cada llamada a IA que registre uso inserta: `user_id`, `project_id` (opcional), `event_type`, `model`, `input_tokens`, `output_tokens`, `estimated_cost_usd`.
- El coste se calcula con los precios de referencia de Claude Sonnet (ver `docs/00-discovery/06-plan-financiero-unit-economics.md`).
- Actualmente se registra uso en:
  - **Chat de agentes** (mensaje de usuario → respuesta del agente).
- Pendiente de integrar en el resto de rutas que usan IA (Phase 00/01/02 chat y generate, diseños, títulos, sugerencias) para tener el coste completo por cliente.

---

## Uso para precios enterprise

- Con el detalle por cliente puedes ver el coste real de IA por usuario y por mes.
- Comparando coste vs precio del plan obtienes el margen por cuenta.
- Para ofertas **enterprise** (plan custom), el backoffice permite:
  - Revisar el histórico de uso del cliente antes de fijar precio.
  - Ajustar precios o límites según coste observado.
  - Documentar costes por cliente para facturación o reporting interno.

---

## Seguridad

- RLS en `ai_usage_events`: solo `financial_admin` y `super_admin` pueden leer; solo el propio usuario puede insertar filas con su `user_id` (la API inserta en nombre del usuario autenticado).
- RLS en `user_profiles`: los financial admins pueden leer todos los perfiles para el listado; el resto de políticas (ver/actualizar propio perfil) se mantienen.
