"use client";

import { useEffect, useState } from "react";
import Brand from "./brand";

type LegalKey = "impressum" | "widerruf" | "agb" | "datenschutz" | "cookies";
const legalItems: { key: LegalKey; label: string; url: string; icon: string }[] = [
  { key: "widerruf", label: "Widerruf", url: "https://www.digital-future.ai/widerruf.html", icon: "↶" },
  { key: "agb", label: "AGB", url: "https://www.digital-future.ai/agb.html", icon: "▤" },
  { key: "datenschutz", label: "Datenschutz", url: "https://www.digital-future.ai/datenschutz.html", icon: "♧" },
  { key: "impressum", label: "Impressum", url: "https://www.digital-future.ai/impressum.html", icon: "ⓘ" },
  { key: "cookies", label: "Cookie settings", url: "https://www.digital-future.ai/datenschutz.html", icon: "◉" },
];

function CompanyImpressum() {
  return <div className="legal-company-details">
    <p className="legal-eyebrow">DIGITAL FUTURE · OFFIZIELLE KONTAKTINFORMATIONEN</p>
    <h3>Betreiber / Anbieter</h3>
    <dl>
      <dt>Name</dt><dd>Akhmed Ismail Saied</dd>
      <dt>Unternehmensname</dt><dd>digital future</dd>
      <dt>Anschrift</dt><dd>Ehndofer Str. 130<br />24537 Neumünster<br />Deutschland</dd>
      <dt>Kontakt / E-Mail</dt><dd><a href="mailto:contact@digital-future.ai">contact@digital-future.ai</a><a href="mailto:info@digital-future.ai">info@digital-future.ai</a><a href="mailto:server@digital-future.ai">server@digital-future.ai</a></dd>
      <dt>Telefon</dt><dd><a href="tel:+4915123937937">+49 151 23937937</a></dd>
      <dt>Weitere Website</dt><dd><a href="https://www.digital-future.ai" target="_blank" rel="noreferrer">https://www.digital-future.ai ↗</a></dd>
    </dl>
  </div>;
}

export default function LegalFooter() {
  const [active, setActive] = useState<LegalKey | null>(null);
  const item = legalItems.find((entry) => entry.key === active);
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [active]);

  return <>
    <footer className="digitalfuture-footer" aria-label="HELP-ME legal and company information">
      <Brand compact />
      <div className="digitalfuture-contact">
        <a href="https://www.digital-future.ai" target="_blank" rel="noreferrer">digital-future.ai</a>
        <a href="mailto:contact@digital-future.ai">contact@digital-future.ai</a>
        <a href="mailto:server@digital-future.ai">server@digital-future.ai</a>
        <a href="tel:+4915123937937">+49 151 23937937</a>
      </div>
      <nav className="global-legal-links" aria-label="Rechtliche Informationen">
        {legalItems.map((entry) => <button key={entry.key} type="button" onClick={() => setActive(entry.key)}><span className="legal-link-icon" aria-hidden="true">{entry.icon}</span><span>{entry.label}</span></button>)}
      </nav>
      <small className="global-copyright">© 2026 HELP-ME · DIGITAL FUTURE. Alle Rechte vorbehalten.</small>
    </footer>
    {active && item && <div className="legal-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActive(null); }}>
      <section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
        <header className="legal-modal-header">
          <div><span className="legal-modal-kicker">DIGITAL FUTURE · RECHTLICHE INFORMATIONEN</span><h2 id="legal-modal-title">{item.label}</h2></div>
          <button type="button" className="legal-modal-close" aria-label="Fenster schließen" title="Schließen" onClick={() => setActive(null)}>×</button>
        </header>
        <div className="legal-modal-content">
          {active === "impressum" ? <CompanyImpressum /> : <>
            <p className="legal-modal-intro">Die offizielle Seite von digital future wird hier angezeigt, sofern der externe Anbieter die Einbettung zulässt.</p>
            <iframe title={item.label} src={item.url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
            <p className="legal-modal-fallback">Falls die Seite in diesem Fenster nicht geladen wird, öffnen Sie sie direkt: <a href={item.url} target="_blank" rel="noreferrer">Offizielle Seite öffnen ↗</a></p>
          </>}
        </div>
      </section>
    </div>}
  </>;
}
