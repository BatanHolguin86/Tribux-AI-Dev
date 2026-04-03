'use client'

import type { Phase02Section, SectionStatus } from '@/types/conversation'
import { PHASE02_SECTIONS, SECTION_LABELS } from '@/lib/ai/prompts/phase-02'
import { usePhaseWorkspaceNav } from '@/lib/phase-workspace-nav-context'

type StepStatus = 'done' | 'current' | 'pending'

function sectionStepStatus(
  key: Phase02Section,
  activeSection: Phase02Section,
  statusByKey: Record<Phase02Section, SectionStatus>,
): StepStatus {
  if (statusByKey[key] === 'approved') return 'done'
  if (key === activeSection) return 'current'
  return 'pending'
}

function visualStepStatus(approvedCount: number, artifactCount: number): StepStatus {
  if (approvedCount > 0) return 'done'
  if (artifactCount > 0) return 'current'
  return 'pending'
}

type Phase02WorkflowGuideProps = {
  projectId: string
  activeSection: Phase02Section
  sections: Array<{ key: Phase02Section; status: SectionStatus }>
  artifactCount: number
  approvedVisualCount: number
}

export function Phase02WorkflowGuide({
  projectId,
  activeSection,
  sections,
  artifactCount,
  approvedVisualCount,
}: Phase02WorkflowGuideProps) {
  const nav = usePhaseWorkspaceNav()
  const statusByKey = Object.fromEntries(sections.map((s) => [s.key, s.status])) as Record<
    Phase02Section,
    SectionStatus
  >

  const steps = [
    ...PHASE02_SECTIONS.map((key) => ({
      id: key,
      label: SECTION_LABELS[key],
      kind: 'architecture' as const,
      status: sectionStepStatus(key, activeSection, statusByKey),
    })),
    {
      id: 'design_hub',
      label: 'Diseño & UX (entregables visuales)',
      kind: 'design' as const,
      status: visualStepStatus(approvedVisualCount, artifactCount),
    },
  ]

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-[#0EA5A3]/30/80 bg-gradient-to-br from-[#E8F4F8]/95 via-white to-indigo-50/60 p-5 shadow-sm dark:border-[#0F2B46]/35 dark:from-[#0A1F33]/25 dark:via-gray-950 dark:to-indigo-950/20">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F2B46] dark:text-[#0EA5A3]">
          Phase 02 — Un solo flujo: Arquitectura &amp; Diseño
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recorrido guiado con entregables claros
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Las <strong className="text-gray-800 dark:text-gray-200">cuatro secciones</strong> documentan sistema, datos,
          APIs y decisiones. El <strong className="text-gray-800 dark:text-gray-200">hub Diseño &amp; UX</strong> (pestaña
          homónima) produce pantallas que <strong>validan alcance</strong> y deben <strong>alinearse</strong> con lo que
          defines aquí: la IA usa esos artefactos como referencia en cada sección.
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Orden recomendado: avanza las secciones en orden; puedes abrir Diseño &amp; UX en paralelo tras tener visión de
          sistema para iterar mockups y APIs a la vez.
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {steps.map((step, i) => {
          const isDesign = step.kind === 'design'
          const badge =
            step.status === 'done'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : step.status === 'current'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

          return (
            <li
              key={step.id}
              className={`flex flex-col rounded-xl border p-3 text-left transition-shadow ${
                step.status === 'current'
                  ? 'border-[#0EA5A3] shadow-md shadow-[#E8F4F8]/50 dark:border-[#0EA5A3] dark:shadow-[#0F2B46]/20'
                  : 'border-gray-200 dark:border-gray-700'
              } ${isDesign ? 'bg-gradient-to-b from-fuchsia-50/80 to-white dark:from-fuchsia-950/20 dark:to-gray-950' : 'bg-white dark:bg-gray-900'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Paso {i + 1}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge}`}>
                  {step.status === 'done' ? 'Listo' : step.status === 'current' ? 'En foco' : 'Pendiente'}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">{step.label}</p>
              {isDesign ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {artifactCount > 0 ? (
                    <>
                      {artifactCount} pantalla{artifactCount !== 1 ? 's' : ''}
                      {approvedVisualCount > 0 ? (
                        <>
                          {' '}
                          ·{' '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            {approvedVisualCount} aprobada{approvedVisualCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>Genera wireframes o mockups en HTML; al aprobar, alimentan la arquitectura.</>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Documento Markdown + chat con el orquestador.
                </p>
              )}
              {isDesign && nav?.goToHerramientas ? (
                <button
                  type="button"
                  onClick={() => nav.goToHerramientas?.()}
                  className="mt-3 w-full rounded-lg bg-fuchsia-600 px-2 py-2 text-xs font-semibold text-white hover:bg-fuchsia-700 dark:bg-fuchsia-700 dark:hover:bg-fuchsia-600"
                >
                  Abrir Diseño &amp; UX
                </button>
              ) : isDesign ? (
                <a
                  href={`/projects/${projectId}/phase/02`}
                  className="mt-3 block w-full rounded-lg bg-fuchsia-600 px-2 py-2 text-center text-xs font-semibold text-white hover:bg-fuchsia-700"
                >
                  Ir a Phase 02
                </a>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
