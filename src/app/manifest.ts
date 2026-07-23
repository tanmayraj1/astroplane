import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Astroplane — the daily planner that knows your sky",
    short_name: "Astroplane",
    description:
      "Wake windows, power hours, tarot and gentle nudges — cast fresh from your birth chart every morning.",
    start_url: "/today",
    display: "standalone",
    background_color: "#EAE1CC",
    theme_color: "#EAE1CC",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
