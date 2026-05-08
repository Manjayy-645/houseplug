export default function BrowseLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 h-14 animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
          <div className="hidden h-[540px] animate-pulse rounded-2xl bg-gray-200 lg:block" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-44 animate-pulse bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-9 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
