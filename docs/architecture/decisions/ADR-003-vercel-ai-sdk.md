# ADR-003: Vercel AI SDK para Streaming de LLM

**Status:** Accepted
**Fecha:** 2026-03-08
**Contexto:** Definicion de la estrategia de integracion con la API de Anthropic para chat con agentes

---

## Decision

Usar **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) para todas las interacciones con Claude, tanto en server (Route Handlers) como en client (React hooks).

## Contexto

El producto requiere:
- Streaming de respuestas token-by-token en la UI
- Multiples puntos de chat (Phase 00, Phase 01, Agentes libres)
- Manejo de historial de mensajes en memoria y persistencia
- Capacidad de detener generacion en curso
- Soporte para multiples modelos si se cambia proveedor en el futuro

## Opciones Evaluadas

| Criterio | Vercel AI SDK | Anthropic SDK directo | LangChain.js |
|----------|:---:|:---:|:---:|
| Streaming built-in | ✓ (`streamText`) | ✓ (manual SSE) | ✓ |
| React hooks | ✓ (`useChat`) | ✗ | ✗ |
| Provider-agnostic | ✓ (swap model) | ✗ (Anthropic only) | ✓ |
| Bundle size | Pequeno | Pequeno | Grande |
| Abort/stop support | ✓ | Manual | ✓ |
| Complejidad | Baja | Media | Alta |

## Justificacion

Vercel AI SDK ofrece:
1. **`streamText()`** en el servidor — une modelo + prompt + mensajes y retorna un stream listo para SSE
2. **`useChat()`** en el cliente — maneja mensajes, input, loading state, abort y persistencia en memoria
3. **Provider swap** — cambiar de Claude a GPT o Gemini requiere solo cambiar la instancia del modelo, no la logica
4. **`.toDataStreamResponse()`** — convierte el stream a la Response de Route Handler sin boilerplate

Usar el SDK de Anthropic directamente requeriria implementar SSE manual, estado de mensajes en el cliente y abort logic. LangChain agrega complejidad innecesaria para el caso de uso actual.

## Implementacion

```typescript
// Server: Route Handler
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = streamText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  messages: conversationHistory,
  maxTokens: 4096,
})
return result.toDataStreamResponse()

// Client: React Component
import { useChat } from 'ai/react'

const { messages, input, handleSubmit, isLoading, stop } = useChat({
  api: `/api/projects/${id}/phases/0/chat`,
  body: { section },
  onFinish: (msg) => persistToSupabase(msg),
})
```

## Consecuencias

**Positivas:**
- Streaming funcional en < 50 lineas de codigo
- Cambio de proveedor de LLM sin reescribir logica de chat
- `useChat` maneja UX completa (loading, abort, retry) out-of-the-box

**Negativas/Riesgos:**
- Dependencia en Vercel AI SDK (mitigable: es open source, API estable)
- `useChat` maneja mensajes en memoria — se requiere persistencia manual a Supabase en `onFinish`
