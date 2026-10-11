import Link from "next/link";

export default function ImpressumPage() {
  return (
    <main className="legal-modal-overlay">
      <article className="legal-modal-card" role="dialog" aria-modal="true" aria-labelledby="impressum-title">
        <Link className="legal-modal-close" href="/" aria-label="Schließen und zur Startseite zurückkehren" title="Schließen">×</Link>
        <h1 id="impressum-title">Impressum</h1>
        <p><strong>Bitte vor dem Livegang rechtlich prüfen.</strong> Ergänzen Sie nur weitere Angaben, die auf Ihren tatsächlichen rechtlichen Status zutreffen. Diese Seite ist keine Rechtsberatung.</p>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p><strong>Betreiber / Anbieter:</strong><br />Akhmed Ismail Saied<br />digital future</p>
        <p><strong>Anschrift:</strong><br />Ehndofer Str. 130<br />24537 Neumünster<br />Deutschland</p>
        <p><strong>Kontakt:</strong><br />E-Mail: <a href="mailto:info@nexoraonline.de">info@nexoraonline.de</a><br />Telefon: <a href="tel:+4915123937937">+49 151 23937937</a></p>
        <p><strong>Weitere Website:</strong><br /><a href="https://www.digital-future.ai" target="_blank" rel="noopener noreferrer">https://www.digital-future.ai</a></p>

        <h2>Register- und Umsatzsteuerangaben</h2>
        <p>Sofern für den Betreiber zutreffend, sind hier die erforderlichen Angaben zu Register, Registergericht, Registernummer und Umsatzsteuer-Identifikationsnummer zu ergänzen.</p>

        <h2>Inhaltlich verantwortlich</h2>
        <p>Sofern gesetzlich erforderlich, sind hier Name und Anschrift der verantwortlichen Person zu ergänzen.</p>

        <h2>Hinweis zur Plattform</h2>
        <p>Die digitale Passdarstellung ist ein Profilkonzept und kein amtliches Dokument. Externe Links führen zu unabhängig betriebenen Websites.</p>
      </article>
    </main>
  );
}
