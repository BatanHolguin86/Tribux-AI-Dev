export default function Phase00Loading() {
  return (
    <div className="flex h-[var(--content-height)] gap-4">
      {/* Left panel skeleton */}
      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
              <div className={`h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${i % 2 === 0 ? 'w-2/3' : 'w-3/4'}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 dark:border-gray-800 p-4">
          <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="hidden w-[40%] flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:flex">
        <div className="border-b border-gray-100 dark:border-gray-800 p-4">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" style={{ width: `${90 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
