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
  metadataBase: new URL("https://www.houseplug.ng"),
  title: {
    default: "Student Accommodation near UniPort & RSU | HousePlug",
    template: "%s | HousePlug",
  },
  description:
    "Find student accommodation, self-cons and lodges near UniPort, RSU, IAUE and KenPoly. Compare details and contact the listing agent directly on WhatsApp.",
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
    "student accommodation Port Harcourt",
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
    url: "https://www.houseplug.ng",
    siteName: "HousePlug",
    title: "Student Accommodation near UniPort & RSU | HousePlug",
    description:
      "Find off-campus lodges, self-cons and flatshares near UniPort, RSU, IAUE and KenPoly. Contact listing agents directly on WhatsApp.",
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
      "Student lodges and off-campus housing near Port Harcourt universities. Contact agents directly on WhatsApp.",
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

