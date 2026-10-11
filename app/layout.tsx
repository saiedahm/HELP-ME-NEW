import type { Metadata } from "next";
import "./globals.css";
import Brand from "./brand";

export const metadata: Metadata = {
  title: "HELP-ME — Intelligent Assistance",
  description: "Secure SaaS platform for intelligent assistance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="digitalfuture-footer" aria-label="digital future contact"><Brand compact /><a href="https://www.digital-future.ai" target="_blank" rel="noreferrer">https://www.digital-future.ai</a><span>server@digital-future.ai</span><a href="/impressum">Impressum</a></footer>
      </body>
    </html>
  );
}
