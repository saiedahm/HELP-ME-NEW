"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  latestMessage: { content: string; role: string; createdAt: string } | null;
};

export default function ConversationsPanel() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load conversations.");
        if (active) setItems(data.conversations);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load conversations.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <section className="dashboard-card" style={{ marginTop: 20 }} aria-labelledby="conversation-history-title">
      <span>WORKSPACE ACTIVITY</span>
      <h2 id="conversation-history-title">Conversation history</h2>
      <p>Recent conversations saved to your workspace. The list is private to your organization.</p>
      {loading ? <p>Loading conversation history…</p> : error ? <p className="status-message" role="alert">{error}</p> :
        items.length === 0 ? <p>No saved conversations yet. <Link href="/chat">Start a conversation →</Link></p> :
          <div>
            {items.map((item) => (
              <article key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}>
                <strong>{item.title}</strong>
                <p>{item.latestMessage ? item.latestMessage.content.slice(0, 220) + (item.latestMessage.content.length > 220 ? "…" : "") : "No messages yet."}</p>
                <small style={{ color: "var(--muted)" }}>
                  {item.messageCount} messages · Updated {new Date(item.updatedAt).toLocaleString()}
                </small>
              </article>
            ))}
          </div>}
    </section>
  );
}
