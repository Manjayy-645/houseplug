import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { HeroSearch } from "@/components/hero-search"
import { ListingCard } from "@/components/listing-card"
import { CheckCircle2, Users, BadgeCheck, Search, MessageCircle, Home, ArrowRight, MapPin, Plus } from "lucide-react"
import { ActivityTicker } from "@/components/home/activity-ticker"
import { TrendingStrip } from "@/components/home/trending-strip"
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
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[540px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-primary-container">
          <div className="absolute inset-0 opacity-40">
            <Image 
              src="/hero-student-housing.jpg" 
              alt="Student housing near Nigerian university campus"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 md:px-20 text-center py-16 sm:py-20 md:py-0">
            <h1 className="font-display-lg text-white mb-4 md:mb-6 text-[2rem] sm:text-[2.5rem] leading-[1.1] md:text-6xl max-w-4xl mx-auto font-black drop-shadow-sm">
              Find Your Perfect Student Home
            </h1>
            <p className="font-body-lg text-white/90 mb-6 sm:mb-8 md:mb-12 max-w-2xl mx-auto opacity-100 text-sm sm:text-base md:text-lg px-1">
              Verified rooms and apartments for students across Nigerian universities. Secure your next home with confidence.
            </p>
            
            <HeroSearch />

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 px-1">
              <Link 
                href="/signup" 
                className="bg-white text-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-black hover:bg-gray-50 transition shadow-xl shadow-black/10 active:scale-95 flex-1 md:flex-none text-center text-sm sm:text-base"
              >
                Sign up to start listing
              </Link>
              <Link 
                href="/browse" 
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold hover:bg-white/20 transition active:scale-95 flex-1 md:flex-none text-center text-sm sm:text-base"
              >
                View all listings
              </Link>
            </div>
          </div>
        </section>

        <ActivityTicker />

        {/* Trust Bar */}
        <section className="py-6 sm:py-8 md:py-12 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-20">
            <div className="flex flex-col md:flex-row items-center justify-center md:divide-x divide-gray-100 gap-4 sm:gap-6 md:gap-0">
              <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 w-full md:w-1/3">
                <div className="bg-emerald-50 p-3 sm:p-3.5 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                  <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-bold text-gray-800 text-sm md:text-base">500+ Verified Listings</span>
              </div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 w-full md:w-1/3 border-t md:border-t-0 border-gray-50 md:border-transparent">
                <div className="bg-blue-50 p-3 sm:p-3.5 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-bold text-gray-800 text-sm md:text-base">Trusted by Students Across PH</span>
              </div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 w-full md:w-1/3 border-t md:border-t-0 border-gray-50 md:border-transparent">
                <div className="bg-amber-50 p-3 sm:p-3.5 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-bold text-gray-800 text-sm md:text-base">Landlords Verified by ID</span>
              </div>
            </div>
          </div>
        </section>

        {/* Partners/Universities Section */}
        <section className="bg-gray-50 py-10 sm:py-12 md:py-16 border-b border-gray-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-0 md:px-4">
            <div className="text-center mb-6 sm:mb-8 px-5">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">
                Housing for Students at
              </h2>
            </div>
            
            <div className="flex flex-row items-center justify-start md:justify-center gap-3 sm:gap-4 overflow-x-auto pb-4 sm:pb-6 px-5 md:px-0 scrollbar-hide snap-x">
              {UNIVERSITIES.map((uni) => (
                <Link 
                  key={uni.id}
                  href={`/browse?university=${uni.id}`}
                  className="flex flex-col items-center gap-3 sm:gap-4 bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100 min-w-[150px] sm:min-w-[180px] md:min-w-[220px] transition-all hover:shadow-xl hover:-translate-y-2 active:scale-95 group snap-center"
                >
                  <UniversityLogo university={uni} size={48} />
                  <div className="text-center">
                    <p className="font-bold text-primary group-hover:text-hp-amber transition-colors text-sm sm:text-base">
                      {uni.shortName}
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[140px] truncate">
                      {uni.name}
                    </p>
                  </div>
                </Link>
              ))}
              
              {/* More Coming Soon Card */}
              <div className="flex flex-col items-center gap-3 bg-gray-50/50 rounded-xl p-5 sm:p-6 border-2 border-dashed border-gray-200 min-w-[140px] sm:min-w-[160px] md:min-w-[200px] opacity-60">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-400 text-sm">More Coming</p>
                  <p className="text-[10px] text-gray-400">Expanding soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrendingStrip />

        {/* Featured Listings */}
        <section className="py-10 sm:py-16 md:py-24 max-w-7xl mx-auto px-5 sm:px-6 md:px-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 sm:mb-10 md:mb-14 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-2 sm:mb-3 tracking-tight">Rooms Near Campus</h2>
              <p className="text-gray-500 font-medium text-sm sm:text-base md:text-lg">Handpicked quality accommodation across Nigerian Universities.</p>
            </div>
            {featuredListings.length > 0 && (
              <Link href="/browse" className="text-primary font-bold hover:text-hp-amber transition-colors flex items-center gap-2 bg-primary/5 px-5 py-2.5 rounded-full w-full md:w-auto justify-center text-sm sm:text-base">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-gutter">
              {featuredListings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing as Listing} index={index} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-100 py-12 sm:py-20 px-5 sm:px-6 text-center shadow-sm">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 text-gray-200">
                <Home className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1B4332] mb-2 sm:mb-3">No listings available yet</h3>
              <p className="text-gray-500 max-w-lg mx-auto mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed">
                HousePlug is launching soon! Be the first landlord to list your property and connect with students from UNIPORT, RSU, and IAUE.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/signup" className="bg-[#F59E0B] text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:brightness-105 transition shadow-lg shadow-amber-200 active:scale-95">
                  Start Listing Today
                </Link>
                <Link href="/browse" className="bg-white border-2 border-gray-100 text-gray-600 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-gray-50 transition active:scale-95">
                  Browse All
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-20 md:py-32 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-20">
            <div className="text-center mb-10 sm:mb-16 md:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Finding a home is easy</h2>
              <div className="h-1.5 w-20 sm:w-24 bg-[#F59E0B] mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-12">
              <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-5 sm:mb-8 text-blue-600 rotate-3 transition-transform group-hover:rotate-6">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 sm:mb-4">1. Search</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm sm:text-base">Browse through hundreds of verified listings near campus with high-quality photos and clear prices.</p>
              </div>
              <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-5 sm:mb-8 text-amber-600 -rotate-3 transition-transform group-hover:-rotate-6">
                  <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 sm:mb-4">2. Contact</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm sm:text-base">Connect directly with landlords and agents via WhatsApp or phone. No hidden platform commissions.</p>
              </div>
              <div className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center mb-5 sm:mb-8 text-emerald-600 rotate-3 transition-transform group-hover:rotate-6">
                  <Home className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-3 sm:mb-4">3. Move In</h3>
                <p className="text-gray-500 font-medium leading-relaxed text-sm sm:text-base">Schedule a physical inspection, pay securely, and settle into your perfect new student home.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roommate Banner */}
        <section className="py-10 sm:py-16 md:py-24 max-w-7xl mx-auto px-5 sm:px-6 md:px-20">
          <div className="bg-gradient-to-br from-[#1B4332] to-emerald-900 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
            
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-amber-300 font-bold text-xs sm:text-sm mb-4 sm:mb-6 border border-white/10">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> New Feature
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                Looking for a <span className="text-[#F59E0B]">Roommate?</span>
              </h2>
              <p className="text-emerald-50 text-base sm:text-lg mb-6 sm:mb-8 opacity-90 leading-relaxed">
                Split the rent and make a new friend. Browse verified roommate requests from students near your campus or create your own request today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <Link 
                  href="/roommates" 
                  className="bg-[#F59E0B] text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Find Roommates
                </Link>
                <Link 
                  href="/roommates/new" 
                  className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center text-sm sm:text-base"
                >
                  Post a Request
                </Link>
              </div>
            </div>
            
            <div className="relative z-10 w-full md:w-1/3 flex justify-center">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64">
                <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse opacity-20"></div>
                <div className="absolute inset-4 bg-emerald-500 rounded-full opacity-40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-14 sm:py-20 md:py-32 bg-[#1B4332] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-800/30 via-transparent to-transparent"></div>
          <div className="max-w-4xl mx-auto text-center px-5 sm:px-6 relative z-10">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight">Ready to find your next home?</h2>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100/90 mb-8 sm:mb-10 font-medium max-w-2xl mx-auto">Don&apos;t wait until the semester starts. Secure your spot today.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <Link 
                href="/browse" 
                className="bg-[#F59E0B] text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-base sm:text-lg"
              >
                Browse Listings
              </Link>
              <Link 
                href="/signup" 
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full hover:bg-white/20 transition-all active:scale-95 text-base sm:text-lg"
              >
                List Your Property
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-10 sm:py-12 px-5 sm:px-6 md:px-20 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 sm:gap-12 max-w-7xl mx-auto">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Image src="/logo.png" alt="HousePlug Logo" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold text-primary">HousePlug</span>
            </div>
            <p className="text-sm text-gray-500 mb-4 sm:mb-6">Student housing, simplified. We connect students with reliable accommodation across Nigerian Universities.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-12 md:grid-cols-3">
            <div>
              <h4 className="font-bold text-primary mb-4 sm:mb-6 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li><Link href="/about" className="text-sm text-gray-500 hover:text-primary transition-all">About Us</Link></li>
                <li><Link href="/signup" className="text-sm text-gray-500 hover:text-primary transition-all">List Property</Link></li>
                <li><Link href="/contact" className="text-sm text-gray-500 hover:text-primary transition-all">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-primary mb-4 sm:mb-6 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li><Link href="/safety" className="text-sm text-gray-500 hover:text-primary transition-all">Safety Guide</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 hover:text-primary transition-all">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-primary transition-all">Privacy Policy</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold text-primary mb-4 sm:mb-6 text-sm uppercase tracking-wider">Community</h4>
              <a
                href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-xl p-3.5 transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#128C5E] group-hover:text-[#075E54] transition-colors">Join Our Channel</p>
                  <p className="text-xs text-gray-500">Listings & housing updates</p>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-100 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
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
