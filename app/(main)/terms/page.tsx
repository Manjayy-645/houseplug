import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  FileText,
  Mail,
  MapPin,
} from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Terms of Service & Refund Policy | HousePlug",
  description:
    "Terms of Service, payment terms, and refund policy for HousePlug Nigeria (houseplug.ng).",
  alternates: {
    canonical: "https://www.houseplug.ng/terms",
  },
  openGraph: {
    title: "Terms of Service & Refund Policy | HousePlug",
    description: "Terms of Service and payment terms for HousePlug Nigeria.",
    url: "https://www.houseplug.ng/terms",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12 md:py-20 min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]}
      />
      {/* Header */}
      <div className="border-b border-gray-100 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold px-3 py-1 rounded-full mb-4">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal & Compliance</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#1B4332] tracking-tight mb-4">
          Terms of Service &amp; Refund Policy
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Last updated: October 2026 • Effective immediately across all
          HousePlug Nigeria services.
        </p>
      </div>

      <div className="space-y-12 text-gray-700 leading-relaxed">
        {/* Section 1 */}
        <section id="section-1" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              1
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Agreement to Terms &amp; Platform Nature
            </h2>
          </div>
          <div className="space-y-3 pl-11">
            <p>
              Welcome to <strong>HousePlug Nigeria</strong> (accessible online
              via{" "}
              <a
                href="https://www.houseplug.ng"
                className="text-[#1B4332] font-semibold underline underline-offset-2"
              >
                houseplug.ng
              </a>
              ). HousePlug Nigeria is an online campus classifieds directory and
              discovery platform connecting Nigerian university students with
              off-campus accommodation listings, compatible roommates, and
              verified campus service providers.
            </p>
            <p>
              By accessing, browsing, registering for, or using houseplug.ng,
              you acknowledge that you have read, understood, and agree to be
              legally bound by these Terms of Service, our{" "}
              <Link
                href="/privacy"
                className="text-[#1B4332] font-semibold underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              , and our{" "}
              <Link
                href="/safety"
                className="text-[#1B4332] font-semibold underline underline-offset-2"
              >
                Safety Guide
              </Link>
              . If you do not agree to these terms, you must discontinue
              platform use immediately.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              2
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              No Third-Party Rent or Escrow Collection
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <div className="bg-amber-50 border-l-4 border-[#F59E0B] p-4 md:p-5 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div className="text-sm md:text-base text-amber-950 font-medium">
                  <strong>Explicit Non-Escrow Declaration:</strong> HousePlug
                  does NOT act as a real estate broker, payment escrow agent, or
                  rent collector. HousePlug does not collect, hold, or disburse
                  rent, caution fees, inspection fees, or service payments on
                  behalf of landlords, agents, or vendors.
                </div>
              </div>
            </div>
            <p>
              HousePlug is strictly a discovery and advertising platform. We do
              not facilitate financial transactions between students, roommates,
              landlords, property agents, or service providers.
              <strong>
                {" "}
                All rental agreements, lease signings, physical inspections, and
                rental or service transactions happen directly and privately
                between users offline.
              </strong>
            </p>
            <p>
              We strongly urge all students and users to review our{" "}
              <Link
                href="/safety"
                className="text-[#1B4332] font-semibold underline underline-offset-2"
              >
                Safety Guide
              </Link>{" "}
              and never send rent, caution deposits, or inspection fees before
              physically inspecting the property in daylight and confirming
              property credentials directly with the landlord.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              3
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Platform Fees &amp; Payments (Processed via Paystack)
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <p>
              All online payments processed on HousePlug via our payment
              processor, <strong>Paystack</strong>, are strictly first-party
              digital platform service fees paid directly to HousePlug Nigeria
              for platform features and digital services. These fees include:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-[#1B4332] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-[#1B4332] font-bold text-xs mb-3">
                  (a)
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  Identity &amp; KYC Verification
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Processing &amp; manual review fee
                </p>
                <div className="text-lg font-black text-[#1B4332]">
                  ₦2,000{" "}
                  <span className="text-xs font-normal text-gray-500">
                    one-time
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Covers administrative manual verification of government ID
                  (NIN, voter card, driver&apos;s license) and property
                  documentation.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-[#1B4332] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#F59E0B] font-bold text-xs mb-3">
                  (b)
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  Featured Listing &amp; Visibility Boost
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  High-visibility promotional tier
                </p>
                <div className="text-lg font-black text-[#1B4332]">
                  ₦1,500 – ₦4,500{" "}
                  <span className="text-xs font-normal text-gray-500">
                    per campaign
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Pins listings to top search results, homepage carousel, and
                  promotional banners for designated durations (7 to 30 days).
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-[#1B4332] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs mb-3">
                  (c)
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  Campus Service Provider Subscriptions
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  Verified vendor directory tier
                </p>
                <div className="text-lg font-black text-[#1B4332]">
                  ₦2,500 – ₦3,500{" "}
                  <span className="text-xs font-normal text-gray-500">
                    / month
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Allows campus movers, electricians, artisans, and cleaners to
                  advertise services in the dedicated student services hub.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs md:text-sm text-gray-600">
              <CreditCard className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
              <p>
                All platform transactions are denominated in Nigerian Naira (₦)
                and securely processed through
                <strong> Paystack</strong> using industry-standard PCI-DSS
                compliant encryption. HousePlug does not store or handle card
                numbers, CVVs, or bank login credentials directly.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              4
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Refund &amp; Cancellation Policy
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <p>
              We strive to deliver transparent, reliable digital services. Our
              refund and cancellation policy outlines exactly when refunds are
              issued for first-party digital fees:
            </p>

            <div className="space-y-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                <h3 className="font-bold text-emerald-900 text-sm md:text-base flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Refund requests
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm text-emerald-950">
                  <li>
                    <strong>Duplicate Charges:</strong> Accidental double or
                    multiple debits for the same transaction reference or
                    verification package.
                  </li>
                  <li>
                    <strong>Technical Errors:</strong> Payment successfully
                    processed via Paystack, but the paid feature (e.g., listing
                    boost or subscription) failed to activate on our servers and
                    could not be provisioned within 24 hours.
                  </li>
                  <li>
                    <strong>Pre-Review Cancellation:</strong> User submits a
                    written cancellation request before our moderation team
                    begins the manual KYC verification process.
                  </li>
                </ul>
              </div>

              <div className="bg-red-50/60 border border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-900 text-sm md:text-base flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Non-Refundable Services
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm text-red-950">
                  <li>
                    <strong>Completed KYC Reviews:</strong> Once our
                    verification team has performed and completed the manual KYC
                    verification review (whether the application is approved, or
                    rejected due to fraudulent, forged, altered, or
                    unidentifiable documentation), the verification processing
                    fee is strictly non-refundable.
                  </li>
                  <li>
                    <strong>Active or Completed Promotional Campaigns:</strong>{" "}
                    Once a Featured Boost or Visibility campaign has actively
                    begun displaying on the platform and delivering impressions
                    or clicks, the fee is non-refundable.
                  </li>
                  <li>
                    <strong>Terms of Service Violations:</strong> Fees will not
                    be refunded if an account is suspended or terminated due to
                    fraud, deceptive listings, or abusive behavior.
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-[#1B4332]" />
                  Refund Request Process &amp; Timeline
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-2">
                  To request a refund, please send an email to our support team
                  with your payment details:
                </p>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs md:text-sm font-mono text-gray-800 space-y-1 mb-3">
                  <div>
                    <strong>Email:</strong> support@houseplug.ng or
                    ezekielmanji645@gmail.com
                  </div>
                  <div>
                    <strong>Subject:</strong> Refund Request - [Your Paystack
                    Reference]
                  </div>
                  <div>
                    <strong>Required Information:</strong> Full name, registered
                    phone number, date of payment, and brief reason for refund.
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600">
                  <strong>Timeline:</strong> Once reviewed and approved, all
                  refunds are initiated via
                  <strong> Paystack within 24–48 hours</strong> directly back to
                  the original source (bank account or debit card) used during
                  payment. Bank processing times may vary between 1 to 3
                  business days depending on the customer&apos;s financial
                  institution.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              5
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Landlord, Agent &amp; Vendor Verification Rules
            </h2>
          </div>
          <div className="space-y-3 pl-11">
            <p>
              To protect student safety and maintain transparency across campus
              housing, all listing landlords, property managers, independent
              agents, and campus service providers agree to adhere strictly to
              the following standards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
              <li>
                <strong>Accuracy &amp; Authenticity:</strong> You must own,
                manage, or have legitimate written authority to rent out the
                property or provide the advertised service. All photographs,
                rental pricing, and university distance estimates must be
                accurate and truthful.
              </li>
              <li>
                <strong>Zero Tolerance for Fraud:</strong> Submitting fake,
                altered, forged, or third-party KYC documents (such as fake
                NINs, fabricated utility bills, or false identity credentials)
                is strictly illegal.
              </li>
              <li>
                <strong>No Predatory or Extortionate Fees:</strong> Charging
                arbitrary, exorbitant &ldquo;inspection fees&rdquo; to students
                before showing apartments is prohibited on HousePlug.
              </li>
              <li>
                <strong>Account Termination:</strong> Any user found submitting
                fraudulent documents, attempting advance-fee fraud, charging
                unapproved predatory fees, or misrepresenting properties will
                face
                <strong>
                  {" "}
                  immediate and permanent account termination without refund
                </strong>
                , and may be reported to Nigerian law enforcement agencies.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              6
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Contact Information
            </h2>
          </div>
          <div className="space-y-3 pl-11">
            <p>
              If you have any questions, compliance inquiries, feedback, or
              refund requests regarding these Terms of Service, please reach out
              to us:
            </p>
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2.5 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:support@houseplug.ng"
                    className="text-[#1B4332] underline"
                  >
                    support@houseplug.ng
                  </a>{" "}
                  /{" "}
                  <a
                    href="mailto:ezekielmanji645@gmail.com"
                    className="text-[#1B4332] underline"
                  >
                    ezekielmanji645@gmail.com
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Operating Location:</strong> Port Harcourt, Rivers
                  State, Nigeria.
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <FileText className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Official Website:</strong>{" "}
                  <a
                    href="https://www.houseplug.ng"
                    className="text-[#1B4332] underline"
                  >
                    https://www.houseplug.ng
                  </a>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
