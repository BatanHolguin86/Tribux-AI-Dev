export default function Phase02Loading() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-1.5 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="flex h-[var(--content-height)] gap-4">
        <div className="flex flex-[6] flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 px-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div className="flex-1 space-y-4 px-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-16 animate-pulse rounded-lg ${i % 2 === 0 ? 'w-2/3 bg-[#E8F4F8] dark:bg-[#0F2B46]/20' : 'w-3/4 bg-gray-100 dark:bg-gray-800'}`} />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 p-3">
            <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        <div className="hidden flex-[4] flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 lg:flex">
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
