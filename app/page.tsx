import Link from "next/link";
import Brand from "./brand";
import LanguageSwitcher from "./language-switcher";

const features = [
  { icon: "ϟ", title: "Fast Support", detail: "Get answers instantly" },
  { icon: "♧", title: "Smart AI", detail: "Accurate & helpful" },
  { icon: "⬡", title: "Secure", detail: "Your data is safe" },
  { icon: "◎", title: "Multi-Language", detail: "20 languages" }
];

export default function HomePage() {
  return <main className="landing">
    <header className="landing-header">
      <Brand />
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="active" href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#business">Business</a>
        <a href="#pricing">Pricing</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher />
        <Link className="header-login" href="/login">Login</Link>
        <Link className="header-register" href="/signup">Register</Link>
      </div>
    </header>

    <section className="landing-hero" id="home">
      <div className="landing-copy">
        <div className="landing-eyebrow"><span />YOUR AI SUPPORT PLATFORM<span /></div>
        <h1>HELP-ME</h1>
        <h2>Your <em>Smart</em> AI Assistant</h2>
        <p>Get instant help, ask questions, and find the right answers. HELP-ME is your intelligent support platform for businesses, customers and everyone who needs fast, reliable and friendly assistance.</p>
        <div className="landing-ctas">
          <Link className="start-button" href="/chat">➜ &nbsp; Start Now</Link>
          <a className="video-button" href="#business"><span>↗</span> How it works</a>
        </div>
        <div className="benefits" id="features">
          {features.map(item => <div className="benefit" key={item.title}>
            <span className="benefit-icon">{item.icon}</span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </div>)}
        </div>
      </div>

      <div className="landing-visual" aria-label="HELP-ME intelligent global AI assistant">
        <div className="city-glow" />
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        <div className="digital-globe">
          <div className="globe-grid" />
          <span className="globe-continents" aria-hidden="true">✦</span>
          <div className="globe-word">HELP-ME</div>
        </div>
        <div className="tech-tile tile-ai">AI<br/><b>▦</b></div>
        <div className="tech-tile tile-cloud">☁</div>
        <div className="tech-tile tile-chat">☏</div>
        <div className="tech-tile tile-safe">♢</div>
        <div className="tech-tile tile-people">♧</div>
        <div className="chat-demo">
          <div className="chat-demo-head"><span className="online-dot" /> <b>HELP-ME Assistant</b><small>Online</small></div>
          <div className="demo-bubble">Hello! How can I help you today?</div>
          <div className="demo-bubble user-bubble">I need help understanding a service.</div>
          <div className="demo-bubble">Of course. Tell me what you need and I’ll guide you step by step.</div>
          <Link href="/chat" className="demo-input">Ask anything... <span>➜</span></Link>
        </div>
      </div>
    </section>

    <section className="section landing-extra" id="business">
      <div className="section-heading">
        <span className="eyebrow">HELP-ME BUSINESS</span>
        <h2>Helpful AI support for your team</h2>
        <p>Give customers quick answers while your team stays in control. Build a knowledge base, review conversations and guide requests to a human when needed.</p>
      </div>
      <div className="business-banner">
        <div><h2>Make support simpler.</h2><p>Start with a workspace and grow as your support needs grow.</p></div>
        <Link className="button primary" href="/signup">Create your workspace →</Link>
      </div>
    </section>

    <section className="section landing-extra" id="pricing">
      <div className="section-heading">
        <span className="eyebrow">SIMPLE PLANS</span>
        <h2>Start small. Scale when ready.</h2>
        <p>Choose a starting point for your workspace. Any paid plan and billing availability should be confirmed in your account before purchase.</p>
      </div>
      <div className="feature-grid pricing-grid">
        <article className="feature-card"><span className="feature-icon">01</span><h3>Free</h3><p>Explore the assistant and set up your workspace.</p><Link className="text-link" href="/signup">Get started →</Link></article>
        <article className="feature-card"><span className="feature-icon">02</span><h3>Starter</h3><p>For small teams beginning to organize customer support.</p><Link className="text-link" href="/signup">Create account →</Link></article>
        <article className="feature-card"><span className="feature-icon">03</span><h3>Business</h3><p>For growing teams that need shared knowledge and conversations.</p><Link className="text-link" href="/signup">Create account →</Link></article>
        <article className="feature-card"><span className="feature-icon">04</span><h3>Pro</h3><p>For higher-volume support workflows and future expansion.</p><Link className="text-link" href="/signup">Create account →</Link></article>
      </div>
    </section>

    <section className="section landing-extra" id="about">
      <div className="section-heading">
        <span className="eyebrow">ABOUT HELP-ME</span>
        <h2>Clear answers, with people still in control.</h2>
        <p>HELP-ME is an AI support platform concept for businesses and their customers. The assistant can help organize information and guide common questions, while important decisions should be checked with a qualified person.</p>
      </div>
      <div className="feature-grid">
        <article className="feature-card"><span className="feature-icon">AI</span><h3>Knowledge-led</h3><p>Organize answers around your service information and FAQs.</p></article>
        <article className="feature-card"><span className="feature-icon">↗</span><h3>Human handoff</h3><p>Keep a human involved when a request needs personal attention.</p></article>
        <article className="feature-card"><span className="feature-icon">◎</span><h3>Multi-language</h3><p>Designed for support across language needs; availability depends on configuration.</p></article>
        <article className="feature-card"><span className="feature-icon">◇</span><h3>Workspace</h3><p>Keep your account, conversations and knowledge in one place.</p></article>
      </div>
    </section>

    <footer className="landing-footer" id="contact">
      <Brand />
      <a href="https://www.nexoraonline.de" className="footer-link">↗ &nbsp; www.nexoraonline.de</a>
      <a href="https://www.digital-future.ai/" className="footer-link" target="_blank" rel="noopener noreferrer">↗ &nbsp; DIGITAL FUTURE STATE</a>
      <a href="mailto:info@nexoraonline.de" className="footer-link">✉ &nbsp; info@nexoraonline.de</a>
      <nav className="legal-links" aria-label="Rechtliche Informationen">
        <a href="https://www.digital-future.ai/widerruf.html" target="_blank" rel="noopener noreferrer">Widerruf</a><i>|</i><a href="https://www.digital-future.ai/agb.html" target="_blank" rel="noopener noreferrer">AGB</a><i>|</i><a href="https://www.digital-future.ai/datenschutz.html" target="_blank" rel="noopener noreferrer">Datenschutz</a><i>|</i><Link href="/impressum">Impressum</Link><i>|</i><Link href="/cookie-settings">Cookie settings</Link>
      </nav>
      <small className="copyright">© 2026 HELP-ME. All rights reserved.</small>
    </footer>
  </main>;
}
