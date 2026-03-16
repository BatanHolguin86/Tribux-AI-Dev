export default function Phase03Loading() {
  return (
    <div>
      {/* Progress bar skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-2 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Checklist skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div>
                <div className="h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-1 h-3 w-56 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" style={{ width: `${70 - j * 10}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
