export default function DesignsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
