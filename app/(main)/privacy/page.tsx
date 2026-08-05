import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | HousePlug",
  description: "Privacy Policy for HousePlug platform.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20 min-h-screen">
      <h1 className="text-4xl font-display-md text-primary mb-8">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="mb-6 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">We collect information you provide directly to us when you create an account, update your profile, use the interactive features of our services, participate in contests, promotions or surveys, request customer support or otherwise communicate with us.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. Use of Information</h2>
        <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, to process transactions, and to communicate with you about products, services, offers, promotions, and events.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Sharing of Information</h2>
        <p className="mb-4">We may share information about you as described in this Privacy Policy, such as with vendors, consultants and other service providers who need access to such information to carry out work on our behalf.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Contact Us</h2>
        <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at support@houseplug.ng.</p>
      </div>
    </div>
  )
}
