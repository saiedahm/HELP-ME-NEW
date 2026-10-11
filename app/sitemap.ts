import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const baseUrl = new URL(configuredUrl).origin;
  return ["/", "/about", "/pricing", "/contact", "/accessibility", "/privacy", "/terms", "/impressum", "/cookie-settings"].map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date()
  }));
}
