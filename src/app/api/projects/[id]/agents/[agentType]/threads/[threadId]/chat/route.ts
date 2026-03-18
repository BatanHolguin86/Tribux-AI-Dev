import { generateText, streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { buildFullProjectContext } from '@/lib/ai/context-builder'
import { buildAgentPrompt } from '@/lib/ai/agents/prompt-builder'
import { generateThreadTitle } from '@/lib/ai/title-generator'
import { formatChatErrorResponse } from '@/lib/ai/chat-errors'
import { recordAiUsage, estimateTokensFromText } from '@/lib/ai/usage'
import { uploadChatAttachment } from '@/lib/storage/chat-attachments'
import { canUseAgent } from '@/lib/plans/guards'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'
import { AGENT_MAP } from '@/lib/ai/agents'
import type { AgentType } from '@/types/agent'

export const maxDuration = 60

function extractTextFromMessage(message: any): string {
  if (!message) return ''

  if (typeof message.content === 'string') {
    return message.content
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p && p.type === 'text' && typeof p.text === 'string')
      .map((p: any) => p.text)
      .join('')
  }

  if (typeof message.text === 'string') {
    return message.text
  }

  return ''
}

async function parseJsonBody(request: Request): Promise<{ messages?: unknown[] } | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function parseFormDataBody(
  request: Request,
): Promise<{ messages?: unknown[]; files: File[] } | null> {
  try {
    const formData = await request.formData()
    const messagesRaw = formData.get('messages')
    const files: File[] = []

    for (const value of formData.getAll('attachments')) {
      if (value instanceof File) {
        files.push(value)
      }
    }

    if (!messagesRaw || typeof messagesRaw !== 'string') {
      return { messages: [], files }
    }

    const parsed = JSON.parse(messagesRaw)
    return {
      messages: Array.isArray(parsed) ? parsed : [],
      files,
    }
  } catch {
    return null
  }
}

