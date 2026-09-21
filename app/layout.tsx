import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { MobileNav } from "@/components/mobile-nav"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "HousePlug | Find Student Housing Near Your Campus",
  description: "Verified rooms and apartments for students across Nigerian universities. Secure your next home with confidence.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-on-background pb-16 md:pb-0`}>
        {children}
        <MobileNav />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}

