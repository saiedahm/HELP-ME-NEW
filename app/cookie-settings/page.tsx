import Link from "next/link";

export default function CookieSettingsPage() {
  return (
    <main className="legal-modal-overlay">
      <article className="legal-modal-card" role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title">
        <Link className="legal-modal-close" href="/" aria-label="Schließen und zur Startseite zurückkehren" title="Schließen">×</Link>
        <h1 id="cookie-settings-title">Cookie settings</h1>
        <p>Diese Seite ist für die Verwaltung der Cookie-Einstellungen vorgesehen.</p>
        <h2>Aktueller Stand</h2>
        <p>Die technische Verbindung zu einem Einwilligungs- und Cookie-Verwaltungssystem ist noch nicht eingerichtet. Deshalb werden über diese Seite derzeit keine Einstellungen gespeichert oder geändert.</p>
        <p>Bitte veröffentlichen Sie diese Seite erst dann als fertige Cookie-Verwaltung, wenn die Einwilligungsverwaltung technisch eingerichtet und geprüft wurde.</p>
        <p><Link href="/privacy">Datenschutzinformationen auf HELP-ME</Link></p>
      </article>
    </main>
  );
}
