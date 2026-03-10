# ADR-006: Capa de abstracción para proveedores de LLM

**Status:** Accepted
**Fecha:** 2026-03-09
**Contexto:** Permitir alternar entre Anthropic y OpenAI (u otros) sin reescribir la lógica de chat

---

## Decisión

Introducir una capa de abstracción en `src/lib/ai/models.ts` que resuelva el modelo por defecto según la variable de entorno `AI_PROVIDER`. El resto del código (Route Handlers, prompts) consume `defaultModel` desde `@/lib/ai/anthropic`, que internamente usa `getDefaultModel()`.

## Contexto

- El producto usa Claude (Anthropic) como proveedor principal.
- Eventos como saldo insuficiente, límites o preferencias de coste pueden motivar cambiar de proveedor.
- Vercel AI SDK ya es provider-agnostic: `streamText({ model, ... })` acepta cualquier `LanguageModelV1`.

## Implementación

```
src/lib/ai/
├── models.ts      # getDefaultModel() — lee AI_PROVIDER, retorna modelo
├── anthropic.ts   # re-exporta defaultModel = getDefaultModel() + AI_CONFIG
└── chat-errors.ts # manejo de errores (incl. créditos insuficientes)
```

### Uso

```bash
# .env.local
AI_PROVIDER=anthropic   # default
# AI_PROVIDER=openai    # requiere @ai-sdk/openai y OPENAI_API_KEY
```

### Añadir nuevo proveedor

1. Instalar el adapter: `pnpm add @ai-sdk/openai` (o el que corresponda).
2. En `models.ts`, añadir un `case` en `getDefaultModel()`.
3. Configurar la API key correspondiente en `.env.local`.

## Consecuencias

- **Positivas:** Un solo punto de cambio para el modelo; permite fallback o A/B por entorno.
- **Neutras:** `anthropic.ts` sigue siendo el módulo público; la abstracción queda oculta.
- **Riesgo:** OpenAI usa `require()` lazy para no aumentar el bundle cuando no se usa; en edge puede exigir configurar `external` si hay problemas.
