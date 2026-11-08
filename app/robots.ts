import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://houseplug.ng"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/landlord",
          "/landlord/*",
          "/student",
          "/student/*",
          "/api",
          "/api/*",
          "/appeal",
          "/banned",
          "/maintenance",
          "/saved",
          "/profile",
          "/roommates/create",
          "/services/manage",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
