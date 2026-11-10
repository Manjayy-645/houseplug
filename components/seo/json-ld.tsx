import React from "react"

function safeJsonLd(schema: unknown) {
  return JSON.stringify(schema).replace(/</g, "\\u003c")
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HousePlug",
    alternateName: "HousePlug Nigeria",
    url: "https://houseplug.ng",
    logo: "https://houseplug.ng/logo.png",
    description: "Verified student housing, lodges, self-cons, and flatshares for Nigerian university students.",
    foundingDate: "2026",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Port Harcourt",
      addressRegion: "Rivers State",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@houseplug.ng",
      availableLanguage: ["en", "English"],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export function WebSiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HousePlug",
    alternateName: "HousePlug Nigeria",
    url: "https://houseplug.ng",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://houseplug.ng/browse?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

interface ListingJsonLdProps {
  id: string
  title: string
  description?: string | null
  priceYearly: number
  roomType: string
  address: string
  area: string
  university: string
  photos?: string[] | null
  amenities?: string[] | null
  createdAt?: string | null
}

export function ListingJsonLd({
  id,
  title,
  description,
  priceYearly,
  roomType,
  address,
  area,
  university,
  photos,
  amenities,
  createdAt,
}: ListingJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    name: title,
    description: description || `${roomType} in ${area} near ${university}. Verified student housing on HousePlug.`,
    url: `https://houseplug.ng/listing/${id}`,
    image: photos && photos.length > 0 ? photos : ["https://houseplug.ng/icons/og-default.jpg"],
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: area,
      addressRegion: "Rivers State",
      addressCountry: "NG",
    },
    offers: {
      "@type": "Offer",
      price: priceYearly,
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      url: `https://houseplug.ng/listing/${id}`,
      validFrom: createdAt || undefined,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: priceYearly,
        priceCurrency: "NGN",
        unitText: "year",
      },
    },
    amenityFeature: amenities?.map((amenity) => ({
      "@type": "LocationFeatureSpecification",
      name: amenity,
      value: true,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `https://houseplug.ng${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export function ProfileJsonLd({
  name,
  username,
  role,
  image,
  description,
}: {
  name: string
  username: string
  role: string
  image?: string | null
  description?: string
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: new Date().toISOString(),
    mainEntity: {
      "@type": "Person",
      name,
      alternateName: username,
      jobTitle: role === "agent" ? "Real Estate Agent" : role === "landlord" ? "Property Owner" : "Student",
      image: image || "https://houseplug.ng/icons/og-default.jpg",
      description: description || `Verified ${role} on HousePlug student housing network.`,
      url: `https://houseplug.ng/landlord/${username}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export function ServiceJsonLd({
  id,
  name,
  category,
  university,
  description,
  priceLabel,
  image,
}: {
  id: string
  name: string
  category: string
  university: string
  description?: string | null
  priceLabel?: string
  image?: string | null
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description: description || `${category} service near ${university}. Verified campus artisan on HousePlug.`,
    url: `https://houseplug.ng/services/${id}`,
    image: image || "https://houseplug.ng/icons/og-default.jpg",
    priceRange: priceLabel || "₦₦",
    address: {
      "@type": "PostalAddress",
      addressLocality: university,
      addressRegion: "Rivers State",
      addressCountry: "NG",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}

export function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  )
}
