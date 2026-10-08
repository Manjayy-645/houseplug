import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { MobileNav } from "@/components/mobile-nav"
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.houseplug.ng"),
  title: "HousePlug | Find Student Housing Near Your Campus",
  description: "Verified rooms and apartments for students across Nigerian universities. Secure your next home with confidence.",
  icons: {
    icon: "/logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport = {
  themeColor: "#1B4332",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-on-background pb-16 md:pb-0`}>
        <ServiceWorkerRegister />
        {children}
        <InstallPrompt />
        <MobileNav />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}

