import { Header } from "@/components/header"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>© 2026 HousePlug Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
