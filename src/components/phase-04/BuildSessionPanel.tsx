'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
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
import type { AgentType } from '@/types/agent'
import { buildExecutionPlan, type ExecutionPlan, type PlannedTask } from '@/lib/build/orchestrator'
import { useFounderMode } from '@/hooks/useFounderMode'

type TaskStatus = 'waiting' | 'building' | 'done' | 'failed'

// ─── Sub-component: runs one task via useChat ────────────────────────────────

function ActiveTaskRunner({
  projectId,
  task,
  agentType,
  onDone,
}: {
  projectId: string
  task: TaskWithFeature
  agentType: AgentType
  onDone: (taskId: string, success: boolean) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/projects/${projectId}/phases/4/actions/auto-build-task`,
      fetch: async (url, init) => {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        return fetch(url as string, {
          ...init,
          body: JSON.stringify({ ...body, taskId: task.id, agentType }),
        })
      },
    }),
    onFinish() { onDone(task.id, true) },
    onError() { onDone(task.id, false) },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true
      void sendMessage({ text: `Build ${task.task_key}` })
    }
  }, [task.task_key, sendMessage])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isLoading])

  const { hideCode } = useFounderMode()

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {hideCode ? 'Hubo un problema. Reintentando...' : `Error: ${error.message}`}
      </div>
    )
  }

  // Founder mode: simple progress instead of tool calls
  if (hideCode) {
    const toolCount = messages.reduce((count, msg) => {
      const parts = msg.parts as UIMessagePart<UIDataTypes, UITools>[]
      return count + parts.filter(isToolUIPart).length
    }, 0)

    return (
      <div className="flex items-center gap-3 py-2">
        {isLoading ? (
          <>
            <svg className="h-5 w-5 animate-spin text-[#0EA5A3]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-[#0F2B46] dark:text-gray-300">
              Construyendo... ({toolCount} pasos completados)
            </span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-[#10B981]">Listo</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="max-h-48 space-y-1 overflow-y-auto">
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
                <p className="line-clamp-2 whitespace-pre-wrap">{text}</p>
              </div>
            )}
          </div>
        )
      })}
      {isLoading && <StreamingIndicator />}
    </div>
  )
}

// ─── Agent badge ─────────────────────────────────────────────────────────────

const AGENT_LABELS: Record<string, { label: string; cls: string }> = {
  lead_developer: { label: 'Dev', cls: 'bg-[#E8F4F8] text-[#0F2B46] dark:bg-[#0F2B46]/30 dark:text-[#0EA5A3]' },
  db_admin: { label: 'DB', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  qa_engineer: { label: 'QA', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  devops_engineer: { label: 'Ops', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

const STATUS_CONFIG: Record<TaskStatus, { icon: string; cls: string }> = {
  waiting: { icon: '◦', cls: 'text-gray-400' },
  building: { icon: '●', cls: 'text-[#0EA5A3] animate-pulse' },
  done: { icon: '✓', cls: 'text-green-500' },
  failed: { icon: '✗', cls: 'text-red-500' },
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
  const plan = useMemo(() => buildExecutionPlan(tasks), [tasks])
  const [started, setStarted] = useState(false)
  const [currentTierIdx, setCurrentTierIdx] = useState(0)
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, 'waiting' as TaskStatus])),
  )

  const doneCount = Object.values(taskStatuses).filter((s) => s === 'done' || s === 'failed').length
  const successCount = Object.values(taskStatuses).filter((s) => s === 'done').length
  const allFinished = started && doneCount === tasks.length

  const currentTier = plan.tiers[currentTierIdx]
  const tierTaskIds = new Set(currentTier?.tasks.map((t) => t.task.id) ?? [])
  const tierDone = currentTier?.tasks.every((t) => {
    const s = taskStatuses[t.task.id]
    return s === 'done' || s === 'failed'
  }) ?? false

  // Auto-advance to next tier when current is done
  useEffect(() => {
    if (started && tierDone && currentTierIdx < plan.tiers.length - 1) {
      const id = requestAnimationFrame(() => {
        const nextIdx = currentTierIdx + 1
        setCurrentTierIdx(nextIdx)
        const nextTier = plan.tiers[nextIdx]
        setTaskStatuses((prev) => {
          const updated = { ...prev }
          for (const t of nextTier.tasks) updated[t.task.id] = 'building'
          return updated
        })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [started, tierDone, currentTierIdx, plan.tiers])

  function handleStart() {
    setStarted(true)
    // Mark first tier tasks as building (parallel)
    setTaskStatuses((prev) => {
      const updated = { ...prev }
      for (const t of plan.tiers[0].tasks) updated[t.task.id] = 'building'
      return updated
    })
  }

  const handleTaskDone = useCallback(
    (taskId: string, success: boolean) => {
      setTaskStatuses((prev) => ({ ...prev, [taskId]: success ? 'done' : 'failed' }))
      if (success) onTaskStatusChange(taskId, 'review')
    },
    [onTaskStatusChange],
  )

  // Get active (building) tasks for current tier
  const activeTasks = currentTier?.tasks.filter((t) => taskStatuses[t.task.id] === 'building') ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F4F8] dark:bg-[#0F2B46]/40">
            <span className="text-base">🏗️</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Build Session — {tasks.length} tasks en {plan.tiers.length} tiers
            </p>
            {started && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {successCount} completadas · {doneCount - successCount} fallidas · Tier {currentTierIdx + 1}/{plan.tiers.length}
              </p>
            )}
          </div>
          {allFinished && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">✓ Completada</span>
          )}
          <button
            onClick={onClose}
            disabled={started && !allFinished}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        {started && (
          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-[#E8F4F8]0 transition-all duration-500"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Left: Execution plan */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-100 p-3 dark:border-gray-800">
            {plan.tiers.map((tier, tierIdx) => (
              <div key={tier.tier} className="mb-4">
                <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-wide ${
                  tierIdx === currentTierIdx && started
                    ? 'text-[#0F2B46] dark:text-[#0EA5A3]'
                    : tierIdx < currentTierIdx
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  Tier {tierIdx + 1}: {tier.label}
                  {tier.parallel && <span className="ml-1 text-[9px] font-normal">(paralelo)</span>}
                </p>
                <div className="space-y-0.5">
                  {tier.tasks.map((pt) => {
                    const status = taskStatuses[pt.task.id]
                    const cfg = STATUS_CONFIG[status]
                    const agentCfg = AGENT_LABELS[pt.agent] ?? AGENT_LABELS['lead_developer']
                    return (
                      <div
                        key={pt.task.id}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                          status === 'building' ? 'bg-[#E8F4F8] dark:bg-[#0F2B46]/20' : ''
                        }`}
                      >
                        <span className={`shrink-0 font-bold ${cfg.cls}`}>{cfg.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-gray-700 dark:text-gray-300">
                            {pt.task.task_key}
                          </span>
                          <span className="block truncate text-[10px] text-gray-400">{pt.task.title}</span>
                        </div>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${agentCfg.cls}`}>
                          {agentCfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Active task runners */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {!started && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">🤖</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {tasks.length} tasks organizadas en {plan.tiers.length} tiers
                </p>
                <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
                  Cada tier se ejecuta en paralelo. El siguiente tier empieza cuando el anterior termina.
                  Los agentes se asignan automaticamente segun el tipo de tarea.
                </p>
              </div>
            )}

            {started && activeTasks.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#0F2B46] dark:text-[#0EA5A3]">
                  Tier {currentTierIdx + 1}: {currentTier?.label} — {activeTasks.length} task(s) en paralelo
                </p>
                {activeTasks.map((pt) => (
                  <div key={pt.task.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E8F4F8]0" />
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {pt.task.task_key} — {pt.task.title}
                      </span>
                      <span className={`ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        (AGENT_LABELS[pt.agent] ?? AGENT_LABELS['lead_developer']).cls
                      }`}>
                        {(AGENT_LABELS[pt.agent] ?? AGENT_LABELS['lead_developer']).label}
                      </span>
                    </div>
                    <ActiveTaskRunner
                      key={pt.task.id}
                      projectId={projectId}
                      task={pt.task}
                      agentType={pt.agent}
                      onDone={handleTaskDone}
                    />
                  </div>
                ))}
              </div>
            )}

            {allFinished && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">{successCount === tasks.length ? '🎉' : '⚠️'}</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sesion completada</p>
                <p className="text-xs text-gray-500">{successCount} de {tasks.length} tasks implementadas</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {!started && (
            <button
              onClick={handleStart}
              className="w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33]"
            >
              Iniciar Build Session — {plan.tiers.length} tiers, {tasks.length} tasks
            </button>
          )}
          {allFinished && (
            <button onClick={onClose} className="w-full rounded-lg bg-[#0F2B46] py-2.5 text-sm font-medium text-white hover:bg-[#0A1F33]">
              Cerrar
            </button>
          )}
          {started && !allFinished && (
            <p className="text-center text-xs text-gray-400">
              Tier {currentTierIdx + 1}/{plan.tiers.length} en progreso... no cerrar esta ventana
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
