export default function KnowledgeLoading() {
  return (
    <div className="flex h-[var(--content-height)] flex-col gap-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Search + tabs skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="w-80 shrink-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-3 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-50 dark:bg-gray-800/50" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50 dark:bg-gray-800/50" />
            </div>
          ))}
        </div>
        <div className="flex-1 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900" />
      </div>
    </div>
  )
}
