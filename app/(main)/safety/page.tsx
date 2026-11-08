import type { Metadata } from "next"
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Student Safety Guide & Anti-Scam Tips",
  description:
    "Essential safety tips for Nigerian university students inspecting off-campus lodges. Never pay before inspection, verify landlord identity, and avoid rental fraud.",
  alternates: {
    canonical: "https://houseplug.ng/safety",
  },
  openGraph: {
    title: "Student Housing Safety Guide | HousePlug",
    description:
      "Essential guidelines and fraud prevention tips for renting off-campus lodges safely near Nigerian universities.",
    url: "https://houseplug.ng/safety",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Housing Safety Guide | HousePlug",
    description: "Never pay before inspection. Tips to avoid student accommodation scams in Nigeria.",
  },
}

const SAFETY_FAQS = [
  {
    question: "Should I ever pay rent before inspecting a lodge?",
    answer: "No. Never pay rent, deposit, or inspection fee before physically inspecting the property during daylight hours.",
  },
  {
    question: "How can I verify a landlord or agent on HousePlug?",
    answer: "Look for the green 'Verified' badge on landlord and agent profiles. Always ask to see valid government-issued ID and property proof before signing any lease.",
  },
  {
    question: "What should I do if I suspect a fraudulent listing?",
    answer: "Report the listing immediately to support@houseplug.ng or via our WhatsApp support channel with the listing link and landlord details.",
  },
]

export default function SafetyGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20 min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Safety Guide", url: "/safety" },
        ]}
      />
      <FaqJsonLd faqs={SAFETY_FAQS} />
      <h1 className="text-4xl font-display-md text-primary mb-8">Safety Guide</h1>
      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="mb-8">Your safety is our top priority at HousePlug. Please follow these guidelines to ensure a secure experience while finding or listing student accommodation.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">For Students</h2>
        <ul className="list-disc pl-5 mb-8 space-y-3">
          <li><strong>Never Pay Before Inspection:</strong> Always inspect the property physically before making any payment. We advise against paying for accommodation you haven&apos;t seen.</li>
          <li><strong>Meet in Public:</strong> When meeting a landlord or agent for the first time, try to meet at the property during daylight hours or in a public place.</li>
          <li><strong>Bring a Friend:</strong> If possible, bring a friend or family member along when inspecting a property.</li>
          <li><strong>Verify Documents:</strong> Ensure the person you are dealing with has the right to rent out the property. Ask for valid identification and relevant documents.</li>
        </ul>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">For Landlords</h2>
        <ul className="list-disc pl-5 mb-8 space-y-3">
          <li><strong>Verify Student ID:</strong> Always ask for a valid student ID and other necessary identification before proceeding with an agreement.</li>
          <li><strong>Use Written Agreements:</strong> Always use formal written agreements and issue receipts for any payments made.</li>
          <li><strong>Be Transparent:</strong> Clearly state all rules, fees, and expectations upfront to avoid misunderstandings later.</li>
        </ul>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">Report Suspicious Activity</h2>
        <p className="mb-4">If you encounter any suspicious activity, listings, or users, please report them to us immediately at support@houseplug.ng.</p>
      </div>
    </div>
  )
}
