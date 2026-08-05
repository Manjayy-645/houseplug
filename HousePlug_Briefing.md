# HousePlug — Project Briefing & Overview

## 1. Executive Summary
HousePlug is a dedicated student housing platform designed specifically for Nigerian university students. The platform addresses the critical challenge of finding reliable off-campus housing by connecting students directly with verified listings. HousePlug operates under the domain **houseplug.ng**. The name incorporates the Nigerian slang "Plug," signifying a trusted source or connection.

## 2. Target Audience & Scope
- **Primary Users:** Students at Nigerian universities seeking off-campus accommodation.
- **Secondary Users:** Landlords and property managers looking to list their properties to a targeted student demographic.
- **Geographic Scope (Initial Focus):** Universities in Port Harcourt, Rivers State:
  - University of Port Harcourt (UniPort) - Choba
  - Rivers State University (RSU) - Nkpolu
  - Ignatius Ajuru University of Education (IAUE) - Rumuola
  - Ken Saro-Wiwa Polytechnic (KenPoly) - Bori

## 3. Core Features & User Roles
### Student Role
- Browse and search for verified housing listings.
- Location search via free text (address, area, landmark).
- Distance metrics provided relative to the nearest university gate.
- Direct contact with landlords via WhatsApp (`wa.me/234XXXXXXXXXX`).
- Ability to leave reviews on properties.

### Landlord Role
- Create and manage property listings through a dedicated dashboard.
- Upgrade listing visibility through premium subscription plans.

### Admin Role
- Full access to manage the platform.
- Review, approve, or reject property listings to maintain quality and trust.

## 4. Monetization Strategy
The platform employs a freemium model with subscription tiers and a verification fee handled via **Paystack (Nigerian Naira)**.

- **Free Plan:** Unlimited standard listings.
- **Pro Plan (₦5,000/month or annual):** Featured badge, priority placement, AI-generated descriptions, and full analytics.
- **Business Plan (₦15,000/month or annual):** Top-of-search placement, CSV data export, and a dedicated account manager.
- **Verification Fee:** A ₦2,000 one-time fee to verify a listing, establishing trust (available on any plan).

## 5. Technology Stack & Architecture
- **Framework:** Next.js 14 App Router (TypeScript, Server Components default)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Radix UI primitives, lucide-react
- **Backend & Database:** Supabase (Auth, Postgres DB, Storage)
- **Form Handling:** react-hook-form coupled with Zod for robust validation
- **Payments:** Paystack API
- **Deployment:** Vercel

## 6. Design & Brand Identity
- **Primary Color:** Green (`#1B4332`)
- **Accent Color:** Amber (`#F59E0B`)
- **Background:** Light Gray (`#F9FAFB`)
- **Text:** Dark Gray (`#111827`)
- **Verified Badge:** Emerald (`#10B981`)
- **Vibe:** Modern, trustworthy, and fast.

## 7. Current Project Constraints & "Out of Scope" (MVP)
- **No In-App Messaging:** All communication is routed directly to WhatsApp.
- **No In-App Booking:** Direct contact with the landlord only; no transaction flow for rent inside the app.
- **No Map Integrations:** No Google Maps or Leaflet. Distance is text-based based on the nearest university gate.
