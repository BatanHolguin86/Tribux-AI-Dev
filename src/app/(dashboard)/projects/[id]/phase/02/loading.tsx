export default function Phase02Loading() {
  return (
    <div>
      {/* Progress bar skeleton */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-2 w-32 animate-pulse rounded-full bg-gray-200" />
      </div>

      {/* Split view skeleton */}
      <div className="flex h-[calc(100vh-14rem)] gap-4">
        {/* Left: Chat skeleton */}
        <div className="flex flex-[6] flex-col rounded-lg border border-gray-200 bg-white">
          {/* Section nav skeleton */}
          <div className="flex gap-2 border-b border-gray-100 px-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-32 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>

          {/* Messages skeleton */}
          <div className="flex-1 space-y-4 px-4 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`h-16 animate-pulse rounded-lg ${
                    i % 2 === 0 ? 'w-2/3 bg-violet-50' : 'w-3/4 bg-gray-100'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Input skeleton */}
          <div className="border-t border-gray-100 p-3">
            <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>

        {/* Right: Document skeleton */}
        <div className="hidden flex-[4] flex-col rounded-lg border border-gray-200 bg-white p-4 lg:flex">
          <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-100" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
