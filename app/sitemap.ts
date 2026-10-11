import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/pricing", "/contact", "/accessibility", "/privacy", "/terms", "/impressum", "/cookie-settings"].map((path) => ({ url: `https://www.helpmey.net${path}`, lastModified: new Date() }));
}