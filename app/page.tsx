import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { HeroSearch } from "@/components/hero-search"
import { ListingCard } from "@/components/listing-card"
import { CheckCircle2, Users, BadgeCheck, Search, MessageCircle, Home, ArrowRight, MapPin } from "lucide-react"
import type { Listing } from "@/types"

export const revalidate = 3600 // revalidate once per hour

export default async function LandingPage() {
  // Placeholder featured listings since DB is empty
  const featuredListings: Partial<Listing>[] = [
    {
      id: "1",
      title: "Green Court Annex",
      room_type: "self_con",
      price_yearly: 85000,
      distance_from_gate: "under_5",
      photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800"],
      status: "active",
      is_featured: true,
      landlord: { full_name: "Mr. Okezie" } as any
    },
    {
      id: "2",
      title: "Aluu Scholar Lodge",
      room_type: "one_bedroom",
      price_yearly: 120000,
      distance_from_gate: "5_to_15",
      photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800"],
      status: "active",
      is_featured: true,
      landlord: { full_name: "Estate Mgt" } as any
    },
    {
      id: "3",
      title: "Abuja Campus Suites",
      room_type: "shared",
      price_yearly: 60000,
      distance_from_gate: "under_5",
      photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800"],
      status: "active",
      is_featured: true,
      landlord: { full_name: "Mrs. Benson" } as any
    }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-primary-container">
          <div className="absolute inset-0 opacity-40">
            <Image 
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1600" 
              alt="Student housing"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-20 text-center">
            <h1 className="font-display-lg text-white mb-6 text-4xl md:text-6xl max-w-4xl mx-auto leading-tight">
              Find Your Perfect Student Home Near UniPort
            </h1>
            <p className="font-body-lg text-on-primary-container mb-12 max-w-2xl mx-auto opacity-90">
              Verified rooms and apartments trusted by University of Port Harcourt students. Secure your next home with confidence.
            </p>
            
            <HeroSearch />
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-5 md:px-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex items-center justify-center gap-4 p-4">
                <div className="bg-primary-fixed p-3 rounded-full flex items-center justify-center text-primary">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <span className="font-title-md text-primary">500+ Verified Listings</span>
              </div>
              <div className="flex items-center justify-center gap-4 p-4 border-y md:border-y-0 md:border-x border-gray-100">
                <div className="bg-primary-fixed p-3 rounded-full flex items-center justify-center text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <span className="font-title-md text-primary">Trusted by 2,000+ Students</span>
              </div>
              <div className="flex items-center justify-center gap-4 p-4">
                <div className="bg-primary-fixed p-3 rounded-full flex items-center justify-center text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="font-title-md text-primary">Landlords Verified by ID</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-20 max-w-7xl mx-auto px-5 md:px-20">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display-md text-primary mb-2">Rooms Near Campus</h2>
              <p className="text-gray-500 font-body-md">Handpicked quality accommodation in Choba, Abuja, and Aluu.</p>
            </div>
            <Link href="/browse" className="text-primary font-semibold hover:underline hidden md:flex items-center gap-2">
              View all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing as Listing} />
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-5 md:px-20">
            <div className="text-center mb-16">
              <h2 className="font-display-md text-primary mb-4">Finding a home is easy</h2>
              <div className="h-1 w-20 bg-secondary-container mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="font-title-lg text-primary mb-3">1. Search</h3>
                <p className="text-gray-500 font-body-md text-sm">Browse through hundreds of verified listings near UniPort with high-quality photos and clear prices.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="font-title-lg text-primary mb-3">2. Contact</h3>
                <p className="text-gray-500 font-body-md text-sm">Connect directly with landlords via WhatsApp or phone. No agents, no hidden commissions.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Home className="h-8 w-8" />
                </div>
                <h3 className="font-title-lg text-primary mb-3">3. Move In</h3>
                <p className="text-gray-500 font-body-md text-sm">Schedule a physical inspection, pay securely, and settle into your perfect new student home.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary">
          <div className="max-w-4xl mx-auto text-center px-5">
            <h2 className="font-display-md text-white mb-6">Ready to find your next home?</h2>
            <p className="font-body-lg text-on-primary-container mb-10 opacity-80">Don't wait until the semester starts. Secure your spot today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/browse" 
                className="bg-secondary-container text-primary font-bold px-10 py-4 rounded-lg hover:shadow-lg transition-all active:scale-95"
              >
                Browse Listings
              </Link>
              <Link 
                href="/signup" 
                className="bg-transparent border border-white/20 text-white font-bold px-10 py-4 rounded-lg hover:bg-white/10 transition-all"
              >
                List Your Property
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 px-5 md:px-20 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 max-w-7xl mx-auto">
          <div className="max-w-xs">
            <span className="text-lg font-bold text-primary block mb-4">HousePlug</span>
            <p className="text-sm text-gray-500 mb-6">Student housing, simplified. We connect University of Port Harcourt students with reliable accommodation.</p>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <h4 className="font-bold text-primary mb-6 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-4">
                <li><Link href="/about" className="text-sm text-gray-500 hover:text-primary transition-all">About Us</Link></li>
                <li><Link href="/signup" className="text-sm text-gray-500 hover:text-primary transition-all">List Property</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-primary transition-all">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-6 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-4">
                <li><Link href="/safety" className="text-sm text-gray-500 hover:text-primary transition-all">Safety Guide</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-all">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-primary transition-all">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 HousePlug. Built for Nigerian students.</p>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Port Harcourt, Nigeria</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
