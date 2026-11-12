import { featureFlags } from "@/lib/feature-flags";
import { FunnelTracker } from "@/components/funnel-beacon";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { MobileNav } from "@/components/mobile-nav";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Student Accommodation near UniPort & RSU | HousePlug",
    template: "%s | HousePlug",
  },
  description:
    "Find student accommodation, self-cons and lodges near UniPort, RSU, IAUE and KenPoly. Compare details and contact listing agents directly on WhatsApp.",
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
      "Find off-campus lodges, self-cons, and flatshares near UniPort, RSU, IAUE, and KenPoly. Connect directly with landlords on WhatsApp.",
    images: [
      {
        url: "/icons/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "HousePlug - Student Housing in Port Harcourt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HousePlug | Student Housing Near Campus",
    description:
      "Student lodges and off-campus housing near Nigerian universities. Connect directly with landlords on WhatsApp.",
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
};

export const viewport = {
  themeColor: "#1B4332",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body
        className={`${inter.className} bg-background text-on-background pb-16 md:pb-0`}
      >
        <FunnelTracker
          enabled={process.env.HOUSING_ANALYTICS_ENABLED === "true"}
        />
        <ServiceWorkerRegister />
        {children}
        <InstallPrompt />
        <MobileNav servicesEnabled={featureFlags.services} />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  );
}
