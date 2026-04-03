'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F4F8] text-sm dark:bg-[#0F2B46]">
        🧠
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[#E2E8F0] bg-white px-4 py-3 dark:border-[#1E3A55] dark:bg-[#0F2B46]">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#0EA5A3] [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#0EA5A3] [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[#0EA5A3] [animation-delay:300ms]" />
      </div>
    </div>
  )
}
