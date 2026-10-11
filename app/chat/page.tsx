"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Brand from "../brand";

type Message = { role: "user" | "assistant"; content: string };
type SessionStatus = "checking" | "signed-in" | "guest";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I’m HELP-ME. Sign in to save your conversations and get workspace-specific assistance." }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async response => {
        if (!response.ok) throw new Error("Session lookup failed");
        return response.json();
      })
      .then(session => {
        if (mounted) setSessionStatus(session?.user?.email ? "signed-in" : "guest");
      })
      .catch(() => {
        if (mounted) setSessionStatus("guest");
      });
    return () => { mounted = false; };
  }, []);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading || sessionStatus !== "signed-in") return;
    setInput("");
    setError("");
    setMessages(current => [...current, { role: "user", content }]);
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
        setMessages(current => [...current, { role: "assistant", content: data.error || "Please try again." }]);
      } else {
        setConversationId(data.conversationId);
        setMessages(current => [...current, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("The assistant is temporarily unavailable. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-shell">
        <header className="chat-top">
          <Brand />
          <div className="chat-account-actions">
            <Link className="button secondary" href="/">Home</Link>
            {sessionStatus === "signed-in"
              ? <Link className="button primary" href="/dashboard">Dashboard</Link>
              : <Link className="button primary" href="/login">Sign in</Link>}
          </div>
        </header>
        <section className="chat-panel">
          <div className="chat-title"><span className="eyebrow">AI SUPPORT ASSISTANT</span><h1>How can we help?</h1><p>Your conversations are saved to your private workspace. The assistant uses the configured AI provider; a demo response is used only when no AI key is configured.</p></div>
          {sessionStatus === "checking" && <div className="chat-access-note" role="status">Checking your secure session…</div>}
          {sessionStatus === "guest" && <div className="chat-access-note" role="status"><strong>Sign in to start your private conversation.</strong><span>Create an account to save chats and use your workspace assistant.</span><div><Link className="button primary" href="/login">Sign in</Link><Link className="button secondary" href="/signup">Create account</Link></div></div>}
          <div className="messages" aria-live="polite">
            {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>{message.content}</div>)}
            {loading && <div className="chat-message assistant">Thinking…</div>}
          </div>
          {error && <p className="status-message" role="alert">{error} {error.includes("Sign in") && <Link href="/login">Sign in here</Link>}</p>}
          <form className="chat-input" onSubmit={send}>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder={sessionStatus === "signed-in" ? "Ask HELP-ME anything…" : "Sign in to start a conversation"} aria-label="Message" maxLength={4000} disabled={sessionStatus !== "signed-in" || loading} />
            <button className="button primary" type="submit" disabled={sessionStatus !== "signed-in" || loading || !input.trim()}>{loading ? "Sending…" : "Send"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
