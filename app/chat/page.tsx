"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Brand from "../brand";
import LanguageSwitcher from "../language-switcher";

type Message = { role: "user" | "assistant"; content: string; createdAt: string };
type SessionStatus = "checking" | "signed-in" | "guest";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I’m HELP-ME. Sign in to save your conversations and get workspace-specific assistance.", createdAt: new Date().toISOString() }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const draft = params.get("draft");
    if (draft) setInput(draft.slice(0, 4000));
  }, []);

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
    if (!content || loading) return;
    if (sessionStatus === "checking") {
      setError("Your account is still being checked. Please try sending again in a moment.");
      return;
    }
    if (sessionStatus !== "signed-in") {
      setError("A free account is enough to start — a paid subscription is not required. Sign in or create a free account to send your message.");
      return;
    }
    setInput("");
    setError("");
    setMessages(current => [...current, { role: "user", content, createdAt: new Date().toISOString() }]);
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
        setMessages(current => [...current, { role: "assistant", content: data.error || "Please try again.", createdAt: new Date().toISOString() }]);
      } else {
        setConversationId(data.conversationId);
        setMessages(current => [...current, { role: "assistant", content: data.reply, createdAt: new Date().toISOString() }]);
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
          <div className="chat-header-right">
            <LanguageSwitcher />
            <div className="chat-account-actions">
              <Link className="button secondary" href="/">Home</Link>
              {sessionStatus === "signed-in"
                ? <Link className="button primary" href="/dashboard">Dashboard</Link>
                : <Link className="button primary" href="/login">Sign in</Link>}
            </div>
          </div>
        </header>
        <section className="chat-panel" aria-label="HELP-ME conversation">
          <div className="chat-title chat-title-bar">
            <span className="chat-avatar" aria-hidden="true">✦</span>
            <div><span className="eyebrow">HELP-ME · AI SUPPORT</span><h1>How can we help?</h1><p><span className="online-dot" /> Your private assistant conversation</p></div>
          </div>
          {sessionStatus === "checking" && <div className="chat-access-note" role="status">Checking your secure session…</div>}
          {sessionStatus === "guest" && <div className="chat-access-note" role="status"><strong>Your message is ready.</strong><span>Create a free account or sign in to send it and save your conversation. No paid subscription is required to start.</span><div><Link className="button primary" href="/login">Sign in</Link><Link className="button secondary" href="/signup">Create account</Link></div></div>}
          <div className="messages" aria-live="polite" aria-label="Conversation messages">
            {messages.map((message, index) => <div className={`chat-message-row ${message.role}`} key={index}>
              {message.role === "assistant" && <span className="chat-message-avatar" aria-hidden="true">✦</span>}
              <div className={`chat-message ${message.role}`}>{message.content}<time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
            </div>)}
            {loading && <div className="chat-message-row assistant"><span className="chat-message-avatar" aria-hidden="true">✦</span><div className="chat-message assistant typing-indicator"><span /><span /><span /><small>Thinking…</small></div></div>}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
          {error && <p className="status-message" role="alert">{error} {error.includes("Sign in") && <Link href="/login">Sign in here</Link>}</p>}
          <form className="chat-input" onSubmit={send}>
            <label className="chat-input-symbol" aria-hidden="true">＋</label>
            <input value={input} onChange={event => { setInput(event.target.value); if (error) setError(""); }} placeholder={sessionStatus === "signed-in" ? "Write your message…" : sessionStatus === "checking" ? "Checking your account…" : "Write a message — sign in to send"} aria-label="Message" maxLength={4000} disabled={loading} />
            <button className="button primary chat-send-button" type="submit" aria-label={loading ? "Sending message" : "Send message"} disabled={loading || !input.trim()}>{loading ? "…" : "➤"}</button>
          </form>
          <p className="chat-privacy-note">HELP-ME can make mistakes. Do not share passwords or sensitive payment information.</p>
        </section>
      </div>
    </main>
  );
}
