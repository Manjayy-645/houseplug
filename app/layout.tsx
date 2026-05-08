import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "HousePlug | Student Housing Near UniPort",
  description: "Verified rooms and apartments trusted by University of Port Harcourt students. Secure your next home with confidence."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-background text-on-background`}>{children}</body>
    </html>
  )
}

