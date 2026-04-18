import { generateText } from 'ai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { defaultModel, AI_CONFIG } from '@/lib/ai/anthropic'
import { recordStreamUsage } from '@/lib/ai/usage'
import { checkRateLimit, getClientIp, AGENT_CHAT_RATE_LIMIT } from '@/lib/rate-limit'

export const maxDuration = 60

const SECTIONS = [
  'problem_statement',
  'personas',
  'value_proposition',
  'metrics',
  'competitive_analysis',
] as const

/**
 * POST /api/projects/[id]/phases/0/guided-discovery
 * Takes 3 simple answers from the founder and generates all 5 Phase 00 sections.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const ip = getClientIp(request)
    const rateResult = checkRateLimit(`guided:${user.id}:${ip}`, AGENT_CHAT_RATE_LIMIT)
    if (!rateResult.allowed) {
      return Response.json({ error: 'rate_limited' }, { status: 429 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, name, description, industry')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return Response.json({ error: 'not_found' }, { status: 404 })

    const body = await request.json()
    const { problem, audience, solution } = body as {
      problem: string
      audience: string
      solution: string
    }

    if (!problem?.trim() || !audience?.trim() || !solution?.trim()) {
      return Response.json({ error: 'Las 3 respuestas son requeridas.' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const founderInput = `
PROYECTO: ${project.name}
${project.description ? `DESCRIPCION: ${project.description}` : ''}
${project.industry ? `INDUSTRIA: ${project.industry}` : ''}

RESPUESTAS DE LA PERSONA FUNDADORA:

1. PROBLEMA QUE RESUELVE:
${problem}

2. PARA QUIEN LO RESUELVE:
${audience}

3. COMO IMAGINA LA SOLUCION:
${solution}
`

    const sectionPrompts: Record<string, string> = {
      problem_statement: `Genera el Problem Statement para este proyecto. Incluye:
- Definicion clara del problema (2-3 parrafos)
- Contexto y evidencia del problema
- Impacto si no se resuelve
- Hipotesis de solucion

Basate en las respuestas de la persona fundadora. Complementa con tu conocimiento de producto.`,

      personas: `Genera las User Personas para este proyecto. Incluye 2-3 personas con:
- Nombre ficticio, edad, rol
- Contexto y dia a dia
- Pain points principales
- Que necesitan de la solucion
- Quote representativo

Basate en la descripcion de audiencia que dio la persona fundadora.`,

      value_proposition: `Genera la Value Proposition para este proyecto. Incluye:
- Propuesta de valor en 1 frase clara
- 3 diferenciadores clave
- Momento "aha" del usuario
- 3-5 features core del MVP

Basate en el problema y la solucion que describio la persona fundadora.`,

      metrics: `Genera las Success Metrics para este proyecto. Incluye:
- North Star Metric
- Metricas de adquisicion (2-3)
- Metricas de activacion (2-3)
- Metricas de retencion (2-3)
- Metricas de revenue (2-3)
- Targets para los primeros 3 meses

Basate en el tipo de producto y audiencia.`,

      competitive_analysis: `Genera el Competitive Analysis para este proyecto. Incluye:
- 3-5 competidores (directos e indirectos)
- Fortalezas y debilidades de cada uno
- Pricing aproximado
- Matriz de posicionamiento (2 ejes relevantes)
- Ventaja competitiva sostenible del proyecto

Basate en el problema y la solucion que describio la persona fundadora.`,
    }

    // Generate all 5 sections sequentially
    for (const section of SECTIONS) {
      const { text, usage } = await generateText({
        model: defaultModel,
        system: `Eres el CTO Virtual de Tribux AI. Una persona fundadora sin conocimientos tecnicos te dio 3 respuestas simples sobre su idea de producto. Tu trabajo es generar documentacion de discovery profesional a partir de esas respuestas.

Responde en espanol. Usa formato markdown con headers, listas y tablas cuando aplique. Se concreto y accionable.`,
        prompt: `${founderInput}\n\n---\n\nTAREA:\n${sectionPrompts[section]}`,
        maxOutputTokens: 2048,
        temperature: AI_CONFIG.documentGeneration.temperature,
      })

      // Save as document
      await admin.from('project_documents').insert({
        project_id: projectId,
        phase_number: 0,
        section,
        document_type: section,
        content: text,
        storage_path: `projects/${projectId}/phase-00/${section}.md`,
        version: 1,
        status: 'draft',
      })

      // Save synthetic conversation
      await admin.from('agent_conversations').upsert(
        {
          project_id: projectId,
          phase_number: 0,
          section,
          agent_type: 'orchestrator',
          messages: [
            { role: 'user', content: `Mi idea: ${problem}\nPara: ${audience}\nSolucion: ${solution}`, created_at: new Date().toISOString() },
            { role: 'assistant', content: text, created_at: new Date().toISOString() },
          ],
        },
        { onConflict: 'project_id,phase_number,section,agent_type' },
      )

      // Update section status
      await admin.from('phase_sections').upsert(
        {
          project_id: projectId,
          phase_number: 0,
          section,
          status: 'completed',
        },
        { onConflict: 'project_id,phase_number,section' },
      )

      // Record usage
      await recordStreamUsage({
        userId: user.id,
        projectId,
        eventType: 'phase00_generate',
        model: null,
        usage: { inputTokens: usage?.inputTokens, outputTokens: usage?.outputTokens },
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[guided-discovery] Error:', error)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
