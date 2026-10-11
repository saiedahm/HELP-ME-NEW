"use client";

import { FormEvent, useEffect, useState } from "react";

type Item = { id: string; title: string; content: string; type: string; createdAt: string };

export default function KnowledgePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load knowledge.");
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load knowledge.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function removeItem(id: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/knowledge/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete knowledge item.");
      setItems(current => current.filter(item => item.id !== id));
      setNotice("Knowledge item deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete knowledge item.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save knowledge.");
      setItems(current => [data.item, ...current]);
      setTitle("");
      setContent("");
      setNotice("Knowledge item saved to this workspace.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save knowledge.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-card" style={{ marginTop: 20 }}>
      <span>WORKSPACE KNOWLEDGE</span>
      <h2>Knowledge base</h2>
      <p>Add FAQs or service information that the assistant can use when replying.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Title<input value={title} onChange={e => setTitle(e.target.value)} required maxLength={160} /></label>
        <label>Information<textarea value={content} onChange={e => setContent(e.target.value)} required maxLength={12000} rows={4} /></label>
        <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save knowledge"}</button>
      </form>
      {error && <p className="status-message" role="alert">{error}</p>}
      {notice && <p className="status-message">{notice}</p>}
      <div style={{ marginTop: 18 }}>
        {loading ? <p>Loading workspace knowledge…</p> : items.length === 0 ? <p>No knowledge items yet. Add your first FAQ above.</p> : items.map(item =>
          <article key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><strong>{item.title}</strong><button className="button secondary" type="button" onClick={() => void removeItem(item.id)} aria-label={`Delete ${item.title}`}>Delete</button></div><p>{item.content}</p>
            <small style={{ color: "var(--muted)" }}>{item.type} · {new Date(item.createdAt).toLocaleDateString()}</small>
          </article>
        )}
      </div>
    </section>
  );
}
