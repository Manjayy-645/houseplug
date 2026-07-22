# HousePlug 🔌

> Your trusted housing plug — a verified student housing 
> marketplace for Nigerian university students.

Live at **[houseplug.ng](https://houseplug.ng)**

---

## What is HousePlug?

HousePlug connects university students in Port Harcourt 
with verified landlords and agents offering off-campus 
accommodation. Students find housing safely and directly 
— no scams, no hidden fees, no middlemen.

Currently serving:
- University of Port Harcourt (UniPort)
- Rivers State University (RSU)
- Ignatius Ajuru University of Education (IAUE)
- Ken Saro-Wiwa Polytechnic (KenPoly)

---

## Features

### For Students
- Search and filter listings by university, area, price, 
  and room type
- View photos and video tours of properties
- See verified landlord/agent badges for trust
- Contact landlords directly via WhatsApp
- Leave reviews after your stay

### For Landlords & Agents
- Create unlimited listings with photos and video
- AI-powered listing description generator
- 30-day free Pro trial on signup
- Subscription plans (Free, Pro, Business)
- Listing boosts (Featured, Urgent, Refresh)
- Identity verification for a Verified badge
- Dashboard with listing analytics
- Agent fee transparency (none/fixed/negotiable)

### For Admins
- Listing approval and rejection queue
- User management and verification review
- Revenue and analytics dashboard
- Platform settings (prices, limits)
- Audit logs
- Create listings on behalf of landlords/agents

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend/DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Payments | Paystack |
| Media | Cloudinary (photos + video) |
| AI | Groq (Llama 3.3) |
| Email | Resend |
| Hosting | Vercel |
| Icons | lucide-react |

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm
- Supabase account
- Paystack account
- Cloudinary account
- Groq API key
- Resend account

### Installation

```bash
git clone https://github.com/Manjayy-645/houseplug
cd houseplug
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
GROQ_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_PHOTO_PRESET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=HousePlug
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## User Roles

| Role | Access |
|---|---|
| Student | Browse listings, contact landlords, leave reviews |
| Landlord | Create listings, manage properties, subscribe |
| Agent | Same as landlord + agent fee fields on listings |
| Admin | Approve listings, verify landlords, manage users |
| Super Admin | Full platform control including revenue and settings |

---

## Monetization

- **Pro Plan** — ₦5,000/month (featured placement, AI, analytics)
- **Business Plan** — ₦15,000/month (always top, CSV export, dedicated support)
- **Listing Boosts** — Featured 7d, Featured 30d, Urgent, Refresh
- **Verification Fee** — ₦2,000 one-time

All new landlords and agents receive a **30-day free Pro trial** on signup.

---

## Deployment

Deployed on **Vercel** with automatic deployments from the 
`main` branch.

Domain: [houseplug.ng](https://houseplug.ng)

---

## License

Private — all rights reserved.

---

Built by **Ezekiel Manji** — Engineering Student, 
University of Port Harcourt 🇳🇬
