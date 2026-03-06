# Constraints — AI Squad Command Center

**Version:** 1.0
**Fecha:** 2026-03-06
**Status:** Pendiente aprobacion CEO/CPO

---

## 1. Constraints Tecnicos

### Stack y Compatibilidad
- **C-TECH-01:** El producto debe construirse sobre el stack definido en CLAUDE.md: Next.js 14+ (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Supabase, Vercel. No se puede cambiar el stack sin una ADR aprobada.
- **C-TECH-02:** Todo el codigo debe ser TypeScript con `strict: true`. Prohibido el uso de `any` — usar `unknown` con narrowing explicitamente.
- **C-TECH-03:** El sistema debe funcionar correctamente en los ultimos 2 major versions de Chrome, Firefox, Safari y Edge.
- **C-TECH-04:** El frontend debe ser completamente funcional en mobile (min 375px de ancho) — mobile-first por convencion de Tailwind.
- **C-TECH-05:** El package manager es `pnpm` en todas las instalaciones. No usar npm ni yarn.

### IA y LLM
- **C-TECH-06:** El proveedor de LLM para MVP es Anthropic (Claude claude-sonnet-4-6). Cambio de proveedor requiere ADR aprobada.
- **C-TECH-07:** Todas las llamadas al LLM deben realizarse desde Server-side Route Handlers — jamas desde el cliente. Las API keys de Anthropic nunca se exponen al browser.
- **C-TECH-08:** El contexto maximo del proyecto inyectado en cada conversacion con un agente no puede superar 100,000 tokens (limite del modelo). El sistema debe comprimir o resumir documentos si el proyecto excede este limite.
- **C-TECH-09:** El sistema debe implementar streaming de respuestas del LLM via Vercel AI SDK. No se aceptan respuestas bloqueantes que esperen el texto completo.
- **C-TECH-10:** El sistema debe manejar rate limits de la API de Anthropic con retry exponencial (max 3 intentos) y notificacion al usuario si falla.

### Base de Datos
- **C-TECH-11:** RLS (Row Level Security) debe estar habilitado en TODAS las tablas de Supabase que contienen datos de usuario. No existe excepcion sin aprobacion explicita.
- **C-TECH-12:** Las migraciones de base de datos deben ser numeradas secuencialmente (001_, 002_) y nunca destructivas — solo additive migrations en produccion.
- **C-TECH-13:** No se puede usar `service_role` key en el cliente — solo en server-side con variables de entorno privadas.
- **C-TECH-14:** Los documentos del proyecto (markdown files) se almacenan en Supabase Storage, no en columnas de texto en la base de datos, para evitar limitaciones de tamano.

### Performance
- **C-TECH-15:** El bundle de JavaScript del cliente no puede superar 150KB gzipped en la carga inicial. Usar dynamic imports para modulos grandes.
- **C-TECH-16:** Las imagenes deben servirse con `next/image` con optimizacion automatica (WebP, lazy loading).
- **C-TECH-17:** El LCP (Largest Contentful Paint) no puede superar 2.5s en condiciones de conexion 4G simulada.

### CI/CD y Calidad
- **C-TECH-18:** No se puede hacer merge a `main` sin que pasen los checks de CI: linting (ESLint), type-check (tsc), y tests unitarios (Vitest).
- **C-TECH-19:** Los secrets y variables de entorno nunca se commitean al repositorio. Usar `.env.local` localmente y el panel de Vercel en produccion.
- **C-TECH-20:** Cada Pull Request debe referenciar al menos un spec KIRO aprobado o una ADR si introduce cambios arquitectonicos.

---

## 2. Constraints de Negocio

### Tiempo y Recursos
- **C-BIZ-01:** El MVP debe estar en produccion y disponible para primeros usuarios en un maximo de 12 semanas desde el inicio de Phase 03 (Environment Setup).
- **C-BIZ-02:** El equipo de desarrollo del MVP es el AI Squad (agentes IA) orquestado por el CEO/CPO. No hay headcount humano tecnico en Phase 03–06 del MVP.
- **C-BIZ-03:** El presupuesto mensual de infraestructura para el MVP no puede superar $200/mes hasta alcanzar $5k MRR. Stack elegido: Vercel Hobby/Pro ($0–$20), Supabase Free/Pro ($0–$25), Anthropic API ($50–$100 estimado para usuarios beta), Resend ($0–$20).

### Pricing y Modelo de Negocio
- **C-BIZ-04:** El producto debe lanzar con minimo 2 planes de precio (Starter y Builder). El plan Agency puede lanzar en v1.1.
- **C-BIZ-05:** No existe plan gratuito en v1.0 MVP. El acceso es de pago desde el primer dia — validar willingness to pay desde el lanzamiento.
- **C-BIZ-06:** El precio minimo del plan Starter es $99/mes. No se puede bajar de este umbral sin aprobacion del CEO/CPO — costo de la API de Anthropic por usuario activo lo hace inviable por debajo de este precio.

### Mercado y Posicionamiento
- **C-BIZ-07:** El MVP se lanza exclusivamente en mercado hispanohablante (LATAM + Espana). No se aceptan funcionalidades exclusivas para otros mercados en v1.0.
- **C-BIZ-08:** El producto no puede posicionarse como un generador de codigo o un IDE con IA — el diferenciador es la metodologia y el proceso, no la generacion de codigo per se.
- **C-BIZ-09:** El nombre "AI Squad Command Center" y la marca deben ser consistentes en todos los touchpoints del producto desde el MVP.

### Legal y Contractual
- **C-BIZ-10:** Los Terminos de Servicio y Politica de Privacidad deben estar publicados antes del lanzamiento publico. No se puede lanzar sin estos documentos.
- **C-BIZ-11:** El uso de la API de Anthropic debe cumplir con los Usage Policies de Anthropic. En particular: no facilitar generacion de contenido dañino, no almacenar conversaciones con PII sin consentimiento explicito.
- **C-BIZ-12:** La plataforma no puede almacenar ni procesar datos de salud (HIPAA) ni datos financieros sensibles (PCI-DSS) de los proyectos de los usuarios en v1.0 — esto requiere compliance adicional no contemplado en el MVP.

---

## 3. Constraints Regulatorios y de Privacidad

### GDPR / Proteccion de Datos
- **C-REG-01:** Aunque el mercado primario es LATAM, la plataforma debe ser compatible con GDPR desde el inicio dado que incluye Espana (UE) en el mercado objetivo.
- **C-REG-02:** El sistema debe proveer mecanismo de eliminacion de cuenta y todos los datos asociados (derecho al olvido) en un plazo maximo de 30 dias.
- **C-REG-03:** Los datos de usuarios no pueden transferirse a terceros sin consentimiento explicito. El unico tercero que procesa datos de usuario es Anthropic (via API) — debe estar declarado en la Politica de Privacidad.
- **C-REG-04:** Las conversaciones con los agentes IA contienen potencialmente informacion de negocio sensible. El sistema debe aclarar en los Terminos de Servicio como se manejan y retienen estas conversaciones.
- **C-REG-05:** Se debe implementar un banner de cookies con opt-in para analytics (Vercel Analytics) en paises donde aplica GDPR.

### Ley de Proteccion de Datos LATAM
- **C-REG-06:** La plataforma debe cumplir con la Ley 1581 de Colombia, Ley Federal de Proteccion de Datos de Mexico, y la LGPD de Brasil en lo que respecta a consentimiento y almacenamiento de datos personales.
- **C-REG-07:** El aviso de privacidad debe estar disponible en espanol en todo momento y ser accesible sin necesidad de autenticarse.

### Accesibilidad
- **C-REG-08:** El producto debe cumplir WCAG 2.1 nivel AA en todas las paginas y flujos criticos (auth, onboarding, dashboard, fases) antes del lanzamiento publico.

---

## 4. Constraints de UX y Producto

### Experiencia del Usuario
- **C-UX-01:** Ningun flujo critico (registro → onboarding → Phase 00 → Phase 01) puede requerir mas de 4 clics para llegar al primer momento de valor (ver algo generado por la IA).
- **C-UX-02:** El lenguaje de la interfaz debe ser accesible para personas sin conocimiento tecnico. Prohibido usar jerga tecnica en textos de UI sin explicacion contextual.
- **C-UX-03:** Todos los estados de carga de la IA deben tener feedback visual claro — el usuario siempre debe saber que el sistema esta trabajando.
- **C-UX-04:** El flujo de onboarding no puede superar 5 minutos de completacion promedio — si los tests de usabilidad muestran que tarda mas, se simplifica.
- **C-UX-05:** El sistema no puede mostrar mensajes de error tecnicos (stack traces, codigos de error internos) al usuario final — siempre mensajes en lenguaje natural con accion sugerida.

### Calidad de Output de IA
- **C-UX-06:** Los documentos generados por el orquestador deben estar en espanol (es-LATAM) por defecto — el codigo y comentarios tecnicos en ingles.
- **C-UX-07:** El orquestador debe siempre presentar el output como propuesta para aprobacion del usuario, nunca como decision tomada. El humano siempre aprueba antes de avanzar.
- **C-UX-08:** Si el orquestador no tiene suficiente contexto para generar un documento de calidad, debe pedir mas informacion al usuario — jamas generar contenido vago o generico sin advertir al usuario.

---

## 5. Resumen de Constraints Criticos

Los siguientes constraints son no negociables y su incumplimiento bloquea el lanzamiento:

| ID | Constraint | Categoria |
|----|-----------|-----------|
| C-TECH-07 | API keys del LLM nunca en el cliente | Seguridad |
| C-TECH-11 | RLS en todas las tablas Supabase | Seguridad |
| C-TECH-18 | CI checks deben pasar antes de merge a main | Calidad |
| C-TECH-19 | Secrets nunca en el repositorio | Seguridad |
| C-BIZ-01 | MVP en produccion en 12 semanas | Tiempo |
| C-BIZ-10 | TOS y Privacy Policy publicados antes del launch | Legal |
| C-REG-02 | Mecanismo de eliminacion de cuenta operativo | GDPR |
| C-REG-08 | WCAG 2.1 AA en flujos criticos | Accesibilidad |
| C-UX-07 | El humano siempre aprueba antes de avanzar | Producto |
