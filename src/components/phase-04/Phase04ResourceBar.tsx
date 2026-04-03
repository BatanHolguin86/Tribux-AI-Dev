'use client'

import Link from 'next/link'

const TYPE_SHORT: Record<string, string> = {
  wireframe: 'WF',
  mockup_lowfi: 'Low',
  mockup_highfi: 'Hi',
}

export type Phase04ApprovedDesign = {
  id: string
  screen_name: string
  type: string
}

type Phase04ResourceBarProps = {
  projectId: string
  approvedDesigns?: Phase04ApprovedDesign[]
}

export function Phase04ResourceBar({ projectId, approvedDesigns = [] }: Phase04ResourceBarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs dark:border-gray-700 dark:bg-gray-900">
        <span className="font-medium text-gray-500 dark:text-gray-400">Referencias en la app</span>
        <Link
          href={`/projects/${projectId}/phase/01`}
          className="font-semibold text-[#0F2B46] hover:underline dark:text-[#0EA5A3]"
        >
          Phase 01 — KIRO
        </Link>
        <span className="hidden text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
          ·
        </span>
        <Link
          href={`/projects/${projectId}/phase/02`}
          className="font-semibold text-[#0F2B46] hover:underline dark:text-[#0EA5A3]"
        >
          Phase 02 — Diseño &amp; UX (hub)
        </Link>
      </div>

      {approvedDesigns.length > 0 && (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            Diseños aprobados · referencia para desarrollo
          </p>
          <p className="mt-1 text-xs text-emerald-900/90 dark:text-emerald-100/90">
            Pantallas UX marcadas como aprobadas en el detalle del artefacto. Úsalas como guía visual al implementar
            tasks.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {approvedDesigns.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/projects/${projectId}/designs/${d.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/80 bg-white px-2.5 py-1 text-xs font-medium text-emerald-900 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
                >
                  <span className="rounded bg-emerald-600/10 px-1 font-mono text-[10px] text-emerald-800 dark:text-emerald-200">
                    {TYPE_SHORT[d.type] ?? d.type}
                  </span>
                  {d.screen_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
