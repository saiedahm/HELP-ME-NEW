"use client";
import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
      if (result?.error) { setError("Email or password is incorrect, or the account service is not configured."); return; }
      router.push("/dashboard"); router.refresh();
    } catch { setError("Sign in is temporarily unavailable. Please try again."); }
    finally { setLoading(false); }
  }
  return <section className="panel auth-panel auth-panel-closable">\n    <Link className="auth-close" href="/" aria-label="Close sign in and return home" title="Close">×</Link>
    <span className="eyebrow">HELP-ME · SECURE ACCESS</span><h1>Welcome back</h1>
    {search.get("registered") === "1" && <p className="status-message">Your account was created. Sign in to continue.</p>}
    <p>Sign in to manage your workspace and AI support assistant.</p>
    <form onSubmit={submit} className="auth-form">
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={10} autoComplete="current-password" /></label>
      {error && <p className="status-message" role="alert">{error}</p>}
      <button className="button primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
    </form>
    <p>New to HELP-ME? <Link className="text-link" href="/signup">Create an account</Link></p>
    <Link className="text-link" href="/privacy">Privacy information</Link>
  </section>;
}
export default function LoginPage() {
  return <main className="site-shell"><Suspense fallback={<section className="panel auth-panel"><p>Loading sign in…</p></section>}><LoginForm /></Suspense></main>;
}
