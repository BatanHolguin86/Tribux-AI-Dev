'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ProjectWithProgress } from '@/types/project'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from './EmptyState'
import { DashboardHeader } from './DashboardHeader'
import { DlcClosingNarrative } from '@/components/projects/DlcClosingNarrative'
import { CreateProjectModal } from './CreateProjectModal'
import { useFounderMode } from '@/hooks/useFounderMode'
import { EditProjectModal } from './EditProjectModal'
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog'
import type { DashboardSummary } from '@/types/project'

type ProjectsGridProps = {
  projects: ProjectWithProgress[]
  summary?: DashboardSummary
}

function ProjectGrid({
  projects,
  onEdit,
  onArchive,
}: {
  projects: ProjectWithProgress[]
  onEdit: (p: ProjectWithProgress) => void
  onArchive: (p: ProjectWithProgress) => void
}) {
  const { isConsultor } = useFounderMode()

  // For consultors: group by client_name
  if (isConsultor) {
    const grouped = new Map<string, ProjectWithProgress[]>()
    for (const p of projects) {
      const client = (p as ProjectWithProgress & { client_name?: string }).client_name || 'Sin cliente'
      const list = grouped.get(client) ?? []
      list.push(p)
      grouped.set(client, list)
    }

    const groups = Array.from(grouped.entries()).sort(([a], [b]) => {
      if (a === 'Sin cliente') return 1
      if (b === 'Sin cliente') return -1
      return a.localeCompare(b)
    })

    return (
      <div className="mt-6 space-y-6">
        {groups.map(([client, clientProjects]) => (
          <div key={client}>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-display font-semibold uppercase tracking-wider text-[#94A3B8]">
                {client}
              </span>
              <span className="rounded-full bg-[#E8F4F8] px-2 py-0.5 text-[10px] font-medium text-[#0F2B46]">
                {clientProjects.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clientProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={onEdit}
                  onArchive={onArchive}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default: flat grid
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
    </div>
  )
}

export function ProjectsGrid({ projects: initialProjects }: ProjectsGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentTab = searchParams.get('tab') || 'active'
  const currentSearch = searchParams.get('search') || ''

  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState(currentSearch)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectWithProgress | null>(null)
  const [archiveProject, setArchiveProject] = useState<ProjectWithProgress | null>(null)

  function updateParams(tab: string, searchVal: string) {
    const params = new URLSearchParams()
    if (tab !== 'active') params.set('tab', tab)
    if (searchVal) params.set('search', searchVal)
    const qs = params.toString()
    router.replace(`/dashboard${qs ? `?${qs}` : ''}`, { scroll: false })
  }

  function setTab(tab: string) {
    updateParams(tab, search)
  }

  function setSearchValue(val: string) {
    setSearch(val)
    updateParams(currentTab, val)
  }

  const filtered = useMemo(() => {
    const statusFilter = currentTab === 'archived' ? 'archived' : 'active'
    return projects
      .filter((p) => p.status === statusFilter)
      .filter((p) => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          (p.industry?.toLowerCase().includes(q) ?? false)
        )
      })
  }, [projects, currentTab, search])

  const activeCount = projects.filter((p) => p.status === 'active').length
  const archivedCount = projects.filter((p) => p.status === 'archived').length

  const summary: DashboardSummary = {
    total_active: activeCount,
    phases_completed_this_week: 0,
  }

  return (
    <>
      <DashboardHeader summary={summary} onCreateProject={() => setCreateOpen(true)} />

      <DlcClosingNarrative variant="dashboard" />

      {/* Toolbar: search + tabs */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar proyectos..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:border-[#0EA5A3] focus:outline-none focus:ring-1 focus:ring-[#0EA5A3] sm:w-72"
          />
        </div>
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => setTab('active')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              currentTab !== 'archived'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setTab('archived')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              currentTab === 'archived'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Archivados ({archivedCount})
          </button>
        </div>
      </div>

      {/* Grid — grouped by client for consultors */}
      {filtered.length > 0 ? (
        <ProjectGrid
          projects={filtered}
          onEdit={setEditProject}
          onArchive={setArchiveProject}
        />
      ) : (
        <div className="mt-6">
          {currentTab === 'archived' ? (
            <EmptyState
              title="Sin proyectos archivados"
              description="Los proyectos que archives apareceran aqui."
            />
          ) : search ? (
            <EmptyState
              title="Sin resultados"
              description={`No se encontraron proyectos para "${search}".`}
            />
          ) : (
            <EmptyState
              title="Sin proyectos"
              description="Crea tu primer proyecto para comenzar."
              action={{ label: 'Nuevo proyecto', onClick: () => setCreateOpen(true) }}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) => {
          setCreateOpen(false)
          router.push(`/projects/${project.id}/phase/00`)
        }}
      />

      <EditProjectModal
        project={editProject}
        onClose={() => setEditProject(null)}
        onUpdated={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          setEditProject(null)
        }}
      />

      <ArchiveConfirmDialog
        project={archiveProject}
        onClose={() => setArchiveProject(null)}
        onConfirmed={(project, newStatus) => {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === project.id ? { ...p, status: newStatus as ProjectWithProgress['status'] } : p
            )
          )
          setArchiveProject(null)
        }}
      />
    </>
  )
}
