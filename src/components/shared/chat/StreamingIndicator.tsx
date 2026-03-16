'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-gray-900/20 ring-1 ring-gray-200 dark:ring-gray-600">
        AI
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800 px-4 py-3 ring-1 ring-gray-100 dark:ring-gray-800">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
      </div>
    </div>
  )
}
