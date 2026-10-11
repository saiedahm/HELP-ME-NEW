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
            Before creating an account, users will be asked to review and
            accept the applicable privacy and data-use terms.
          </p>
          <h2>Account data</h2>
          <p>
            Account information is used to provide authentication, account
            management, usage tracking and the services selected by the user.
          </p>
          <h2>Conversations</h2>
          <p>
            Conversations belong to the authenticated account and, for
            business workspaces, to the appropriate organization.
          </p>
          <h2>Security</h2>
          <p>
            Access controls and server-side authorization will be applied
            before protected account or organization data is returned.
          </p>
        </div>
        <Link className="button secondary" href="/signup">Continue to account</Link>
      </section>
    </main>
  );
}
