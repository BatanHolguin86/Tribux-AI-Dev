'use client'

import { useState, useCallback } from 'react'
import type { TaskWithFeature, TaskStatus } from '@/types/task'
import { getPhaseAgents } from '@/lib/phase-workspace-config'
import { PhaseWorkspaceTabs } from '@/components/shared/PhaseWorkspaceTabs'
import { PhaseTeamPanel } from '@/components/shared/PhaseTeamPanel'
import { PhaseProgressHeader } from '@/components/shared/PhaseProgressHeader'
import { KanbanBoard } from './KanbanBoard'
import { CodeGenerationModal } from './CodeGenerationModal'
import { AutoBuildPanel } from './AutoBuildPanel'
import { BuildSessionPanel } from './BuildSessionPanel'
import { Phase04FinalGate } from './Phase04FinalGate'
import { Phase04ResourceBar, type Phase04ApprovedDesign } from './Phase04ResourceBar'
import { PhaseDocsCallout } from '@/components/shared/PhaseDocsCallout'
import { PhaseChatPanel } from '@/components/shared/PhaseChatPanel'
import { CIStatusWidget } from '@/components/phase-05/CIStatusWidget'
import { LivePreviewWidget } from './LivePreviewWidget'

const PHASE04_OBJECTIVE =
  'El Kanban es tu checklist de desarrollo: cada task KIRO persistida se mueve hasta Done. Parte del trabajo puede ser manual (IDE, PRs, repos externos).'

type Phase04LayoutProps = {
  projectId: string
  initialTasks: TaskWithFeature[]
  approvedDesigns?: Phase04ApprovedDesign[]
  initialMessages: Array<{ role: string; content: string; created_at?: string }>
  repoUrl?: string | null
}

const phaseAgents = getPhaseAgents(4)

export function Phase04Layout({
  projectId,
  initialTasks,
  approvedDesigns = [],
  initialMessages,
  repoUrl,
}: Phase04LayoutProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<TaskWithFeature | null>(null)
  const [showCodeGenModal, setShowCodeGenModal] = useState(false)
  const [autoBuildTask, setAutoBuildTask] = useState<TaskWithFeature | null>(null)
  const [showBuildSession, setShowBuildSession] = useState(false)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const allDone = totalTasks > 0 && doneTasks === totalTasks

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

      const res = await fetch(`/api/projects/${projectId}/phases/4/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) => {
            const original = initialTasks.find((o) => o.id === taskId)
            return t.id === taskId && original ? { ...t, status: original.status } : t
          }),
        )
      }
    },
    [projectId, initialTasks],
  )

  const handleGenerateCode = useCallback(
    (task: TaskWithFeature) => {
      setSelectedTask(task)
      setShowCodeGenModal(true)
    },
    [],
  )

  const handleCodeGenClose = useCallback(() => {
    setShowCodeGenModal(false)
    setSelectedTask(null)
  }, [])

  const handleCodeGenTaskUpdate = useCallback(
    (taskId: string, newStatus: 'review') => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    },
    [],
  )

  const handleAutoBuild = useCallback((task: TaskWithFeature) => {
    setAutoBuildTask(task)
  }, [])

  const handleAutoBuildClose = useCallback(() => {
    setAutoBuildTask(null)
  }, [])

  const handleAutoBuildTaskUpdate = useCallback((taskId: string, newStatus: 'review') => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
  }, [])

  const pendingTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress')

  const sectionsContent =
    totalTasks === 0 ? (
      <div>
        <Phase04ResourceBar projectId={projectId} approvedDesigns={approvedDesigns} />
        <PhaseProgressHeader
          title="Core Development"
          completedCount={0}
          totalCount={0}
          unitLabel="tasks"
          objective={PHASE04_OBJECTIVE}
        />
        <PhaseDocsCallout
          title="Referencias de construcción"
          description="Convenciones de código y estructura del repo."
          repoPaths={[
            { label: 'Desarrollo (IA DLC)', path: 'docs/04-development/README.md' },
            { label: 'QA y tests', path: 'docs/05-qa/e2e-tests.md' },
            { label: 'Checklist release', path: 'docs/05-qa/v1-go-no-go.md' },
          ]}
        />
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
          <div className="mb-3 text-4xl">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No hay tasks aun
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
            Las tasks se generan automaticamente desde los specs KIRO de Phase 01 cuando Phase 03 es
            aprobada. Mientras tanto, revisa tus specs y diseños desde los enlaces de arriba.
          </p>
        </div>
      </div>
    ) : (
      <div>
        <Phase04ResourceBar projectId={projectId} approvedDesigns={approvedDesigns} />
        <PhaseProgressHeader
          title="Core Development"
          completedCount={doneTasks}
          totalCount={totalTasks}
          unitLabel="tasks"
          objective={PHASE04_OBJECTIVE}
        />

        {allDone ? (
          <Phase04FinalGate projectId={projectId} totalTasks={totalTasks} />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mueve las tasks por el Kanban (estado persistido). Usa el tab{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">Equipo</span> para Lead Developer o CTO.
              </p>
              {repoUrl && pendingTasks.length > 1 && (
                <button
                  onClick={() => setShowBuildSession(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:border-violet-400 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400 dark:hover:border-violet-600"
                >
                  🏗️ Build All ({pendingTasks.length})
                </button>
              )}
            </div>
            <KanbanBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onGenerateCode={repoUrl ? handleGenerateCode : undefined}
              onAutoBuild={repoUrl ? handleAutoBuild : undefined}
            />
            {repoUrl && <CIStatusWidget projectId={projectId} />}
            {repoUrl && <LivePreviewWidget projectId={projectId} />}
          </>
        )}
      </div>
    )

  const chatContent = (
    <PhaseChatPanel
      projectId={projectId}
      phaseNumber={4}
      initialMessages={initialMessages}
    />
  )

  return (
    <>
      <PhaseWorkspaceTabs
        phaseNumber={4}
        projectId={projectId}
        phaseAgents={phaseAgents}
        hasTools
        toolsContent={chatContent}
        teamContent={(goToSecciones) => (
          <PhaseTeamPanel
            projectId={projectId}
            phaseNumber={4}
            agentTypes={phaseAgents}
            onGoToSecciones={goToSecciones}
          />
        )}
      >
        {sectionsContent}
      </PhaseWorkspaceTabs>

      {selectedTask && (
        <CodeGenerationModal
          projectId={projectId}
          task={selectedTask}
          isOpen={showCodeGenModal}
          onClose={handleCodeGenClose}
          onTaskStatusChange={handleCodeGenTaskUpdate}
        />
      )}

      {autoBuildTask && (
        <AutoBuildPanel
          projectId={projectId}
          task={autoBuildTask}
          isOpen={!!autoBuildTask}
          onClose={handleAutoBuildClose}
          onTaskStatusChange={handleAutoBuildTaskUpdate}
        />
      )}

      {showBuildSession && (
        <BuildSessionPanel
          projectId={projectId}
          tasks={pendingTasks}
          onClose={() => setShowBuildSession(false)}
          onTaskStatusChange={handleAutoBuildTaskUpdate}
        />
      )}
    </>
  )
}
