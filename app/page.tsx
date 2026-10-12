"use client";

import { useMemo, useState } from "react";

const categories = [
  { name: "Beauty", ar: "الجمال والعناية", icon: "✧", note: "Fragrance, skincare & makeup" },
  { name: "Fashion", ar: "الأزياء", icon: "♧", note: "Pieces made to feel like you" },
  { name: "Bags", ar: "الحقائب", icon: "▱", note: "Everyday icons & evening bags" },
  { name: "Jewelry", ar: "المجوهرات", icon: "◇", note: "Little details, lasting beauty" },
  { name: "Lingerie", ar: "الملابس الداخلية", icon: "♡", note: "Comfort, confidence & softness" },
  { name: "Hair Care", ar: "العناية بالشعر", icon: "⌁", note: "Tools and rituals for your hair" },
  { name: "Technology", ar: "التقنية", icon: "▯", note: "Smart essentials for her life" },
  { name: "Gifts", ar: "الهدايا", icon: "♢", note: "Thoughtful moments, beautifully wrapped" },
  { name: "Watches", ar: "الساعات", icon: "◷", note: "Timeless finishing touches" },
  { name: "Body Care", ar: "العناية بالجسم", icon: "❋", note: "Your own moment of calm" },
];

const products = [
  { id: 1, name: "Rose Veil Eau de Parfum", type: "Beauty", price: "€—", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85", tag: "THE SIGNATURE EDIT" },
  { id: 2, name: "The Everyday Shoulder Bag", type: "Bags", price: "€—", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85", tag: "TIMELESS STYLE" },
  { id: 3, name: "Golden Hour Earrings", type: "Jewelry", price: "€—", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=85", tag: "A LITTLE LUXURY" },
  { id: 4, name: "Everyday Smart Companion", type: "Technology", price: "€—", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=85", tag: "SMART & BEAUTIFUL" },
  { id: 5, name: "The Soft Touch Gift Set", type: "Gifts", price: "€—", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=85", tag: "READY TO GIFT" },
  { id: 6, name: "Silk-Feel Evening Edit", type: "Fashion", price: "€—", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=85", tag: "FEEL BEAUTIFUL" },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [language, setLanguage] = useState("EN");
  const [notice, setNotice] = useState("");
  const visibleProducts = useMemo(() => products.filter((p) => (activeCategory === "All" || p.type === activeCategory) && (p.name + " " + p.type).toLowerCase().includes(search.toLowerCase())), [activeCategory, search]);

  return (
    <main className="storefront" id="top">
      <div className="announcement">A little luxury, delivered with care <span>✦</span> Designed for the modern woman</div>
      <header className="site-header">
        <button className="mobile-menu" aria-label="Open menu" onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}>☰</button>
        <a href="#top" className="wordmark" aria-label="Helpme home"><span className="logo-leaf">✦</span><span className="logo-h">H</span>elpme<span className="registered">®</span><span className="logo-swish" /></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#categories">Discover</a><a href="#edit">The Edit</a><a href="#story">Our Story</a><a href="#footer">Contact</a>
        </nav>
        <div className="header-tools">
          <label className="language-select"><span className="sr-only">Language</span><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="EN">EN</option><option value="DE">DE</option><option value="AR">AR</option></select></label>
          <button className="icon-button" aria-label="Search products" onClick={() => document.getElementById("product-search")?.focus()}>⌕</button>
          <button className="icon-button bag-button" aria-label="Shopping bag preview" onClick={() => setNotice("This is a design preview. Checkout will be enabled after supplier, pricing and shipping arrangements are confirmed.")}>♧<span>{cartCount}</span></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> YOUR STYLE. OUR MISSION. <span /></div>
          <h1>More than<br /><em>just shopping.</em></h1>
          <p className="hero-subtitle">It’s a better you.</p>
          <p className="hero-description">A thoughtful world of beauty, fashion, technology and gifts — chosen to make every day feel a little more special.</p>
          <a className="primary-button" href="#categories">Discover your favorites <span>→</span></a>
          <p className="arabic-line" lang="ar" dir="rtl">تسوّقي ما تحبين... نحن هنا لمساعدتك</p>
        </div>
        <div className="hero-photo" role="img" aria-label="Elegant woman in a warm boutique setting">
          <div className="photo-caption"><span>THE HELP ME EDIT</span><b>For every side<br />of wonderful you.</b></div>
        </div>
        <div className="hero-side">
          <p className="side-script">Shop Smart<br /><em>Live Beautiful</em></p>
          <span className="side-flourish">✦</span>
          <p>YOUR MOMENT.<br />YOUR STYLE.</p>
        </div>
        <div className="hero-bottom-note"><span>01 / 04</span><span className="hero-line" /><span>BEAUTY IN EVERY DETAIL</span></div>
      </section>

      <section className="promise-strip" aria-label="Our promises">
        <div className="promise"><span className="promise-icon">♧</span><b>Thoughtfully selected</b><small>Quality comes first</small></div>
        <div className="promise"><span className="promise-icon">♧</span><b>Delivery with care</b><small>Across Germany & Europe</small></div>
        <div className="promise"><span className="promise-icon">♡</span><b>Here to help</b><small>A shopping experience made easy</small></div>
        <div className="promise"><span className="promise-icon">◇</span><b>Shopping you can trust</b><small>Clear details, no surprises</small></div>
        <div className="palette-note"><span className="swatch swatch-dark" /><span className="swatch swatch-gold" /><span className="swatch swatch-rose" /><span className="swatch swatch-cream" /><small>OUR SIGNATURE PALETTE</small></div>
      </section>

      <section className="category-section section-pad" id="categories">
        <div className="section-intro"><span className="eyebrow">A WORLD MADE FOR YOU</span><h2>Find your <em>kind of beautiful.</em></h2><p>From everyday essentials to the pieces you’ll treasure, explore a collection made around you.</p></div>
        <div className="category-grid">
          {categories.map((category) => <button key={category.name} className="category-card" onClick={() => { setActiveCategory(category.name); document.getElementById("edit")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="category-icon">{category.icon}</span><strong>{category.name}</strong><small>{category.note}</small><span className="category-arrow">↗</span>
          </button>)}
        </div>
      </section>

      <section className="editorial-banner" id="story">
        <div className="editorial-image" />
        <div className="editorial-copy"><span className="eyebrow">A NOTE FROM HELP-ME</span><h2>Little things.<br /><em>Lovely feelings.</em></h2><p>We believe shopping should feel personal, inspiring and easy. That’s why every detail matters — from the first hello to the moment your parcel arrives.</p><a href="#edit" className="text-button">Meet your new favorites <span>→</span></a><p className="arabic-editorial" lang="ar" dir="rtl">كل ما تحتاجه المرأة العصرية في مكان واحد</p></div>
      </section>

      <section className="edit-section section-pad" id="edit">
        <div className="section-heading-row"><div><span className="eyebrow">THE CURATED EDIT</span><h2>Lovely things, <em>lovingly chosen.</em></h2></div><a href="#categories" className="text-button">Explore all categories ↗</a></div>
        <div className="product-controls"><div className="filter-chips"><button className={activeCategory === "All" ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory("All")}>All the edit</button>{["Beauty","Fashion","Bags","Jewelry","Technology","Gifts"].map((cat) => <button key={cat} className={activeCategory === cat ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory(cat)}>{cat}</button>)}</div><input id="product-search" className="product-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the edit…" aria-label="Search the product preview" /></div>
        <div className="product-grid">
          {visibleProducts.map((product) => <article className="product-card" key={product.id}><div className="product-image-wrap"><img src={product.image} alt="" className="product-image" loading="lazy" /><span className="product-tag">{product.tag}</span><button className="favorite-button" aria-label={"Save " + product.name} onClick={() => setNotice("Favorites will be available in the full store.")}>♡</button></div><div className="product-info"><span>{product.type}</span><h3>{product.name}</h3><div className="product-bottom"><b>{product.price}</b><button onClick={() => setNotice("This item is a visual sample only. We’ll add confirmed products and real prices after supplier approval.")}>Discover <span>→</span></button></div></div></article>)}
        </div>
        {visibleProducts.length === 0 && <p className="empty-state">No preview items in this selection yet. Choose another category to explore.</p>}
        <p className="preview-disclaimer">Preview collection — sample imagery and placeholder prices. Products are not yet available for purchase.</p>
      </section>

      <section className="newsletter section-pad"><div><span className="eyebrow">A LITTLE NOTE OF LOVELINESS</span><h2>Good things are <em>coming.</em></h2><p>We’re carefully preparing the HELP-ME shopping experience. Be the first to hear when our curated collection is ready.</p></div><form onSubmit={(e) => { e.preventDefault(); setNotice("Thank you for your interest. Newsletter sign-up will be activated when the store launch setup is complete."); }}><label htmlFor="newsletter-email">Your email address</label><div className="newsletter-field"><input id="newsletter-email" type="email" required placeholder="you@example.com" /><button type="submit" aria-label="Join newsletter">→</button></div><small>No spam, just lovely updates. Sign-up is a preview for now.</small></form></section>

      <footer className="site-footer" id="footer"><div className="footer-top"><div className="footer-brand"><a href="#top" className="wordmark footer-wordmark"><span className="logo-leaf">✦</span><span className="logo-h">H</span>elpme<span className="registered">®</span><span className="logo-swish" /></a><p>Your style. Our mission.<br /><span lang="ar" dir="rtl">تسوّقي ما تحبين... نحن هنا لمساعدتك</span></p></div><div className="footer-column"><b>EXPLORE</b><a href="#categories">Beauty & Fragrance</a><a href="#categories">Fashion & Lingerie</a><a href="#categories">Bags & Accessories</a><a href="#categories">Technology & Gifts</a></div><div className="footer-column"><b>HELP & INFO</b><a href="mailto:info@nexoraonline.de">Contact us</a><a href="#story">Our story</a><a href="#footer">Shipping & returns — coming soon</a><a href="#footer">Privacy & legal information — to be completed</a></div><div className="footer-mantra"><span>✦</span><p>Shop Smart.<br /><em>Live Beautiful.</em></p></div></div><div className="footer-bottom"><span>© 2026 HELP-ME · Digitalfuture</span><span>Made with care for the modern woman</span><a href="https://www.nexoraonline.de">nexoraonline.de ↗</a></div></footer>
      {notice && <div className="notice-backdrop" role="presentation" onClick={() => setNotice("")}><div className="notice-dialog" role="dialog" aria-modal="true" aria-label="Store preview notice" onClick={(e) => e.stopPropagation()}><span className="notice-star">✦</span><h3>A little note from HELP-ME</h3><p>{notice}</p><button className="primary-button" onClick={() => setNotice("")}>Understood <span>→</span></button></div></div>}
    </main>
  );
}
