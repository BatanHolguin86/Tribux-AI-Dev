'use client'

import { useState } from 'react'
import { type DynamicToolUIPart, type UITools, type ToolUIPart, getToolName } from 'ai'

type AnyToolPart = DynamicToolUIPart | ToolUIPart<UITools>

const TOOL_META: Record<string, { emoji: string; label: string; colorKey: string }> = {
  read_file: { emoji: '📄', label: 'Leyendo archivo', colorKey: 'blue' },
  list_files: { emoji: '📁', label: 'Listando archivos', colorKey: 'blue' },
  search_code: { emoji: '🔍', label: 'Buscando en el codigo', colorKey: 'blue' },
  get_ci_status: { emoji: '🔄', label: 'Verificando CI', colorKey: 'blue' },
  get_ci_logs: { emoji: '📋', label: 'Leyendo logs de CI', colorKey: 'orange' },
  trigger_ci: { emoji: '▶️', label: 'Iniciando CI', colorKey: 'green' },
  edit_file: { emoji: '🖊️', label: 'Editando archivo', colorKey: 'green' },
  write_files: { emoji: '✏️', label: 'Escribiendo archivos', colorKey: 'green' },
  execute_sql: { emoji: '🗄️', label: 'Ejecutando SQL', colorKey: 'orange' },
  read_spec: { emoji: '📋', label: 'Leyendo specs KIRO', colorKey: 'purple' },
  get_knowledge_base: { emoji: '🧠', label: 'Consultando base de conocimiento', colorKey: 'violet' },
  save_to_memory: { emoji: '💾', label: 'Guardando en memoria', colorKey: 'violet' },
}

const COLOR_CLASSES: Record<string, string> = {
  blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300',
  orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
  purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
  violet: 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300',
  error: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300',
  gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

function getArgPreview(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const entries = Object.entries(input as Record<string, unknown>)
  const first = entries.find(([, v]) => typeof v === 'string')
  if (!first) return ''
  const val = String(first[1])
  return `${first[0]}: ${val.length > 50 ? val.slice(0, 50) + '…' : val}`
}

type ToolCallRendererProps = {
  part: AnyToolPart
}

export function ToolCallRenderer({ part }: ToolCallRendererProps) {
  const [expanded, setExpanded] = useState(false)

  const toolName = getToolName(part)
  const meta = TOOL_META[toolName] ?? {
    emoji: '⚙️',
    label: toolName,
    colorKey: 'gray',
  }

  // Cast to access union fields safely
  const p = part as {
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
  }

  const isRunning = p.state === 'input-streaming' || p.state === 'input-available'
  const isDone = p.state === 'output-available'
  const isError = p.state === 'output-error'

  const colorKey = isError ? 'error' : meta.colorKey
  const colorCls = COLOR_CLASSES[colorKey] ?? COLOR_CLASSES.gray
  const argPreview = getArgPreview(p.input)

  return (
    <div className={`my-1 rounded-md border text-xs ${colorCls}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
      >
        <span aria-hidden>{meta.emoji}</span>
        <span className="font-medium">{meta.label}</span>

        {argPreview && (
          <span className="ml-1 max-w-[180px] truncate font-mono opacity-60">
            {argPreview}
          </span>
        )}

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {isRunning && (
            <span className="flex items-center gap-1 opacity-70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              ejecutando…
            </span>
          )}
          {isDone && <span className="opacity-70">✓ listo</span>}
          {isError && <span className="font-medium">✗ error</span>}
          <svg
            className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-current/20 px-3 py-2">
          {p.input !== undefined && (
            <div>
              <p className="mb-1 font-semibold opacity-60">Argumentos</p>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap font-mono opacity-80">
                {typeof p.input === 'string'
                  ? p.input
                  : JSON.stringify(p.input, null, 2)}
              </pre>
            </div>
          )}
          {isDone && p.output !== undefined && (
            <div>
              <p className="mb-1 font-semibold opacity-60">Resultado</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono opacity-80">
                {typeof p.output === 'string'
                  ? p.output.slice(0, 3000)
                  : JSON.stringify(p.output, null, 2).slice(0, 3000)}
              </pre>
            </div>
          )}
          {isError && p.errorText && (
            <div>
              <p className="mb-1 font-semibold opacity-60">Error</p>
              <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap font-mono opacity-80">
                {p.errorText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
