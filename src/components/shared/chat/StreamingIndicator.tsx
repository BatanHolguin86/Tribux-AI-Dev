'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/30 ring-1 ring-violet-100 dark:ring-violet-800/50">
        🧠
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800 px-4 py-3 ring-1 ring-gray-100 dark:ring-gray-700">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
      </div>
    </div>
  )
}
