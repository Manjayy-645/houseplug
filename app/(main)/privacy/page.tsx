import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  CreditCard,
  Mail,
  MapPin,
  Eye,
} from "lucide-react";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Privacy Policy | HousePlug",
  description:
    "Privacy policy, data collection, and payment security standards for HousePlug Nigeria (houseplug.ng).",
  alternates: {
    canonical: "https://www.houseplug.ng/privacy",
  },
  openGraph: {
    title: "Privacy Policy | HousePlug",
    description:
      "Data protection and privacy guidelines for HousePlug Nigeria.",
    url: "https://www.houseplug.ng/privacy",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-12 md:py-20 min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy" },
        ]}
      />
      {/* Header */}
      <div className="border-b border-gray-100 pb-8 mb-10">
        <div className="inline-flex items-center gap-2 bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold px-3 py-1 rounded-full mb-4">
          <Eye className="w-3.5 h-3.5" />
          <span>Privacy &amp; Data Protection</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#1B4332] tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Last updated: October 2026 • HousePlug Nigeria (houseplug.ng)
        </p>
      </div>

      <div className="space-y-12 text-gray-700 leading-relaxed">
        {/* Introduction */}
        <section className="space-y-3">
          <p>
            At <strong>HousePlug Nigeria</strong> (&ldquo;HousePlug&rdquo;,
            &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we
            prioritize the privacy, safety, and confidentiality of students,
            landlords, agents, and campus service providers using our platform.
            This Privacy Policy outlines how we collect, handle, store, and
            safeguard your personal information and compliance data when you
            visit or interact with{" "}
            <a
              href="https://www.houseplug.ng"
              className="text-[#1B4332] font-semibold underline underline-offset-2"
            >
              houseplug.ng
            </a>
            .
          </p>
        </section>

        {/* Section 1: Information We Collect */}
        <section id="information-collected" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              1
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Information We Collect
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <p>
              To provide a trusted, secure platform for student accommodation
              discovery, we collect the following categories of information:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#1B4332]" />
                  Account &amp; Profile Details
                </h3>
                <ul className="text-xs md:text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Full Name:</strong> Required during registration to
                    identify your account.
                  </li>
                  <li>
                    <strong>Email Address:</strong> Used for account recovery,
                    transaction receipts, and important alerts.
                  </li>
                  <li>
                    <strong>Phone &amp; WhatsApp Number:</strong> Enables
                    direct, offline contact between students and verified
                    landlords/vendors.
                  </li>
                  <li>
                    <strong>University Affiliation:</strong> Selected Nigerian
                    university campus (e.g., UniPort, RSU, IAUE, KenPoly) to
                    customize local search results.
                  </li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  KYC &amp; Verification Documents
                </h3>
                <ul className="text-xs md:text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Government Identification:</strong> National
                    Identity Number (NIN), Voter&apos;s Card, Driver&apos;s
                    License, or International Passport for landlords, agents,
                    and service providers.
                  </li>
                  <li>
                    <strong>Student Identification:</strong> Valid University
                    Student ID card or admission documentation for student
                    badges and roommate requests.
                  </li>
                  <li>
                    <strong>Proof of Representation:</strong> Property ownership
                    receipts or authorization letters to verify legitimate
                    tenancy rights.
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-500">
              We also automatically collect standard technical logs, such as IP
              addresses, browser types, and session cookies to keep you signed
              in securely and prevent malicious bot abuse.
            </p>
          </div>
        </section>

        {/* Section 2: Payment Data Security */}
        <section id="payment-security" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              2
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Payment Data Security (Processed by Paystack)
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 md:p-5 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-sm md:text-base text-emerald-950 font-medium">
                  <strong>Zero Card Data Storage:</strong> All card payments,
                  Nigerian bank transfers, and USSD transactions on HousePlug
                  are securely processed by <strong>Paystack</strong>. HousePlug
                  never collects, handles, or stores raw debit/credit card
                  numbers or CVV details on its servers.
                </div>
              </div>
            </div>

            <p>
              When you pay for digital platform services (such as Identity &amp;
              KYC Verification or Listing Boosts), your sensitive payment data
              is transmitted directly through encrypted SSL/TLS channels to
              Paystack, a licensed payment processor certified under the global{" "}
              <strong>
                Payment Card Industry Data Security Standard (PCI-DSS Level 1)
              </strong>
              .
            </p>
            <p>
              HousePlug receives only a secure transaction reference, payment
              status confirmation, and timestamps to activate your requested
              service. Your bank login details, PINs, OTPs, and card security
              codes remain strictly protected by Paystack&apos;s financial-grade
              infrastructure.
            </p>
          </div>
        </section>

        {/* Section 3: Data Usage & Protection */}
        <section id="data-usage" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              3
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Data Usage &amp; Protection
            </h2>
          </div>
          <div className="space-y-4 pl-11">
            <p>
              We treat all submitted personal information and identity records
              with high confidentiality. We use your data specifically for the
              following legitimate purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
              <li>
                <strong>Identity Verification &amp; Fraud Prevention:</strong>{" "}
                KYC documents submitted by landlords, agents, and campus service
                providers are used strictly for manual identity verification and
                fraud prevention to protect university students from rental
                scams.
              </li>
              <li>
                <strong>Restricted Administrative Access:</strong> KYC documents
                are stored securely in access-controlled, encrypted storage.
                Only designated compliance and trust officers have authorization
                to review identity documents during verification.
              </li>
              <li>
                <strong>Platform Functionality &amp; Communication:</strong> We
                display contact numbers only to authenticated or intended users
                wishing to connect regarding accommodation or services.
              </li>
              <li>
                <strong>No Data Monetization:</strong> HousePlug does{" "}
                <em>not</em> sell, rent, or trade your personal information or
                contact details to third-party advertisers or marketing agencies
                under any circumstances.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: Data Retention & User Rights */}
        <section id="user-rights" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              4
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Data Retention &amp; User Rights
            </h2>
          </div>
          <div className="space-y-3 pl-11">
            <p>
              In accordance with the Nigeria Data Protection Act (NDPA) and
              applicable privacy regulations, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm">
              <li>
                Access and review personal information associated with your
                HousePlug account.
              </li>
              <li>
                Request correction or updates to inaccurate profile details.
              </li>
              <li>
                Request the permanent deletion of your account and associated
                listings.
              </li>
            </ul>
            <p className="text-xs md:text-sm text-gray-500">
              Note: Certain transaction logs and verification audit records may
              be retained for statutory periods required by Nigerian regulatory
              authorities for financial recordkeeping and fraud investigation.
            </p>
          </div>
        </section>

        {/* Section 5: Contact Us */}
        <section id="contact-us" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1B4332] text-white text-sm font-bold">
              5
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#1B4332]">
              Contact Us
            </h2>
          </div>
          <div className="space-y-3 pl-11">
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or your data protection rights, please contact our
              data compliance team:
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
                  <strong>Location:</strong> Port Harcourt, Rivers State,
                  Nigeria.
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <CreditCard className="w-4 h-4 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Related Policy:</strong>{" "}
                  <Link href="/terms" className="text-[#1B4332] underline">
                    Terms of Service &amp; Refund Policy
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
