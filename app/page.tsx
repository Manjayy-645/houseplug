import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { HeroSearch } from "@/components/hero-search"
import { ListingCard } from "@/components/listing-card"
import { CheckCircle2, Users, BadgeCheck, Search, MessageCircle, Home, ArrowRight, MapPin, Plus } from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"
import { UniversityLogo } from "@/components/university-logo"
import { createClient } from "@/lib/supabase/server"
import type { Listing } from "@/types"

export const revalidate = 3600 // revalidate once per hour

export default async function LandingPage() {
  const supabase = createClient()
  
  // Fetch real listings pinned to home page, or fallback to latest featured/active listings
  const { data: homeListings } = await supabase
    .from("listings")
    .select(`
      *,
      landlord:profiles(full_name, verification_status, role)
    `)
    .eq("status", "active")
    .eq("show_on_home", true)
    .order("created_at", { ascending: false })
    .limit(3)

  let featuredListings: Listing[] = (homeListings ?? []) as Listing[]

  // Fallback if no listings are explicitly pinned to home
  if (featuredListings.length < 3) {
    const { data: fallbackListings } = await supabase
      .from("listings")
      .select(`
        *,
        landlord:profiles(full_name, verification_status, role)
      `)
      .eq("status", "active")
      .eq("show_on_home", false) // Don't duplicate if already picked
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3 - featuredListings.length)
    
    if (fallbackListings) {
      featuredListings = [...featuredListings, ...(fallbackListings as Listing[])]
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 pt-24 sm:pt-20">
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
              Find Your Perfect Student Home
            </h1>
            <p className="font-body-lg text-on-primary-container mb-12 max-w-2xl mx-auto opacity-90">
              Verified rooms and apartments for students across Port Harcourt universities. Secure your next home with confidence.
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
                <span className="font-title-md text-primary">Trusted by Students Across PH</span>
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

        {/* Partners/Universities Section */}
        <section className="bg-gray-50 py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Housing for Students at
              </h2>
            </div>
            
            <div className="flex flex-row items-center justify-start md:justify-center gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              {UNIVERSITIES.map((uni) => (
                <Link 
                  key={uni.id}
                  href={`/browse?university=${uni.id}`}
                  className="flex flex-col items-center gap-3 bg-white rounded-xl p-6 shadow-sm border border-gray-100 min-w-[160px] md:min-w-[200px] transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 group"
                >
                  <UniversityLogo university={uni} size={48} />
                  <div className="text-center">
                    <p className="font-bold text-primary group-hover:text-hp-amber transition-colors">
                      {uni.shortName}
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[140px] truncate">
                      {uni.name}
                    </p>
                  </div>
                </Link>
              ))}
              
              {/* More Coming Soon Card */}
              <div className="flex flex-col items-center gap-3 bg-gray-50/50 rounded-xl p-6 border-2 border-dashed border-gray-200 min-w-[160px] md:min-w-[200px] opacity-60">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-400">More Coming</p>
                  <p className="text-[10px] text-gray-400">Expanding soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-20 max-w-7xl mx-auto px-5 md:px-20">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display-md text-primary mb-2">Rooms Near Campus</h2>
              <p className="text-gray-500 font-body-md">Handpicked quality accommodation across Port Harcourt.</p>
            </div>
            {featuredListings.length > 0 && (
              <Link href="/browse" className="text-primary font-semibold hover:underline hidden md:flex items-center gap-2">
                View all listings <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing as Listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 py-20 px-6 text-center shadow-sm">
              <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-200">
                <Home className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1B4332] mb-3">No listings available yet</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                HousePlug is launching soon! Be the first landlord to list your property and connect with students from UNIPORT, RSU, and IAUE.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup" className="bg-[#F59E0B] text-white px-10 py-4 rounded-2xl font-black text-lg hover:brightness-105 transition shadow-lg shadow-amber-200 active:scale-95">
                  Start Listing Today
                </Link>
                <Link href="/browse" className="bg-white border-2 border-gray-100 text-gray-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-gray-50 transition active:scale-95">
                  Browse All
                </Link>
              </div>
            </div>
          )}
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
                <p className="text-gray-500 font-body-md text-sm">Browse through hundreds of verified listings near campus with high-quality photos and clear prices.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="font-title-lg text-primary mb-3">2. Contact</h3>
                <p className="text-gray-500 font-body-md text-sm">Connect directly with landlords and agents via WhatsApp or phone. No hidden platform commissions.</p>
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
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="HousePlug Logo" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold text-primary">HousePlug</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Student housing, simplified. We connect students with reliable accommodation across Port Harcourt universities.</p>
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
          <p className="text-sm text-gray-500">© 2025 HousePlug. Built for Nigerian students.</p>
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">Port Harcourt, Nigeria</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
