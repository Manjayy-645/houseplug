import type { Metadata } from "next"
import { Mail, Phone, MapPin } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Contact Support | HousePlug",
  description:
    "Get in touch with the HousePlug support team. Inquire about student listings, verification, landlord partnerships, or report a safety issue.",
  alternates: {
    canonical: "https://houseplug.ng/contact",
  },
  openGraph: {
    title: "Contact Support | HousePlug",
    description:
      "Need help with student housing or landlord verification? Reach out to the HousePlug support team.",
    url: "https://houseplug.ng/contact",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Support | HousePlug",
    description: "Get in touch with HousePlug support in Port Harcourt, Nigeria.",
  },
}

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
        <p className="mt-4 text-lg text-gray-600">Have questions or need help? We're here for you.</p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Email</h3>
          <p className="mt-2 text-gray-500">support@houseplug.ng</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <Phone className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Phone</h3>
          <p className="mt-2 text-gray-500">+234 800 HOUSEPLUG</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-white">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-6 font-bold text-gray-900">Office</h3>
          <p className="mt-2 text-gray-500">Choba, Port Harcourt</p>
        </div>
      </div>
    </div>
  )
}
