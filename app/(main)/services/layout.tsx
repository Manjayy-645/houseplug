import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Campus Services, Artisans & Movers in Nigeria",
  description:
    "Find housing-related movers, cleaners, repairers and laundry services near Nigerian campuses. Compare listed prices and contact reviewed providers directly.",
  alternates: {
    canonical: "https://www.houseplug.ng/services",
  },
  openGraph: {
    title: "Campus Services & Artisans | HousePlug",
    description:
      "Explore housing-related services near Nigerian campuses and contact providers directly.",
    url: "https://www.houseplug.ng/services",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Services & Artisans | HousePlug",
    description:
      "Find movers, cleaners and repair services near campus.",
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
