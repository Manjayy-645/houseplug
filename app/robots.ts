import { SITE_URL } from "@/lib/site";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview")
    return { rules: { userAgent: "*", disallow: "/" } };
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
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
          "/landlord/dashboard",
          "/landlord/dashboard/*",
          "/landlord/listings",
          "/landlord/listings/*",
          "/landlord/analytics",
          "/landlord/analytics/*",
          "/landlord/billing",
          "/landlord/billing/*",
          "/landlord/profile",
          "/landlord/profile/*",
          "/landlord/reviews",
          "/landlord/reviews/*",
          "/landlord/subscription",
          "/landlord/subscription/*",
          "/landlord/verification",
          "/landlord/verification/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
