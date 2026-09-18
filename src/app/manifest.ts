import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Property Hub",
    short_name: "Property Hub",
    description:
      "A place for your properties, your people, and everyday living.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8f6",
    theme_color: "#243e31",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
