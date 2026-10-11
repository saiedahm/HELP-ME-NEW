import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="site-shell">
      <section className="panel legal-panel">
        <span className="eyebrow">HELP-ME · TERMS</span>
        <h1>Terms of use</h1>
        <p>These preliminary terms describe the basic rules for using the HELP-ME service. They must be reviewed and finalized for the operator's jurisdiction before commercial launch.</p>
        <div className="legal-copy">
          <h2>Acceptable use</h2>
          <p>Use the service lawfully. Do not attempt to access another workspace, disrupt the service, upload unlawful content, or misuse the assistant to harm others.</p>
          <h2>AI-generated responses</h2>
          <p>AI responses can be incomplete or incorrect and are provided for informational support. Verify important information and use qualified human support where appropriate.</p>
          <h2>Accounts and security</h2>
          <p>You are responsible for keeping your login credentials confidential and for activity performed through your account. Contact the service operator if you suspect unauthorized access.</p>
          <h2>Plans and billing</h2>
          <p>Paid features, pricing, billing periods, cancellation rules and any applicable taxes must be shown at checkout before a subscription is confirmed. A subscription is active only when the payment provider confirms its status.</p>
          <h2>Availability and changes</h2>
          <p>We aim to keep the service available but cannot guarantee uninterrupted operation. Features and these terms may change, subject to applicable law.</p>
          <h2>Contact and legal review</h2>
          <p>Before accepting paid customers, the operator should add its full legal identity, address, contact details, governing law, withdrawal information where applicable, and a reviewed privacy notice.</p>
        </div>
        <div className="hero-actions"><Link className="button secondary" href="/privacy">Privacy information</Link><Link className="button primary" href="/signup">Create account</Link></div>
      </section>
    </main>
  );
}
