import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HousePlug - Verified Student Housing",
    short_name: "HousePlug",
    description: "Find verified student lodges, self-cons, and flatshares around UniPort, RSU, IAUE, and KenPoly.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#1B4332",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
}
