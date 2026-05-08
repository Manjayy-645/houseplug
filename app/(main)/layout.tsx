import { Header } from "@/components/header"
import { createClient } from "@/lib/supabase/server"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let role = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    role = profile?.role || "student"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} role={role} />
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
