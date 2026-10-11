"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, organization, email, password, privacyAccepted: accepted, termsAccepted: accepted })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration could not be completed.");
      router.push("/login?registered=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-shell">
      <section className="panel auth-panel auth-panel-closable">
        <Link className="auth-close" href="/" aria-label="Close registration and return home" title="Close">×</Link>
        <span className="eyebrow">HELP-ME · ACCOUNT</span>
        <h1>Create your account</h1>
        <p>Create a secure workspace for your customer-support assistant.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Your name<input value={name} onChange={e => setName(e.target.value)} name="name" required autoComplete="name" maxLength={100} /></label>
          <label>Company or workspace<input value={organization} onChange={e => setOrganization(e.target.value)} name="organization" required autoComplete="organization" maxLength={120} /></label>
          <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" name="email" required autoComplete="email" maxLength={254} /></label>
          <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" name="password" required minLength={10} autoComplete="new-password" /></label>
          <p className="muted">Use at least 10 characters for your password.</p>
          <label className="consent">
            <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required />
            <span>I accept the <Link className="text-link" href="/privacy">privacy notice</Link> and <Link className="text-link" href="/terms">terms of use</Link>.</span>
          </label>
          {error && <p className="status-message" role="alert">{error}</p>}
          <button className="button primary" type="submit" disabled={!accepted || loading}>{loading ? "Creating account…" : "Create account"}</button>
        </form>
        <p>Already registered? <Link className="text-link" href="/login">Sign in</Link></p>
        <Link className="text-link" href="/privacy">Read privacy information</Link> · <Link className="text-link" href="/terms">Terms of use</Link>
      </section>
    </main>
  );
}
