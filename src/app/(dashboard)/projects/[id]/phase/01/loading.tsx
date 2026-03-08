export default function Phase01Loading() {
  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Feature sidebar skeleton */}
      <div className="hidden w-64 shrink-0 flex-col rounded-lg border border-gray-200 bg-white lg:flex">
        <div className="border-b border-gray-100 p-3">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-2 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 gap-4">
        <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-white">
          <div className="flex gap-2 border-b border-gray-100 px-4 py-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-28 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="flex-1 space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                <div className="h-16 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-[40%] rounded-lg border border-gray-200 bg-white lg:block">
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-gray-200" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
