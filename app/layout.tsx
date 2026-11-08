import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { MobileNav } from "@/components/mobile-nav"
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import { GlobalServiceBadge } from "@/components/services/global-service-badge"

import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://houseplug.ng"),
  title: {
    default: "HousePlug | Verified Student Housing & Lodges in Nigeria",
    template: "%s | HousePlug",
  },
  description:
    "Find verified off-campus student accommodation, self-cons, and lodges near UniPort, RSU, IAUE, and KenPoly. Direct WhatsApp contact with verified landlords & agents.",
  keywords: [
    "student housing Nigeria",
    "UniPort lodges",
    "UniPort accommodation",
    "RSU student housing",
    "IAUE off campus lodge",
    "KenPoly student hostel",
    "Port Harcourt student lodges",
    "self con in Choba",
    "student apartments Nigeria",
    "verified landlords Port Harcourt",
    "student roommates UniPort",
    "HousePlug Nigeria",
  ],
  authors: [{ name: "HousePlug Technologies" }],
  creator: "HousePlug",
  publisher: "HousePlug",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://houseplug.ng",
    siteName: "HousePlug",
    title: "HousePlug | Verified Student Housing Near Your Campus",
    description:
      "Find verified off-campus lodges, self-cons, and flatshares near UniPort, RSU, IAUE, and KenPoly. Connect directly with verified landlords on WhatsApp.",
    images: [
      {
        url: "/icons/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "HousePlug - Verified Student Housing in Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HousePlug | Verified Student Housing Near Campus",
    description:
      "Verified student lodges and off-campus housing near Nigerian universities. Connect directly with landlords on WhatsApp.",
    images: ["/icons/og-default.jpg"],
    creator: "@houseplugng",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport = {
  themeColor: "#1B4332",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={`${inter.className} bg-background text-on-background pb-16 md:pb-0`}>
        <ServiceWorkerRegister />
        {children}
        <InstallPrompt />
        <GlobalServiceBadge />
        <MobileNav />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}

