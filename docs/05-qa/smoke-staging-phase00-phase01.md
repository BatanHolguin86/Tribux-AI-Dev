# Smoke test en staging — Phase 00 + Phase 01 (TASK-176)

**Objetivo:** Verificar en staging el flujo: crear proyecto → completar Phase 00 → entrar a Phase 01 → definir features → generar spec completo de un feature → aprobar.

**Entorno:** Staging (Vercel preview o proyecto dedicado) con Supabase staging y `ANTHROPIC_API_KEY` con créditos.

---

## 1. Prerrequisitos

- [ ] URL de staging configurada (ej. `https://ai-squad-xxx.vercel.app`)
- [ ] Usuario de prueba en Supabase staging (mismo que en auth)
- [ ] Migraciones 007 y 008 aplicadas en BD staging (`project_features`, `feature_documents`)
- [ ] Variable `ANTHROPIC_API_KEY` en Vercel (staging)
- [ ] Bucket `project-documents` en Supabase staging con políticas correctas

---

## 2. Checklist manual

### Crear proyecto

- [ ] Ir a `/dashboard` (o onboarding si es primera vez)
- [ ] Crear nuevo proyecto: nombre, industria, persona
- [ ] Comprobar que aparece en el dashboard y que Phase 00 está activa

### Completar Phase 00

- [ ] Entrar a Phase 00 del proyecto
- [ ] Ver las 5 secciones (Problem Statement, User Personas, Value Proposition, Success Metrics, Brief)
- [ ] En **Problem Statement**: escribir una respuesta y enviar; comprobar que el asistente responde (streaming)
- [ ] Generar documento: botón "Generar documento" y comprobar que aparece el contenido en el panel derecho
- [ ] Aprobar la sección
- [ ] Repetir para al menos **User Personas** (desbloqueada tras aprobar Problem Statement)
- [ ] Aprobar Phase 00 (gate final) y comprobar que Phase 01 se desbloquea

### Entrar a Phase 01 y definir features

- [ ] Navegar a Phase 01 (o desde dashboard)
- [ ] Ver resumen de Phase 00 y/o sugerencias de features
- [ ] Añadir al menos **un feature** (nombre + descripción opcional)
- [ ] Comprobar que el feature aparece en la lista y tiene indicadores [R][D][T]

### Generar spec completo de un feature

- [ ] Seleccionar el feature y abrir **Requirements**
- [ ] En el chat, responder a las preguntas del orquestador (al menos un intercambio)
- [ ] Pulsar **Generar documento** y comprobar que se genera el requirements
- [ ] **Aprobar** requirements
- [ ] Abrir **Design**, conversar y generar documento; aprobar
- [ ] Abrir **Tasks**, conversar y generar documento; aprobar
- [ ] Comprobar que el feature pasa a estado "spec completo" y que el gate final de Phase 01 permite aprobar

### Aprobar Phase 01

- [ ] Pulsar el botón de aprobación final de Phase 01 (con confirmación)
- [ ] Comprobar mensaje de éxito y que Phase 02 queda activa (o redirección correspondiente)

---

## 3. Ejecución automática (E2E)

Se puede ejecutar un smoke E2E contra local o staging:

```bash
# Local (con pnpm dev y auth configurado)
pnpm test:e2e tests/e2e/smoke-staging.authenticated.spec.ts

# Staging (mismo usuario de prueba debe existir en Supabase staging)
BASE_URL=https://tu-staging.vercel.app TEST_USER_EMAIL=... TEST_USER_PASSWORD=... pnpm test:e2e tests/e2e/smoke-staging.authenticated.spec.ts
```

El E2E comprueba carga de páginas clave y elementos mínimos; no sustituye el checklist manual para el flujo completo con IA.

---

## 4. Criterios de éxito (TASK-176)

- [ ] Crear proyecto en staging sin errores
- [ ] Completar Phase 00 (al menos 2 secciones con chat + generar + aprobar)
- [ ] Entrar a Phase 01 y ver lista de features
- [ ] Definir al menos un feature
- [ ] Generar requirements → design → tasks para ese feature y aprobar los tres
- [ ] Aprobar Phase 01 y ver Phase 02 activa
