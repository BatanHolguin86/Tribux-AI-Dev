'use client'

import type { KiroDocumentType } from '@/types/feature'
import { KIRO_DOC_TYPES, KIRO_DOC_LABELS } from '@/lib/ai/prompts/phase-01'

type DocMap = Record<KiroDocumentType, { status: string; content: string | null } | null>

type KiroWorkflowRailProps = {
  documents: DocMap
  activeDocType: KiroDocumentType
}

function isDocAccessible(documents: DocMap, docType: KiroDocumentType): boolean {
  const idx = KIRO_DOC_TYPES.indexOf(docType)
  if (idx === 0) return true
  const prev = KIRO_DOC_TYPES[idx - 1]
  return documents[prev]?.status === 'approved'
}

/**
 * Single-line “what to do now” for Phase 01 — minimal, no duplicate KIRO essay.
 */
function actionHint(documents: DocMap, active: KiroDocumentType): string {
  const doc = documents[active]
  const hasBody = !!(doc?.content && doc.content.trim().length > 0)
  const approved = doc?.status === 'approved'

  if (approved) {
    const idx = KIRO_DOC_TYPES.indexOf(active)
    const next = KIRO_DOC_TYPES[idx + 1]
    if (next && isDocAccessible(documents, next)) {
      return `Listo. Cuando quieras, abre la pestaña ${KIRO_DOC_LABELS[next]}.`
    }
    if (next) {
      return `${KIRO_DOC_LABELS[active]} aprobado. Sigue el orden 1 → 2 → 3 arriba.`
    }
    return `${KIRO_DOC_LABELS[active]} aprobado. Cierra el resto de features y el gate de Phase 01.`
  }
  if (hasBody) {
    return 'Revisa el documento a la derecha. Aprueba o pide cambios — el CTO ajusta en este chat.'
  }
  return 'Conversa con el CTO aquí. Cuando indique que está listo, verás Generar documento; después Aprueba para desbloquear la siguiente pestaña.'
}

const STEP_SHORT: Record<KiroDocumentType, string> = {
  requirements: 'Requisitos',
  design: 'Diseño',
  tasks: 'Tasks',
}

export function KiroWorkflowRail({ documents, activeDocType }: KiroWorkflowRailProps) {
  const hint = actionHint(documents, activeDocType)

  return (
    <div className="border-b border-gray-100 bg-gradient-to-r from-violet-50/80 to-white px-3 py-2.5 dark:border-gray-800 dark:from-violet-950/25 dark:to-gray-900">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          Spec KIRO
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
          {KIRO_DOC_TYPES.map((dt, i) => {
            const approved = documents[dt]?.status === 'approved'
            const locked = !isDocAccessible(documents, dt)
            const current = dt === activeDocType

            return (
              <div key={dt} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                    →
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset transition-colors ${
                    approved
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800'
                      : current
                        ? 'bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:ring-violet-700'
                        : locked
                          ? 'bg-gray-50 text-gray-400 ring-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700'
                          : 'bg-white text-gray-600 ring-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-700'
                  }`}
                >
                  <span className="tabular-nums opacity-70">{i + 1}</span>
                  {STEP_SHORT[dt]}
                  {approved && <span aria-hidden>✓</span>}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-gray-600 dark:text-gray-400">{hint}</p>
    </div>
  )
}
