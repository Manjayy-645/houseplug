import type { ReactNode } from "react"

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#1B4332]">HousePlug</h1>
            <p className="mt-2 text-sm text-gray-600">Your trusted housing plug 🔌</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
