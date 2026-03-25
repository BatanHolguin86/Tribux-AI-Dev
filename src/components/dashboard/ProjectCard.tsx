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
    <div className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/20 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600">
      <div className="p-5">
        {/* Header: industry + menu */}
        <div className="flex items-start justify-between">
          <div>{project.industry && <IndustryTag industry={project.industry} />}</div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400"
              aria-label="Menu del proyecto"
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
                <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1 shadow-lg dark:shadow-black/30">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit(project)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onArchive(project)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    {project.status === 'archived' ? 'Restaurar' : 'Archivar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name + description */}
        <h3 className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
        )}

        {/* Active phase + progress */}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-violet-100 dark:bg-violet-900/20 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-400">
            Phase {String(project.active_phase).padStart(2, '0')}
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{phaseName}</span>
          {project.cycle_number > 1 && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/20 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Ciclo {project.cycle_number}
            </span>
          )}
        </div>
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
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="font-medium text-gray-700 dark:text-gray-300">{project.next_action}</span>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeDate(project.last_activity)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
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
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110"
            >
              Continuar
            </Link>
          </div>
        </div>
      </div>

      {/* Expanded timeline */}
      {expanded && project.phases && project.phases.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
          <PhaseTimeline phases={project.phases} variant="full" />
        </div>
      )}
    </div>
  )
}
