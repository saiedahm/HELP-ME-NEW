"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Brand from "../brand";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I’m HELP-ME. Sign in to save your conversations and get workspace-specific assistance." }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setError("");
    setMessages(m => [...m, { role: "user", content }]);
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: content, conversationId })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "The assistant is temporarily unavailable.");
        setMessages(m => [...m, { role: "assistant", content: data.error || "Please try again." }]);
      } else {
        setConversationId(data.conversationId);
        setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("The assistant is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-shell">
        <header className="chat-top">
          <Brand />
          <Link className="button secondary" href="/login">Sign in</Link>
        </header>
        <section className="chat-panel">
          <div className="chat-title"><span className="eyebrow">AI SUPPORT ASSISTANT</span><h1>How can we help?</h1><p>Sign in to save chats securely in your workspace. Demo responses use the built-in Mock AI provider.</p></div>
          <div className="messages" aria-live="polite">
            {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.content}</div>)}
            {loading && <div className="chat-message assistant">Thinking…</div>}
          </div>
          {error && <p className="status-message" role="alert">{error} {error.includes("Sign in") && <Link href="/login">Sign in here</Link>}</p>}
          <form className="chat-input" onSubmit={send}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask HELP-ME anything…" aria-label="Message" maxLength={4000} />
            <button className="button primary" type="submit" disabled={loading || !input.trim()}>{loading ? "Sending…" : "Send"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
