import Link from "next/link";

type BrandProps = { compact?: boolean; href?: string; className?: string };

export default function Brand({ compact = false, href = "/", className = "" }: BrandProps) {
  return (
    <Link href={href} className={`brand brand-modern ${compact ? "brand-compact" : ""} ${className}`.trim()} aria-label="HELP-ME home">
      <span className="brand-emblem" aria-hidden="true">
        <svg viewBox="0 0 80 80" role="img" aria-label="HELP-ME abstract H mark">
          <defs>
            <linearGradient id="helpme-brand-blue" x1="12" y1="8" x2="67" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#46D9FF"/><stop offset=".5" stopColor="#0879F9"/><stop offset="1" stopColor="#123C91"/></linearGradient>
            <linearGradient id="helpme-brand-gold" x1="20" y1="14" x2="63" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF0A8"/><stop offset=".48" stopColor="#E7B84D"/><stop offset="1" stopColor="#B77A20"/></linearGradient>
          </defs>
          <path d="M14 18 Q14 12 20 12 H29 Q34 12 34 18 V31 H47 V18 Q47 12 53 12 H61 Q67 12 67 18 V62 Q67 68 61 68 H53 Q47 68 47 62 V48 H34 V62 Q34 68 29 68 H20 Q14 68 14 62 Z" fill="url(#helpme-brand-blue)"/>
          <path d="M18 51 C29 43 44 33 62 18 L67 27 C51 42 36 53 23 61 Z" fill="url(#helpme-brand-gold)"/>
          <path d="M22 19 V31 M59 50 V61" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
      <span className="brand-word">HELP<span>-ME</span></span>
    </Link>
  );
}
