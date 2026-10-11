import Link from "next/link";
import Brand from "../brand";

export default function WithdrawalPage() {
  return (
    <main className="legal-page">
      <header className="legal-header"><Brand /><Link href="/">← Home</Link></header>
      <article className="legal-card">
        <p className="landing-eyebrow">HELP-ME · WITHDRAWAL INFORMATION</p>
        <h1>Withdrawal information</h1>
        <p>This page is a preparation draft, not a legally finalized withdrawal notice. The operator must confirm whether a statutory right of withdrawal applies to each customer type and service before paid subscriptions are offered.</p>
        <h2>Before a paid order</h2>
        <p>Review the final price, billing period, renewal terms, cancellation method and any applicable withdrawal information before confirming a subscription. Do not proceed with a payment if these details are not displayed clearly.</p>
        <h2>Questions or requests</h2>
        <p>For questions about an order or a possible withdrawal request, contact <a href="mailto:server@digital-future.ai">server@digital-future.ai</a>. Include only the information needed to identify the order; never send passwords or full payment-card details by email.</p>
        <p>These draft notes do not replace legal advice or a legally compliant withdrawal form. The operator should obtain a review for the relevant jurisdiction before launch.</p>
        <p><Link href="/terms">Terms of use</Link> · <Link href="/privacy">Privacy information</Link> · <Link href="/impressum">Impressum</Link></p>
      </article>
    </main>
  );
}
