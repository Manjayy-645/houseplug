import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "About Us — Student Housing in Nigeria",
  description:
    "Learn about HousePlug's mission to eliminate student accommodation stress near Nigerian universities. Compare costs, property checks and direct landlord connections.",
  alternates: {
    canonical: "https://www.houseplug.ng/about",
  },
  openGraph: {
    title: "About HousePlug | Student Housing in Port Harcourt",
    description:
      "HousePlug makes student housing stress-free for Nigerian university students by connecting them directly to off-campus accommodation.",
    url: "https://www.houseplug.ng/about",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About HousePlug",
    description:
      "Making student housing stress-free for Nigerian university students.",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ]}
      />
      <h1 className="text-4xl font-extrabold text-[#1B4332]">
        About HousePlug
      </h1>
      <p className="mt-6 text-lg text-gray-600 leading-relaxed">
        HousePlug was founded in 2026 with a single mission: to make student
        housing stress-free for Nigerian university students. We understand the
        challenges of finding a good room near campus, and we&apos;re here to
        bridge the gap between landlords and students across Port Harcourt.
      </p>
      <p className="mt-4 text-lg text-gray-600 leading-relaxed">
        HousePlug connects students with landlords and agents. Read the scope
        and date of each property check, confirm fees and availability, and
        arrange any inspection directly with the advertiser. Identity checks do
        not guarantee a property’s safety or suitability.
      </p>
    </div>
  );
}
