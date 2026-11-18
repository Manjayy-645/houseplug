import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

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
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Services & Artisans | HousePlug",
    description:
      "Find movers, cleaners and repair services near campus.",
    images: [DEFAULT_OG_IMAGE.url],
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
