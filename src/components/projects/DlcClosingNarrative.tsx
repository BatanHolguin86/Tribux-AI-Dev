/**
 * Short copy: user can "complete" build+launch phases in-app (checklists/Kanban) while some work stays manual.
 */
type DlcClosingNarrativeProps = {
  variant?: 'dashboard' | 'project'
}

export function DlcClosingNarrative({ variant = 'project' }: DlcClosingNarrativeProps) {
  const isDash = variant === 'dashboard'

  return (
    <div
      className={`rounded-xl border border-brand-teal/30/80 bg-brand-surface/40 px-3 py-2.5 text-xs leading-relaxed text-gray-700 dark:border-brand-primary/35 dark:bg-brand-navy/20 dark:text-gray-300 ${
        isDash ? 'mt-4' : 'mb-4'
      }`}
    >
      <p>
        <span className="font-semibold text-brand-primary dark:text-brand-teal/30">
          {isDash ? 'Metodología IA DLC — ' : 'Diseña, construye y lanza — '}
        </span>
        {isDash
          ? 'Cada proyecto recorre 8 fases (00–07). Tras diseñar (Discovery, KIRO, Diseño & UX), las fases 03–07 cubren entorno, desarrollo con tasks persistidas, QA, lanzamiento e iteración. Marca avances en la app; el resto puede ser manual (Git, Vercel, métricas).'
          : 'Las fases 03–07 son tu camino operativo: Environment (03), Core Dev con Kanban (04), Testing (05), Launch (06) e Iteration (07). Los checklists y tasks se guardan por proyecto; el trabajo externo cuenta igual hacia el cierre.'}
      </p>
    </div>
  )
}
