import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | HousePlug",
  description: "Terms of Service for HousePlug platform.",
}

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-20 min-h-screen">
      <h1 className="text-4xl font-display-md text-primary mb-8">Terms of Service</h1>
      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="mb-6 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">1. Agreement to Terms</h2>
        <p className="mb-4">By accessing or using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">2. User Responsibilities</h2>
        <p className="mb-4">You are responsible for your use of the services and for any content you provide, including compliance with applicable laws, rules, and regulations. You should only provide content that you are comfortable sharing with others.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">3. Platform Rules</h2>
        <p className="mb-4">You agree not to engage in any prohibited conduct, including but not limited to, violating any laws, infringing on any intellectual property rights, or interfering with the operation of the platform.</p>
        
        <h2 className="text-2xl font-bold text-primary mt-8 mb-4">4. Termination</h2>
        <p className="mb-4">We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
      </div>
    </div>
  )
}
