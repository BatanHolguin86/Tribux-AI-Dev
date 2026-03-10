export default function Phase04Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-2 w-32 animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3">
              {[1, 2, 3].map((card) => (
                <div key={card} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
