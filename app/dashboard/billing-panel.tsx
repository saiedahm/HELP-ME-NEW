"use client";

import { useState } from "react";

type Plan = "business" | "pro";

export default function BillingPanel() {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [message, setMessage] = useState("");

  async function startCheckout(plan: Plan) {
    setLoading(plan);
    setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") {
        setMessage(data.error || "Checkout could not be started.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setMessage("Connection error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="dashboard-card billing-panel" aria-labelledby="billing-title">
      <span>05</span>
      <h2 id="billing-title">Plans &amp; billing</h2>
      <p>Choose a subscription to continue to secure Stripe checkout. You can cancel checkout before confirming payment.</p>
      <div className="hero-actions">
        <button className="button secondary" type="button" disabled={loading !== null} onClick={() => startCheckout("business")}>
          {loading === "business" ? "Connecting…" : "Business plan"}
        </button>
        <button className="button primary" type="button" disabled={loading !== null} onClick={() => startCheckout("pro")}>
          {loading === "pro" ? "Connecting…" : "Pro plan"}
        </button>
      </div>
      {message ? <p role="alert" aria-live="polite">{message}</p> : null}
      <small>Checkout activates only after the Stripe keys and recurring price IDs are configured by the site administrator.</small>
    </section>
  );
}
