'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ProjectWithProgress } from '@/types/project'
import { PHASE_NAMES } from '@/types/project'
import { formatRelativeDate } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import { PhaseTimeline } from './PhaseTimeline'
import { IndustryTag } from './IndustryTag'

type ProjectCardProps = {
  project: ProjectWithProgress
  onEdit: (project: ProjectWithProgress) => void
  onArchive: (project: ProjectWithProgress) => void
}

export function ProjectCard({ project, onEdit, onArchive }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const phaseName = PHASE_NAMES[project.active_phase] ?? 'Unknown'

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-5">
        {/* Header: industry + menu */}
        <div className="flex items-start justify-between">
          <div>{project.industry && <IndustryTag industry={project.industry} />}</div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit(project)
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onArchive(project)
                    }}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    {project.status === 'archived' ? 'Restaurar' : 'Archivar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name + description */}
        <h3 className="mt-2 text-base font-semibold text-gray-900">{project.name}</h3>
        {project.description && (
          <p className="mt-1 truncate text-sm text-gray-500">{project.description}</p>
        )}

        {/* Active phase + progress */}
        <p className="mt-3 text-xs font-medium text-violet-600">
          Phase {String(project.active_phase).padStart(2, '0')}: {phaseName}
        </p>
        <div className="mt-2">
          <ProgressBar value={project.progress_percentage} />
        </div>

        {/* Mini timeline */}
        {project.phases && project.phases.length > 0 && (
          <div className="mt-3">
            <PhaseTimeline phases={project.phases} variant="mini" />
          </div>
        )}

        {/* Next action */}
        <p className="mt-3 text-xs text-gray-500">
          Siguiente: <span className="font-medium text-gray-700">{project.next_action}</span>
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatRelativeDate(project.last_activity)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-1 text-gray-400 hover:text-gray-600"
              title={expanded ? 'Contraer' : 'Expandir timeline'}
            >
              <svg
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Link
              href={`/projects/${project.id}/phase/${String(project.active_phase).padStart(2, '0')}`}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
            >
              Continuar
            </Link>
          </div>
        </div>
      </div>

      {/* Expanded timeline */}
      {expanded && project.phases && project.phases.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-4">
          <PhaseTimeline phases={project.phases} variant="full" />
        </div>
      )}
    </div>
  )
}
