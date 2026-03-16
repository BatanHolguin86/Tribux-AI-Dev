'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[10px] font-bold text-gray-600 shadow-sm ring-1 ring-gray-200">
        AI
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
      </div>
    </div>
  )
}
