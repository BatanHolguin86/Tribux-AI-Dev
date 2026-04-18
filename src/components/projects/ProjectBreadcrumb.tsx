'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type ProjectBreadcrumbProps = {
  projectId: string
  projectName: string
  currentPhase: number
  phaseName: string
}

function Chevron() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ProjectBreadcrumb({
  projectId,
  projectName,
  currentPhase,
  phaseName,
}: ProjectBreadcrumbProps) {
  const pathname = usePathname()
  const phaseHref = `/projects/${projectId}/phase/${String(currentPhase).padStart(2, '0')}`
  const linkClass = 'hover:text-brand-primary dark:hover:text-brand-teal transition-colors'

  const parts = pathname?.split('/').filter(Boolean) ?? []
  const isThisProject = parts[0] === 'projects' && parts[1] === projectId
  const isDesignsList = isThisProject && parts[2] === 'designs' && parts.length === 3
  const isDesignsArtifact = isThisProject && parts[2] === 'designs' && parts.length >= 4
  const isExperts = isThisProject && parts[2] === 'experts'
  const isKnowledge = isThisProject && parts[2] === 'knowledge'

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" aria-label="Ruta">
      <Link href="/dashboard" className={linkClass}>
        Proyectos
      </Link>
      <Chevron />
      <Link href={phaseHref} className={linkClass}>
        {projectName}
      </Link>

      {isDesignsList && (
        <>
          <Chevron />
          <span className="font-medium text-gray-900 dark:text-gray-100">Diseño &amp; UX</span>
        </>
      )}

      {isDesignsArtifact && (
        <>
          <Chevron />
          <Link href={`/projects/${projectId}/designs`} className={linkClass}>
            Diseño &amp; UX
          </Link>
          <Chevron />
          <span className="font-medium text-gray-900 dark:text-gray-100">Artefacto</span>
        </>
      )}

      {isExperts && (
        <>
          <Chevron />
          <span className="font-medium text-gray-900 dark:text-gray-100">Agentes IA</span>
        </>
      )}

      {isKnowledge && (
        <>
          <Chevron />
          <span className="font-medium text-gray-900 dark:text-gray-100">Base de Conocimiento</span>
        </>
      )}

      {!isDesignsList && !isDesignsArtifact && !isExperts && !isKnowledge && (
        <>
          <Chevron />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Phase {String(currentPhase).padStart(2, '0')}: {phaseName}
          </span>
        </>
      )}
    </nav>
  )
}
