import { MetadataRoute } from "next"
import { createServiceClient, createClient } from "@/lib/supabase/server"
import { UNIVERSITIES } from "@/lib/constants"

export const revalidate = 3600 // regenerate sitemap at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://houseplug.ng"
  const now = new Date()

  // 1. Core static marketing and discovery pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/roommates`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/safety`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // 2. University-specific browse landing URLs (high search intent for students)
  const universityRoutes: MetadataRoute.Sitemap = UNIVERSITIES.map((uni) => ({
    url: `${baseUrl}/browse?university=${uni.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }))

  // 3. Dynamic routes from Supabase
  let listingRoutes: MetadataRoute.Sitemap = []
  let roommateRoutes: MetadataRoute.Sitemap = []
  let serviceRoutes: MetadataRoute.Sitemap = []
  let landlordRoutes: MetadataRoute.Sitemap = []

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createServiceClient()
      : createClient()

    const [listingsRes, roommatesRes, servicesRes, landlordsRes] = await Promise.all([
      supabase
        .from("listings")
        .select("id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(2000),

      supabase
        .from("roommate_profiles")
        .select("id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("service_providers")
        .select("id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1000),

      supabase
        .from("profiles")
        .select("username, created_at")
        .in("role", ["landlord", "agent"])
        .not("username", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000),
    ])

    if (listingsRes.data) {
      listingRoutes = listingsRes.data.map((item) => ({
        url: `${baseUrl}/listing/${item.id}`,
        lastModified: item.created_at ? new Date(item.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }))
    }

    if (roommatesRes.data) {
      roommateRoutes = roommatesRes.data.map((item) => ({
        url: `${baseUrl}/roommates/${item.id}`,
        lastModified: item.created_at ? new Date(item.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }

    if (servicesRes.data) {
      serviceRoutes = servicesRes.data.map((item) => ({
        url: `${baseUrl}/services/${item.id}`,
        lastModified: item.created_at ? new Date(item.created_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }))
    }

    if (landlordsRes.data) {
      landlordRoutes = landlordsRes.data
        .filter((item) => Boolean(item.username))
        .map((item) => ({
          url: `${baseUrl}/landlord/${item.username}`,
          lastModified: item.created_at ? new Date(item.created_at) : now,
          changeFrequency: "weekly",
          priority: 0.6,
        }))
    }
  } catch (error) {
    console.error("[SITEMAP] Error generating dynamic routes:", error)
  }

  return [
    ...staticRoutes,
    ...universityRoutes,
    ...listingRoutes,
    ...roommateRoutes,
    ...serviceRoutes,
    ...landlordRoutes,
  ]
}
