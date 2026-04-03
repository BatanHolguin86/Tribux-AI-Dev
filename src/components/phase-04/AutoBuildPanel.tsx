'use client'

import { useState, useEffect, useRef } from 'react'
import type { TaskWithFeature } from '@/types/task'

type Stage =
  | 'plan-running'
  | 'plan-ready'
  | 'code-running'
  | 'code-ready'
  | 'committing'
  | 'committed'
  | 'ci-polling'
  | 'ci-done'
  | 'error'

type CommitResult = {
  sha: string
  url: string
  filesChanged: number
  files: string[]
}

type CIResult = {
  status: string
  conclusion: string | null
  html_url: string | null
}

type Props = {
  projectId: string
  task: TaskWithFeature
  isOpen: boolean
  onClose: () => void
  onTaskStatusChange: (taskId: string, status: 'review') => void
}

// Extract // filepath: ... annotations from generated text
function extractFilePaths(text: string): string[] {
  const matches = [...text.matchAll(/\/\/ filepath: (.+)/g)]
  return [...new Set(matches.map((m) => m[1].trim()))]
}

// Stream a POST endpoint and accumulate text
async function streamPost(
  url: string,
  body: Record<string, unknown>,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`HTTP ${res.status}: ${msg.slice(0, 200)}`)
  }
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value, { stream: true })
    onChunk(full)
  }
  return full
}

