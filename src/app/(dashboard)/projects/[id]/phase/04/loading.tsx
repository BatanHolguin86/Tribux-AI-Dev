export default function Phase04Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-2 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
            <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <div key={card} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
                  <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