function buildAttachmentsSummary(attachments: Array<Record<string, unknown>>): string | undefined {
  if (!attachments.length) return undefined

  const lines = attachments
    .slice(-5)
    .map((att, idx) => {
      const filename = (att.filename as string | undefined) ?? `archivo-${idx + 1}`
      const mime = (att.mimeType as string | undefined) ?? 'tipo-desconocido'
      const size = att.size as number | undefined
      const sizeLabel =
        typeof size === 'number' ? `${(size / 1024).toFixed(1)} KB` : 'tamano-desconocido'
      return `- ${filename} (${mime}, ${sizeLabel})`
    })

  return lines.join('\n')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; agentType: string; threadId: string }> },
) {
  try {
    const { id: projectId, agentType, threadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const userId = user.id

    // Plan guard: check agent access
    const agentMeta = AGENT_MAP[agentType as AgentType]
    if (agentMeta) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('plan, subscription_status, trial_ends_at')
        .eq('id', user.id)
        .single()

      if (!profile || !canUseAgent(agentType, agentMeta.planRequired, profile)) {
        return NextResponse.json(
          { error: 'plan_required', message: 'Tu plan no incluye acceso a este agente. Upgrade para continuar.' },
          { status: 403 },
        )
      }
    }

    // Rate limit
    const chatIp = getClientIp(request)
    const chatRateLimitKey = `agent-chat:${user.id}:${chatIp}`
    const chatRateResult = checkRateLimit(chatRateLimitKey, AGENT_CHAT_RATE_LIMIT)
    if (!chatRateResult.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Has alcanzado el limite de mensajes por hora. Intenta mas tarde.' },
        { status: 429 },
      )
    }

    // Get thread messages and attachments
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('messages, message_count, attachments')
      .eq('id', threadId)
      .single()

    if (threadError) {
      console.error('[Agents chat] Thread fetch error', threadError)
      return NextResponse.json(
        {
          error: 'thread_error',
          message:
            threadError.code === 'PGRST116'
              ? 'Hilo no encontrado. Crea una nueva conversación e inténtalo de nuevo.'
              : 'No se pudo cargar la conversación. Intenta de nuevo.',
        },
        { status: threadError.code === 'PGRST116' ? 404 : 500 },
      )
    }

    if (!thread) {
      return NextResponse.json(
        {
          error: 'thread_not_found',
          message: 'Hilo no encontrado. Crea una nueva conversación e inténtalo de nuevo.',
        },
        { status: 404 },
      )
    }

    // Parse incoming message from AI SDK useChat transport
    const contentType = request.headers.get('content-type') ?? ''
    let incomingMessages: unknown[] = []
    let incomingFiles: File[] = []

    if (contentType.includes('multipart/form-data')) {
      const body = await parseFormDataBody(request)
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Cuerpo de la petición inválido.' },
          { status: 400 },
        )
      }
      incomingMessages = Array.isArray(body.messages) ? body.messages : []
      incomingFiles = body.files ?? []
    } else {
      const body = await parseJsonBody(request)
      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Cuerpo de la petición inválido.' },
          { status: 400 },
        )
      }
      incomingMessages = Array.isArray(body.messages) ? body.messages : []
    }

    const lastMsg = incomingMessages[incomingMessages.length - 1]
    if (!lastMsg) {
      return NextResponse.json(
        { error: 'No message', message: 'No se envió ningún mensaje.' },
        { status: 400 },
      )
    }

    const userMessage = extractTextFromMessage(lastMsg)
    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'Empty message', message: 'El mensaje no puede estar vacío.' },
        { status: 400 },
      )
    }

    // Build full message history
    const existingMessages = (thread.messages as Array<{ role: string; content: string }>) ?? []
    const existingAttachments =
      (thread.attachments as Array<Record<string, unknown>>) ?? []
    const allMessages = [
      ...existingMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ]

    const now = new Date().toISOString()

    // Upload any incoming attachments and extend metadata
    const newAttachments =
      incomingFiles.length > 0
        ? await Promise.all(
            incomingFiles.map((file) =>
              uploadChatAttachment(projectId, threadId, file),
            ),
          )
        : []

    const allAttachments = [...existingAttachments, ...newAttachments]

    // Build context and prompt (including summary of recent attachments)
    const projectContext = await buildFullProjectContext(projectId)
    const attachmentsSummary = buildAttachmentsSummary(allAttachments)
    let systemPrompt = buildAgentPrompt(agentType as AgentType, {
      ...projectContext,
      attachmentsSummary,
    })

    // CTO orchestration (Option B):
    // On first thread message, consult specialists internally (no UI), then have CTO synthesize.
    const isCto = (agentType as AgentType) === 'cto_virtual'
    const isFirstThreadTurn = thread.message_count === 0
    const currentPhase = projectContext.currentPhase
    if (isCto && isFirstThreadTurn && currentPhase >= 3 && currentPhase <= 7) {
      async function consultInternal(a: AgentType, instruction: string, eventType: string) {
        const specialistSystem = buildAgentPrompt(a, {
          ...projectContext,
          attachmentsSummary,
        })
        const { text, usage } = await generateText({
          model: defaultModel,
          system: specialistSystem,
          messages: [
            {
              role: 'user' as const,
              content: `Fase: Phase ${String(currentPhase).padStart(2, '0')} — ${projectContext.phaseName}\n\nTarea:\n${instruction}\n\nIMPORTANTE:\n- Responde con bullets concretos y accionables.\n- Mantén el foco en lo que el usuario necesita para avanzar hoy.\n- Asume stack Next.js + Supabase + Vercel.\n`,
            },
          ],
          maxOutputTokens: 900,
          temperature: 0.3,
        })

        const inputTokens =
          usage?.inputTokens ?? estimateTokensFromText(specialistSystem + instruction)
        const outputTokens = usage?.outputTokens ?? estimateTokensFromText(text)
        recordAiUsage(supabase, {
          userId,
          projectId,
          eventType,
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})

        return text
      }

      const internalNotesParts: string[] = []

      if (currentPhase === 3) {
        const [devops, operator, dba] = await Promise.all([
          consultInternal(
            'devops_engineer',
            'Dame un plan paso a paso para dejar listo hosting y variables de entorno (Vercel), incluyendo checklist de verificacion.',
            'phase03_chat',
          ),
          consultInternal(
            'operator',
            'Dame una guia operativa reproducible para repo + CI/CD + deploys (staging/prod) y convenciones de ramas/PRs.',
            'phase03_chat',
          ),
          consultInternal(
            'db_admin',
            'Dame checklist para Supabase: proyecto, migraciones, RLS, seeds (si aplica) y verificacion de conexion desde la app.',
            'phase03_chat',
          ),
        ])
        internalNotesParts.push(`## DevOps Engineer\n${devops}`, `## Operator\n${operator}`, `## DB Admin\n${dba}`)
      } else if (currentPhase === 4) {
        const [leadDev, qa] = await Promise.all([
          consultInternal(
            'lead_developer',
            'Dame una estrategia de ejecucion para completar las tasks de Phase 04: orden por categoria, criterios de done, como gestionar PRs y manejo de riesgos tecnicos.',
            'phase04_chat',
          ),
          consultInternal(
            'qa_engineer',
            'Dame la estrategia de QA durante Phase 04: que tests crear/ajustar primero y como asegurar calidad progresiva mientras se mueve el kanban.',
            'phase04_chat',
          ),
        ])
        internalNotesParts.push(`## Lead Developer\n${leadDev}`, `## QA Engineer\n${qa}`)
      } else if (currentPhase === 5) {
        const [qa, leadDev] = await Promise.all([
          consultInternal(
            'qa_engineer',
            'Dame un plan de testing y QA para Phase 05: unit/integration/e2e, prioridad, criterios de aprobacion por categoria y como armar el reporte de QA.',
            'phase05_chat',
          ),
          consultInternal(
            'lead_developer',
            'Dame recomendaciones para preparar el codigo para QA en Phase 05: practicas para tests estables, fixtures y observabilidad basica.',
            'phase05_chat',
          ),
        ])
        internalNotesParts.push(`## QA Engineer\n${qa}`, `## Lead Developer\n${leadDev}`)
      } else if (currentPhase === 6) {
        const [devops, operator] = await Promise.all([
          consultInternal(
            'devops_engineer',
            'Dame checklist de deploy y monitoreo para Phase 06: pasos en Vercel, configuracion de env vars, logs/alertas, y validaciones previas.',
            'phase06_chat',
          ),
          consultInternal(
            'operator',
            'Dame un runbook operativo conciso: como hacer release, rollback, y que evidencias dejar para auditoria antes de marcar completed.',
            'phase06_chat',
          ),
        ])
        internalNotesParts.push(`## DevOps Engineer\n${devops}`, `## Operator\n${operator}`)
      } else if (currentPhase === 7) {
        const [pa, qa] = await Promise.all([
          consultInternal(
            'product_architect',
            'Dame un plan de iteracion (Phase 07): como usar feedback/métricas, priorizar mejoras y definir siguientes features con enfoque en retention y valor.',
            'phase07_chat',
          ),
          consultInternal(
            'qa_engineer',
            'Dame estrategia de QA para iteraciones en Phase 07: que suites correr, cómo prevenir regresiones y cómo medir calidad vs impacto.',
            'phase07_chat',
          ),
        ])
        internalNotesParts.push(`## Product Architect\n${pa}`, `## QA Engineer\n${qa}`)
      }

      if (internalNotesParts.length > 0) {
        systemPrompt += `\n\n---\n\nCONSULTA INTERNA (SOLO CTO, NO MOSTRAR TAL CUAL):\n${internalNotesParts.join(
          '\n\n',
        )}\n\nINSTRUCCION CTO:\n- Integra estas notas en tu respuesta.\n- Mantén el estilo CTO: decision + justificacion + siguiente paso.\n- Propón un orden claro y accionable para completar Phase ${String(currentPhase).padStart(2, '0')}.`
      }
    }

    const result = streamText({
      model: defaultModel,
      system: systemPrompt,
      messages: allMessages,
      maxOutputTokens: AI_CONFIG.chat.maxTokens,
      temperature: AI_CONFIG.chat.temperature,
      onFinish: async (response) => {
        const updatedMessages = [
          ...existingMessages,
          { role: 'user', content: userMessage, created_at: now },
          { role: 'assistant', content: response.text, created_at: now },
        ]

        await supabase
          .from('conversation_threads')
          .update({
            messages: updatedMessages,
            message_count: updatedMessages.length,
            last_message_at: now,
            attachments: allAttachments,
          })
          .eq('id', threadId)

        // Record AI usage for financial backoffice (estimated tokens when SDK does not provide usage)
        const inputTokens =
          response.usage?.inputTokens ??
          estimateTokensFromText(systemPrompt + allMessages.map((m) => extractTextFromMessage(m)).join(''))
        const outputTokens =
          response.usage?.outputTokens ?? estimateTokensFromText(response.text ?? '')
        recordAiUsage(supabase, {
          userId,
          projectId,
          eventType: 'agent_chat',
          model: defaultModel?.toString?.() ?? undefined,
          inputTokens,
          outputTokens,
        }).catch(() => {})

        // Auto-generate title on first message
        if (thread.message_count === 0) {
          const title = await generateThreadTitle(userMessage, { supabase, userId, projectId })
          await supabase
            .from('conversation_threads')
            .update({ title })
            .eq('id', threadId)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error: unknown) {
    console.error('[Agents chat] Error', error)
    const { status, body } = formatChatErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
