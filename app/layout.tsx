import type { Metadata } from "next";
import "./globals.css";
import Brand from "./brand";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HELP-ME — Intelligent Assistance",
  description: "A modern AI customer-support workspace with a knowledge base, saved conversations and team-ready tools.",
  applicationName: "HELP-ME",
  robots: { index: false, follow: false },
};

function LegalIcon({ kind }: { kind: "withdrawal" | "terms" | "privacy" | "imprint" | "cookies" }) {
  const paths = {
    withdrawal: <><path d="M4 7h16M7 4h10M7 7l1 13h8l1-13" /><path d="M10 11v5M14 11v5" /></>,
    terms: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h4M9 12h7M9 16h7" /></>,
    privacy: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    imprint: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-1.1 1.1-1.9 1.4-1.9 3M12 17.5v.1" /></>,
    cookies: <><path d="M20 13a8 8 0 1 1-9-9 4 4 0 0 0 9 9Z" /><circle cx="9" cy="10" r="1" /><circle cx="13" cy="15" r="1" /><circle cx="7.5" cy="14" r=".7" /></>
  };
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="digitalfuture-footer" aria-label="HELP-ME legal and company information">
          <Brand compact />
          <div className="digitalfuture-contact">
            <a href="https://www.digital-future.ai" target="_blank" rel="noreferrer">digital-future.ai</a>
            <a href="mailto:server@digital-future.ai">server@digital-future.ai</a>
          </div>
          <nav className="global-legal-links" aria-label="Legal information">
            <Link href="/withdrawal"><LegalIcon kind="withdrawal" /> <span>Widerruf</span></Link>
            <Link href="/terms"><LegalIcon kind="terms" /> <span>AGB / Terms</span></Link>
            <Link href="/privacy"><LegalIcon kind="privacy" /> <span>Datenschutz</span></Link>
            <Link href="/impressum"><LegalIcon kind="imprint" /> <span>Impressum</span></Link>
            <Link href="/cookie-settings"><LegalIcon kind="cookies" /> <span>Cookie settings</span></Link>
          </nav>
          <small className="global-copyright">© 2026 HELP-ME · DIGITAL FUTURE. All rights reserved.</small>
        </footer>
      </body>
    </html>
  );
}
