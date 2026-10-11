import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="site-shell">
      <section className="panel legal-panel">
        <span className="eyebrow">HELP-ME · PRIVACY</span>
        <h1>Privacy &amp; data use</h1>
        <p>
          HELP-ME is designed to provide intelligent assistance while keeping
          account and conversation data separated and protected.
        </p>
        <div className="legal-copy">
          <h2>Your consent</h2>
          <p>
            Account creation requires acceptance of the privacy notice and terms
            shown on the registration page. This notice is a project draft and
            must be completed with the final operator, retention periods,
            legal basis and processor details before public launch.
          </p>
          <h2>Account data</h2>
          <p>
            Account information is used to provide authentication, account
            management, usage tracking and the services selected by the user.
          </p>
          <h2>Conversations</h2>
          <p>
            Conversation records are associated with the workspace and are intended
            to be visible only to authorized workspace users. Messages may be
            processed by the configured AI provider when that integration is enabled.
          </p>
          <h2>Security</h2>
          <p>
            Protected workspace routes check the authenticated session and the
            relevant workspace membership before returning private records.
            No system can guarantee absolute security; credentials and keys
            must be protected and the deployed configuration tested.
          </p>
        </div>
        <div className="hero-actions"><Link className="button secondary" href="/terms">Terms of use</Link><Link className="button primary" href="/signup">Continue to account</Link></div>
      </section>
    </main>
  );
}
