import Link from "next/link"
import { headers } from "next/headers"
import { Header } from "@/components/header"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMaintenance = headers().get("x-maintenance-mode") === "active"

  return (
    <div className="flex min-h-screen flex-col">
      {isMaintenance && (
        <aside
          aria-label="Maintenance Mode Notice"
          className="bg-amber-500 text-white text-xs sm:text-sm font-bold py-2 px-4 text-center sticky top-0 z-[100] flex items-center justify-center gap-2 shadow-md"
        >
          <span>
            🛠️ <strong>Maintenance Mode Active:</strong> Public visitors are blocked. You are viewing the platform with Administrator / Developer bypass.
          </span>
        </aside>
      )}
      <Header />
      <div className="flex-1">
        {children}
      </div>
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <p className="text-sm text-gray-500">© 2026 HousePlug Nigeria. All rights reserved.</p>
            <nav aria-label="Footer legal and safety links" className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-medium text-gray-500">
              <Link href="/terms" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                Terms &amp; Refund Policy
              </Link>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <Link href="/privacy" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <Link href="/safety" className="hover:text-primary transition-colors underline-offset-4 hover:underline">
                Safety Guide
              </Link>
            </nav>
          </div>
          <a
            href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C5E] text-xs font-bold px-3.5 py-2 rounded-full transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            Join our WhatsApp Channel
          </a>
        </div>
      </footer>
    </div>
  )
}