// Step dot indicator
function StepDot({
  num,
  label,
  status,
}: {
  num: number
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
}) {
  const icon = status === 'done' ? '✓' : status === 'error' ? '✗' : String(num)
  const dotCls =
    status === 'done'
      ? 'bg-green-500 text-white'
      : status === 'error'
        ? 'bg-red-500 text-white'
        : status === 'running'
          ? 'bg-[#E8F4F8]0 text-white animate-pulse'
          : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
  const labelCls =
    status === 'pending'
      ? 'text-gray-400 dark:text-gray-500'
      : 'text-gray-700 dark:text-gray-300'

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dotCls}`}
      >
        {icon}
      </span>
      <span className={`hidden text-xs font-medium sm:block ${labelCls}`}>{label}</span>
    </div>
  )
}

export function AutoBuildPanel({ projectId, task, isOpen, onClose, onTaskStatusChange }: Props) {
  const [stage, setStage] = useState<Stage>('plan-running')
  const [planText, setPlanText] = useState('')
  const [codeText, setCodeText] = useState('')
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null)
  const [ciResult, setCiResult] = useState<CIResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  const ciTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Keep latest codeText accessible in runCommit without stale closure
  const codeRef = useRef('')
  useEffect(() => {
    codeRef.current = codeText
  }, [codeText])

  // Auto-scroll on content changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [planText, codeText, stage, commitResult, ciResult])

  // Cleanup CI polling on unmount
  useEffect(() => {
    return () => {
      if (ciTimerRef.current) clearInterval(ciTimerRef.current)
    }
  }, [])

  async function runAnalysis() {
    setStage('plan-running')
    setPlanText('')
    setErrorMsg(null)
    try {
      await streamPost(
        `/api/projects/${projectId}/phases/4/actions/analyze-task`,
        { taskId: task.id },
        setPlanText,
      )
      setStage('plan-ready')
    } catch (e) {
      setErrorMsg(String(e))
      setStage('error')
    }
  }

  async function runGeneration() {
    setStage('code-running')
    setCodeText('')
    setErrorMsg(null)
    try {
      await streamPost(
        `/api/projects/${projectId}/phases/4/actions/generate-task-code`,
        { taskId: task.id },
        setCodeText,
      )
      setStage('code-ready')
    } catch (e) {
      setErrorMsg(String(e))
      setStage('error')
    }
  }

  async function runCommit() {
    setStage('committing')
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/4/actions/commit-task-files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, generatedText: codeRef.current }),
      })
      if (!res.ok) {
        const msg = await res.json() as { message?: string }
        throw new Error(msg.message ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as CommitResult
      setCommitResult(data)
      setStage('committed')
    } catch (e) {
      setErrorMsg(String(e))
      setStage('error')
    }
  }

  function startCIPolling() {
    setStage('ci-polling')
    const poll = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/phases/5/actions/ci-status`)
        if (!res.ok) return
        const data = (await res.json()) as CIResult
        setCiResult(data)
        if (data.status === 'completed' || data.status === 'not_found') {
          if (ciTimerRef.current) clearInterval(ciTimerRef.current)
          setStage('ci-done')
        }
      } catch {
        // keep polling
      }
    }
    void poll()
    ciTimerRef.current = setInterval(() => void poll(), 5000)
  }

  // Auto-start analysis when panel opens
  useEffect(() => {
    if (isOpen && !startedRef.current) {
      startedRef.current = true
      void runAnalysis()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  const filePaths = extractFilePaths(codeText)
  const ciPassed = ciResult?.conclusion === 'success'
  const ciFailed = ciResult?.conclusion === 'failure'

  // Compute step statuses from current stage
  const stageOrder: Stage[] = [
    'plan-running', 'plan-ready',
    'code-running', 'code-ready',
    'committing', 'committed',
    'ci-polling', 'ci-done',
  ]
  const si = stageOrder.indexOf(stage) // -1 when stage === 'error'

  type StepStatus = 'pending' | 'running' | 'done' | 'error'
  const stepStatuses: [StepStatus, StepStatus, StepStatus, StepStatus] =
    stage === 'error'
      ? [
          planText ? 'done' : 'error',
          planText && codeText ? 'done' : planText ? 'error' : 'pending',
          codeText && commitResult ? 'done' : codeText ? 'error' : 'pending',
          commitResult ? 'error' : 'pending',
        ]
      : [
          si >= 1 ? 'done' : 'running',
          si >= 3 ? 'done' : si >= 2 ? 'running' : 'pending',
          si >= 5 ? 'done' : si === 4 ? 'running' : 'pending',
          si >= 7 ? 'done' : si >= 6 ? 'running' : 'pending',
        ]

  const isRunning = ['plan-running', 'code-running', 'committing', 'ci-polling'].includes(stage)
  const runningLabel: Record<string, string> = {
    'plan-running': '🔍 Analizando codebase...',
    'code-running': '🤖 Generando código...',
    committing: '📦 Commiteando al repositorio...',
    'ci-polling': '🔄 Verificando CI cada 5s...',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <span className="text-lg">🏗️</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Build Iterativo — {task.task_key}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          <StepDot num={1} label="Análisis" status={stepStatuses[0]} />
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <StepDot num={2} label="Generación" status={stepStatuses[1]} />
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <StepDot num={3} label="Commit" status={stepStatuses[2]} />
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <StepDot num={4} label="CI" status={stepStatuses[3]} />
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">

          {/* Step 1: Plan */}
          {planText && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                📋 Plan de implementación
              </p>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                  {planText}
                </pre>
                {stage === 'plan-running' && (
                  <span className="mt-1 block animate-pulse text-xs text-blue-500">Analizando...</span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Generated code */}
          {codeText && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                🤖 Código generado
              </p>
              {filePaths.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {filePaths.map((fp) => (
                    <span
                      key={fp}
                      className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {fp}
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-44 overflow-y-auto rounded-lg bg-gray-950 p-3">
                <pre className="text-xs text-gray-300">{codeText.slice(-2500)}</pre>
                {stage === 'code-running' && (
                  <span className="mt-1 block animate-pulse text-xs text-[#0EA5A3]">▌</span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Commit result */}
          {commitResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/30 dark:bg-green-950/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✓ {commitResult.filesChanged} archivos commiteados
              </p>
              <a
                href={commitResult.url}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block text-xs text-green-600 hover:underline dark:text-green-500"
              >
                SHA: {commitResult.sha.slice(0, 8)} — Ver en GitHub →
              </a>
            </div>
          )}

          {/* Step 4: CI */}
          {(stage === 'ci-polling' || stage === 'ci-done') && (
            <div
              className={`rounded-lg border p-3 ${
                ciPassed
                  ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20'
                  : ciFailed
                    ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20'
              }`}
            >
              {!ciResult?.conclusion ? (
                <p className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  CI ejecutándose...
                </p>
              ) : ciPassed ? (
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ CI pasó exitosamente
                </p>
              ) : ciFailed ? (
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">✗ CI falló</p>
                  {ciResult.html_url && (
                    <a
                      href={ciResult.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block text-xs text-red-600 hover:underline dark:text-red-400"
                    >
                      Ver logs en GitHub →
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sin CI configurado — puedes revisar manualmente
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Footer: approval gates */}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {/* Gate 1: CEO approves plan → generate code */}
          {stage === 'plan-ready' && (
            <div className="flex gap-2">
              <button
                onClick={() => void runGeneration()}
                className="flex-1 rounded-lg bg-[#0F2B46] py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1F33]"
              >
                ✓ Aprobar Plan — Generar Código
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Gate 2: CEO approves generated code → commit */}
          {stage === 'code-ready' && (
            <div className="flex gap-2">
              <button
                onClick={() => void runCommit()}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                ✓ Aplicar al Repo
                {filePaths.length > 0 ? ` (${filePaths.length} archivos)` : ''}
              </button>
              <button
                onClick={() => void runGeneration()}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                🔄 Regenerar
              </button>
            </div>
          )}

          {/* Gate 3: CEO decides to check CI */}
          {stage === 'committed' && (
            <button
              onClick={startCIPolling}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              → Verificar CI
            </button>
          )}

          {/* Gate 4: CEO approves as Review (or retries if CI failed) */}
          {stage === 'ci-done' && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onTaskStatusChange(task.id, 'review')
                  onClose()
                }}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                ✓ Aprobar — Mover a Review
              </button>
              {ciFailed && (
                <button
                  onClick={() => void runGeneration()}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  🔄 Corregir y Regenerar
                </button>
              )}
            </div>
          )}

          {/* Error recovery */}
          {stage === 'error' && (
            <div className="flex gap-2">
              <button
                onClick={() => void runAnalysis()}
                className="flex-1 rounded-lg bg-[#0F2B46] py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1F33]"
              >
                🔄 Reintentar desde el inicio
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Running indicator */}
          {isRunning && (
            <p className="text-center text-xs text-gray-400">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#0EA5A3] align-middle" />
              {runningLabel[stage]}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
