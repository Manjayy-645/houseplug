import type { Metadata } from "next";
import { Mail, ShieldAlert } from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Contact Support | HousePlug",
  description:
    "Get in touch with the HousePlug support team. Inquire about student listings, verification, landlord partnerships, or report a safety issue.",
  alternates: {
    canonical: "https://www.houseplug.ng/contact",
  },
  openGraph: {
    title: "Contact Support | HousePlug",
    description:
      "Need help with student housing or landlord verification? Reach out to the HousePlug support team.",
    url: "https://www.houseplug.ng/contact",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Support | HousePlug",
    description:
      "Get in touch with HousePlug support in Port Harcourt, Nigeria.",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ]}
      />
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-[#1B4332]">Contact Us</h1>
        <p className="mt-4 text-lg text-gray-600">
          Have questions or need help? We&apos;re here for you.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Email</h3>
          <a href="mailto:support@houseplug.ng" className="mt-2 inline-block break-all text-[#1B4332] underline underline-offset-4">support@houseplug.ng</a>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Report a concern</h3>
          <p className="mt-2 text-sm text-gray-500">Tell us about a listing or service issue.</p>
          <a href="/report" className="mt-3 inline-block font-semibold text-[#1B4332] underline underline-offset-4">Open report form</a>
        </div>
      </div>
    </div>
  );
}
