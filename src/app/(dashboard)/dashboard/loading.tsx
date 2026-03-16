export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Toolbar skeleton */}
      <div className="mt-6 flex items-center gap-4">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Card skeletons */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
            <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                <div key={j} className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
