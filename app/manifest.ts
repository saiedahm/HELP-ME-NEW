import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "HELP-ME — Intelligent Assistance", short_name: "HELP-ME", description: "Intelligent customer support platform", start_url: "/", display: "standalone", background_color: "#050914", theme_color: "#050914", icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }] };
}