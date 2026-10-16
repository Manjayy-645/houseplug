import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ServiceDetailView } from "@/components/services/service-detail-view"
import { formatServicePrice, getCategoryLabel } from "@/lib/service-utils"
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
  const ogImageUrl = `https://www.houseplug.ng/api/og/service?id=${params.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.houseplug.ng/services/${params.id}`,
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

  return <ServiceDetailView service={service as ServiceProvider} />
}
