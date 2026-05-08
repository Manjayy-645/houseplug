export default function ListingDetailLoading() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-[520px] w-full animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,360px]">
          <div className="space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 animate-pulse rounded bg-gray-200" />
              <div className="h-24 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  )
}

