export default function AgentsLoading() {
  return (
    <div className="flex h-[var(--content-height)] gap-4">
      <div className="w-64 flex-shrink-0 space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-2 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
