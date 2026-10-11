import type { Metadata } from "next";
import "./globals.css";
import LegalFooter from "./legal-footer";

export const metadata: Metadata = {
  title: "HELP-ME — Intelligent Assistance",
  description: "A modern AI customer-support workspace with a knowledge base, saved conversations and team-ready tools.",
  applicationName: "HELP-ME",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
