import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ServiceDetailView } from "@/components/services/service-detail-view"
import { formatServicePrice, getCategoryLabel } from "@/lib/service-utils"
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/seo/json-ld"
import type { ServiceProvider } from "@/types"

interface ServicePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: service } = await supabase
    .from("service_providers")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!service) {
    return {
      title: "Campus Service | HousePlug",
      description: "Find verified off-campus housing and student services on HousePlug.",
    }
  }

  const categoryLabel = getCategoryLabel(service.category)
  const priceLabel = formatServicePrice(
    service.pricing_type,
    service.price_amount,
    service.price_unit
  )
  const title = `${service.business_name} (${categoryLabel}) | HousePlug Services`
  const description = `${priceLabel} • ${service.university}. ${service.description || ""}`.slice(0, 160)
  const ogImageUrl = `https://houseplug.ng/api/og/service?id=${params.id}`
  const canonicalUrl = `https://houseplug.ng/services/${params.id}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "HousePlug",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const supabase = createClient()
  const { data: service, error } = await supabase
    .from("service_providers")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !service) {
    notFound()
  }

  const categoryLabel = getCategoryLabel(service.category)
  const priceLabel = formatServicePrice(
    service.pricing_type,
    service.price_amount,
    service.price_unit
  )

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Campus Services", url: "/services" },
          { name: service.business_name, url: `/services/${service.id}` },
        ]}
      />
      <ServiceJsonLd
        id={service.id}
        name={service.business_name}
        category={categoryLabel}
        university={service.university}
        description={service.description}
        priceLabel={priceLabel}
      />
      <ServiceDetailView service={service as ServiceProvider} />
    </>
  )
}
