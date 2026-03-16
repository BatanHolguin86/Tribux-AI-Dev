'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { ProjectWithProgress } from '@/types/project'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from './EmptyState'
import { DashboardHeader } from './DashboardHeader'
import { CreateProjectModal } from './CreateProjectModal'
import { EditProjectModal } from './EditProjectModal'
import { ArchiveConfirmDialog } from './ArchiveConfirmDialog'
import type { DashboardSummary } from '@/types/project'

type ProjectsGridProps = {
  projects: ProjectWithProgress[]
  summary?: DashboardSummary
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
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 sm:w-72"
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

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditProject}
              onArchive={setArchiveProject}
            />
          ))}
        </div>
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
