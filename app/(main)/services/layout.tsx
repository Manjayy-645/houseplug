import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Campus Services, Artisans & Movers in Nigeria",
  description:
    "Find trusted plumbers, electricians, carpenters, painters, and movers near UniPort, RSU, IAUE, and KenPoly. Verified campus service providers for students and landlords.",
  alternates: {
    canonical: "https://www.houseplug.ng/services",
  },
  openGraph: {
    title: "Campus Services & Artisans | HousePlug",
    description:
      "Find trusted student campus services, movers, plumbers, and electricians near Port Harcourt universities.",
    url: "https://www.houseplug.ng/services",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Services & Artisans | HousePlug",
    description:
      "Find verified artisans, campus movers, and repair services for university students.",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Campus Services", url: "/services" },
        ]}
      />
      {children}
    </>
  );
}
