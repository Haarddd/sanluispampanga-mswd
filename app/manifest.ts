import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MSWD San Luis, Pampanga",
    short_name: "MSWD SLP",
    description:
      "Official digital services portal for the Municipal Social Welfare and Development Office of San Luis, Pampanga",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1e40af",
    categories: ["government", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "My Requests",
        url: "/requests",
        description: "View and track your service requests",
      },
    ],
  };
}
