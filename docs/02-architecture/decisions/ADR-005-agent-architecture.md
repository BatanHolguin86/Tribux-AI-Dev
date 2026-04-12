# ADR-005: Arquitectura de Agentes IA

**Status:** Accepted
**Fecha:** 2026-03-08
**Contexto:** Diseño de la arquitectura de los 8 agentes IA (CTO Virtual + 7 especializados)

---

## Decision

Implementar los agentes como **system prompts especializados sobre el mismo modelo** (Claude claude-sonnet-4-6), con inyeccion de contexto completo del proyecto y registro de agentes como configuracion estatica.

## Contexto

El producto necesita 8 "agentes" con personalidades y expertise diferentes:

1. CTO Virtual (orquestador general)
2. Product Architect
3. System Architect
4. UI/UX Designer
5. Lead Developer
6. DB Admin
7. QA Engineer
8. DevOps Engineer

Los agentes deben:

- Tener expertise diferenciada (respuestas distintas ante la misma pregunta)
- Conocer el contexto completo del proyecto
- Mantener historial de conversacion separado
- Ser extensibles (agregar nuevos agentes sin cambiar codigo)

## Opciones Evaluadas

| Criterio       |   System prompts unicos   | Fine-tuned models por agente | Multi-model (GPT + Claude) | LangChain agents |
| -------------- | :-----------------------: | :--------------------------: | :------------------------: | :--------------: |
| Costo          |      Bajo (1 modelo)      |           Muy alto           |           Medio            |       Bajo       |
| Diferenciacion | Alta (prompt engineering) |           Muy alta           |          Variable          |       Alta       |
| Complejidad    |           Baja            |             Alta             |            Alta            |    Media-Alta    |
| Latencia       |           Baja            |             Baja             |          Variable          |       Alta       |
| Extensibilidad |           Alta            |             Baja             |           Media            |      Media       |

## Justificacion

### Por que system prompts sobre un solo modelo

1. **Claude claude-sonnet-4-6 es suficientemente capaz** para emular distintos roles con system prompts bien diseñados. No se necesitan modelos fine-tuned.
2. **Costo predecible**: Una sola API key, un solo proveedor, facturacion simple.
3. **Latencia consistente**: Todos los agentes tienen la misma latencia base.
4. **Extensibilidad**: Agregar un nuevo agente = agregar un archivo con su system prompt + registrarlo en el indice.

### Estructura de un agente

```typescript
// src/lib/ai/agents/lead-developer.ts
export const leadDeveloper: AgentDefinition = {
  id: 'lead_developer',
  name: 'Lead Developer',
  icon: 'code',
  specialty: 'Implementacion, codigo, debugging, best practices',
  description: 'Experto en desarrollo con Next.js, TypeScript y Supabase...',
  planRequired: 'builder',
  systemPrompt: `
    ROL: Eres el Lead Developer del equipo Tribux.
    ESPECIALIDAD: Implementacion de features, codigo limpio, debugging...
    FORMATO: Code blocks con lenguaje, explicaciones paso a paso...
    ...
  `,
}
```

### Inyeccion de contexto

Cada llamada al agente incluye:

1. **System prompt del agente** (rol, expertise, instrucciones)
2. **Contexto del proyecto** (discovery, specs, fase actual)
3. **Historial del hilo** (mensajes previos de la conversacion)

```
Total context = system_prompt (~2K tokens)
              + project_context (~10-50K tokens)
              + conversation_history (~5-20K tokens)
              ≈ 17-72K tokens por llamada
```

Si el contexto total excede 100K tokens, se aplica truncamiento progresivo:

1. Resumir artifacts (menor prioridad)
2. Resumir specs de features no relacionados
3. Resumir discovery (mayor prioridad, nunca se elimina)

### Registro de agentes

```typescript
// src/lib/ai/agents/index.ts
export const AGENTS: Record<AgentType, AgentDefinition> = {
  cto_virtual: ctoVirtual,
  product_architect: productArchitect,
  system_architect: systemArchitect,
  ui_ux_designer: uiUxDesigner,
  lead_developer: leadDeveloper,
  db_admin: dbAdmin,
  qa_engineer: qaEngineer,
  devops_engineer: devopsEngineer,
}
```

## Consecuencias

**Positivas:**

- Setup simple — un archivo por agente, todo configuracion
- Agregar agentes no requiere cambios de infra ni DB
- Un solo proveedor de LLM simplifica monitoring y costos
- Misma latencia y capacidad para todos los agentes

**Negativas/Riesgos:**

- La diferenciacion depende 100% de prompt engineering (mitigable: iterar prompts con feedback de usuarios)
- Context window limitado a ~200K tokens — proyectos muy grandes podrian perder contexto (mitigable: truncamiento inteligente)
- Si Claude tiene downtime, todos los agentes caen (mitigable: Vercel AI SDK permite swap de provider)
