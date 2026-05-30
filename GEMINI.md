# HousePlug — Project Instructions

## What this project is
HousePlug is a student housing platform for Nigerian university students. It connects students to verified off-campus housing listings. "Plug" is Nigerian slang for a trusted connect/source.

## Domain
houseplug.ng

## Tech Stack
- **Framework:** Next.js 14 App Router (TypeScript)
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Storage)
- **UI Components:** shadcn/ui + Radix UI primitives
- **Icons:** lucide-react
- **Form Handling:** react-hook-form + zod
- **Payments:** Paystack (Nigerian)
- **Deployment:** Vercel

## Design System & Branding
- **Primary Green:** #1B4332
- **Accent Amber:** #F59E0B
- **Background:** #F9FAFB
- **Text:** #111827
- **Verified Badge:** #10B981

## Core Engineering Rules
- **Routing:** Always use App Router (`/app`), never the Pages router.
- **Rendering:** Use Server Components by default. Use `"use client"` only for interactivity.
- **Data Fetching:** Never use `useEffect` for data fetching. Use Server Components or Server Actions.
- **Validation:** Always validate forms with Zod.
- **Formatting:** Always format prices in Nigerian Naira using `.toLocaleString('en-NG')`.
- **Phone Numbers:** Nigerian format required: `080`/`081`/`070`/`090` + 8 digits.
- **WhatsApp Links:** Always use the format `wa.me/234XXXXXXXXXX`.
- **Geographic Scope:** Listings can be near any Port Harcourt university.
- **Distance:** Distance is from the nearest university gate — use university shortName.
- **Universities:** UniPort (Choba), RSU (Nkpolu), IAUE (Rumuola), KenPoly (Bori).
- **Imports:** Import UNIVERSITIES constant from @/lib/constants.ts — never hardcode university names.
- **Search:** Location search is free text (address, area, and landmark) via `ilike`.
- **Communication:** No in-app messaging. Use WhatsApp directly.
- **Booking:** No in-app booking system for MVP. Direct contact with landlord only.
- **Maps:** No map integration for MVP. Text-based distance only.

## User Roles & Permissions
- **student:** Browse, search, contact landlords, leave reviews.
- **landlord:** Create/manage listings, view dashboard, upgrade plans.
- **admin:** Full access, approve/reject listings.

## Monetization Model
- **Free Plan:** Unlimited listings, standard placement.
- **Pro Plan:** ₦5,000/month or annual via Paystack. Everything in Free + featured badge, priority placement, AI descriptions, and full analytics.
- **Business Plan:** ₦15,000/month or annual. Everything in Pro + top of search, CSV export, and dedicated account manager.
- **Verification:** ₦2,000 one-time fee (available on any plan).

## Workspace Architecture
- `/app/(main)/` — Public student-facing pages.
- `/app/(auth)/` — Authentication (Login, Signup, Recovery).
- `/app/landlord/` — Landlord dashboard (Protected).
- `/app/admin/` — Admin panel (Protected).
- `/app/api/` — API routes.
- `/components/ui/` — Reusable UI primitives.
- `/components/listing/` — Listing-specific components.
- `/components/landlord/` — Dashboard components.
- `/lib/supabase/` — Supabase client/server helpers.
- `/types/index.ts` — Shared TypeScript types (import from `@/types`).

## Constraints & Prohibitions
- **NO** Pages router.
- **NO** mapping libraries (Google Maps, Leaflet, etc.).
- **NO** in-app chat systems.
- **NO** data fetching in `useEffect`.
- **NO** skipping Zod validation.
- **NO** hardcoded API keys or secrets.
