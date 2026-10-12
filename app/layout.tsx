import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HELP-ME — Your Style. Our Mission.",
  description: "Discover a thoughtfully curated world of beauty, fashion, accessories, technology and gifts for the modern woman.",
  applicationName: "HELP-ME Store",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
