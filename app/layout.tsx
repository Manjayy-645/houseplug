import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ScrollToTop } from "@/components/ui/scroll-to-top"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "HousePlug | Find Student Housing Near Your Campus",
  description: "Verified rooms and apartments for students across Port Harcourt universities. Secure your next home with confidence."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-on-background`}>
        {children}
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}

