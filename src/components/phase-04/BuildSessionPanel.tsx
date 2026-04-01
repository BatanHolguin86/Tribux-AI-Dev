'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  isToolUIPart,
  type UIMessagePart,
  type UIDataTypes,
  type UITools,
} from 'ai'
import { ToolCallRenderer } from '@/components/shared/chat/ToolCallRenderer'
import { StreamingIndicator } from '@/components/shared/chat/StreamingIndicator'
import type { TaskWithFeature } from '@/types/task'

type SessionStatus = 'waiting' | 'building' | 'done' | 'failed'

type TaskBuildState = {
  task: TaskWithFeature
  status: SessionStatus
}

// ─── Sub-component: runs one task via useChat ────────────────────────────────

type ActiveTaskRunnerProps = {
  projectId: string
  task: TaskWithFeature
  onDone: (success: boolean) => void
}

function ActiveTaskRunner({ projectId, task, onDone }: ActiveTaskRunnerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/projects/${projectId}/phases/4/actions/auto-build-task`,
      fetch: async (url, init) => {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        return fetch(url as string, {
          ...init,
          body: JSON.stringify({ ...body, taskId: task.id }),
        })
      },
    }),
    onFinish() {
      onDone(true)
    },
    onError() {
      onDone(false)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      void sendMessage({ text: `Build ${task.task_key}` })
    }
  }, [task.task_key, sendMessage])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        Error: {error.message}
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="max-h-64 space-y-1.5 overflow-y-auto">
      {messages.map((msg) => {
        const allParts = msg.parts as UIMessagePart<UIDataTypes, UITools>[]
        const toolParts = allParts.filter(isToolUIPart)
        const text = (msg.parts as Array<{ type: string; text?: string }>)
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('')

        return (
          <div key={msg.id}>
            {toolParts.map((p) => (
              <ToolCallRenderer key={p.toolCallId} part={p} />
            ))}
            {text && msg.role === 'assistant' && (
              <div className="rounded-md border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <p className="line-clamp-3 whitespace-pre-wrap">{text}</p>
              </div>
            )}
          </div>
        )
      })}
      {isLoading && <StreamingIndicator />}
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

type BuildSessionPanelProps = {
  projectId: string
  tasks: TaskWithFeature[]
  onClose: () => void
  onTaskStatusChange: (taskId: string, status: 'review') => void
}

export function BuildSessionPanel({
  projectId,
  tasks,
  onClose,
  onTaskStatusChange,
}: BuildSessionPanelProps) {
  const [started, setStarted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [states, setStates] = useState<TaskBuildState[]>(
    () => tasks.map((task) => ({ task, status: 'waiting' })),
  )

  const doneCount = states.filter((s) => s.status === 'done' || s.status === 'failed').length
  const successCount = states.filter((s) => s.status === 'done').length
  const allFinished = started && doneCount === tasks.length

  const handleStart = () => {
    setStarted(true)
    setStates((prev) =>
      prev.map((s, i) => (i === 0 ? { ...s, status: 'building' } : s)),
    )
  }

  const handleTaskDone = useCallback(
    (success: boolean) => {
      setStates((prev) => {
        const updated = [...prev]
        updated[currentIdx] = { ...updated[currentIdx], status: success ? 'done' : 'failed' }
        return updated
      })

      if (success) {
        onTaskStatusChange(tasks[currentIdx].id, 'review')
      }

      // Advance to next task
      const next = currentIdx + 1
      if (next < tasks.length) {
        setCurrentIdx(next)
        setStates((prev) =>
          prev.map((s, i) => (i === next ? { ...s, status: 'building' } : s)),
        )
      }
    },
    [currentIdx, tasks, onTaskStatusChange],
  )

  const currentTask =
    started &&
    currentIdx < tasks.length &&
    states[currentIdx]?.status === 'building'
      ? tasks[currentIdx]
      : null

  const STATUS_CONFIG: Record<SessionStatus, { label: string; cls: string; icon: string }> = {
    waiting: { label: 'Esperando', cls: 'text-gray-400 dark:text-gray-500', icon: '◦' },
    building: { label: 'Construyendo', cls: 'text-violet-600 dark:text-violet-400', icon: '●' },
    done: { label: 'Listo', cls: 'text-green-600 dark:text-green-400', icon: '✓' },
    failed: { label: 'Fallo', cls: 'text-red-500 dark:text-red-400', icon: '✗' },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <span className="text-base">🏗️</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Build Session — {tasks.length} tasks
            </p>
            {started && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {successCount} completadas · {doneCount - successCount} fallidas · {tasks.length - doneCount} restantes
              </p>
            )}
          </div>
          {!started && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Listo para iniciar
            </span>
          )}
          {allFinished && (
            <span className="shrink-0 text-xs font-medium text-green-600 dark:text-green-400">
              ✓ Sesion completada
            </span>
          )}
          <button
            onClick={onClose}
            disabled={started && !allFinished}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {started && (
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Task list */}
          <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-100 p-3 dark:border-gray-800">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Tasks
            </p>
            <div className="space-y-1">
              {states.map(({ task, status }, i) => {
                const cfg = STATUS_CONFIG[status]
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                      i === currentIdx && started
                        ? 'bg-violet-50 dark:bg-violet-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 font-bold ${cfg.cls}`}>{cfg.icon}</span>
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-gray-700 dark:text-gray-300">
                        {task.task_key}
                      </span>
                      <span className="block truncate text-[10px] text-gray-400 dark:text-gray-500">
                        {task.title}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active task output */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">
            {!started && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">🤖</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {tasks.length} tasks listas para construirse
                </p>
                <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
                  El Lead Developer implementará cada task en orden: leerá specs, explorará el repo, escribirá código y commiteará automáticamente.
                </p>
              </div>
            )}

            {currentTask && (
              <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                  <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                    {currentTask.task_key} — {currentTask.title}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ActiveTaskRunner
                    key={currentTask.id}
                    projectId={projectId}
                    task={currentTask}
                    onDone={handleTaskDone}
                  />
                </div>
              </div>
            )}

            {allFinished && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">{successCount === tasks.length ? '🎉' : '⚠️'}</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Sesion completada
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {successCount} de {tasks.length} tasks implementadas exitosamente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {!started && (
            <button
              onClick={handleStart}
              disabled={tasks.length === 0}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              Iniciar Build Session — {tasks.length} tasks
            </button>
          )}
          {allFinished && (
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Cerrar
            </button>
          )}
          {started && !allFinished && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Construyendo task {currentIdx + 1} de {tasks.length}... no cerrar esta ventana
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
