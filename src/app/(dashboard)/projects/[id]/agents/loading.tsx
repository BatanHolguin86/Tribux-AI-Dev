export default function AgentsLoading() {
  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Agent sidebar skeleton */}
      <div className="w-64 flex-shrink-0 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-2 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area skeleton */}
      <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
              <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          ))}
        </div>

        {/* Input skeleton */}
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
