'use client'

import { usePhaseWorkspaceNav } from '@/lib/phase-workspace-nav-context'

type DesignHubSectionCalloutProps = {
  projectId: string
  artifactCount: number
  approvedCount: number
}

export function DesignHubSectionCallout({
  projectId,
  artifactCount,
  approvedCount,
}: DesignHubSectionCalloutProps) {
  const nav = usePhaseWorkspaceNav()

  return (
    <div className="mb-5 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 to-indigo-50/60 p-4 dark:border-violet-900/40 dark:from-violet-950/30 dark:to-indigo-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Diseño &amp; UX · Phase 02
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Wireframes, mockups y kit con agente UI/UX
          </p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            El hub vive en la pestaña <strong className="text-gray-800 dark:text-gray-200">Herramientas</strong>: Camino A
            (pantallas HTML guardadas) y Camino B (conversación guiada). Los artefactos aprobados aparecen también en
            Phase 04 como referencia para desarrollo.
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
            {artifactCount > 0 ? (
              <>
                <span className="font-medium text-gray-700 dark:text-gray-300">{artifactCount}</span> diseño
                {artifactCount !== 1 ? 's' : ''} en el proyecto
                {approvedCount > 0 ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {approvedCount} aprobado{approvedCount !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : null}
              </>
            ) : (
              <>Aún no hay pantallas generadas; abre Herramientas para empezar.</>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {nav?.goToHerramientas ? (
            <button
              type="button"
              onClick={() => nav.goToHerramientas()}
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 dark:shadow-gray-900/30"
            >
              Abrir Diseño &amp; UX (Herramientas)
            </button>
          ) : (
            <a
              href={`/projects/${projectId}/phase/02`}
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              Ir a Phase 02
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
