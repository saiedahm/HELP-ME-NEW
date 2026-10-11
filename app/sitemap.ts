import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/pricing", "/contact", "/accessibility", "/privacy", "/terms", "/impressum", "/cookie-settings"].map((path) => ({ url: `https://saiedahm.github.io/HELP-ME-NEW${path === "/" ? "/" : path}`, lastModified: new Date() }));
}
