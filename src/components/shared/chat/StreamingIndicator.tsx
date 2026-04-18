'use client'

export function StreamingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-sm dark:bg-brand-primary">
        🧠
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-brand-border bg-white px-4 py-3 dark:border-brand-border-dark dark:bg-brand-primary">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-teal [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-teal [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand-teal [animation-delay:300ms]" />
      </div>
    </div>
  )
}
