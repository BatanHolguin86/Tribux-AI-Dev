'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 shadow-sm dark:shadow-gray-900/20 ring-1 ring-violet-200/50 dark:ring-violet-700/50">
        🧠
      </div>
      <div>
        <p className="mb-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
          CTO Virtual
        </p>
        <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-white dark:bg-gray-800/80 px-4 py-3.5 ring-1 ring-gray-150 dark:ring-gray-700/80 shadow-sm">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
