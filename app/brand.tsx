import Link from "next/link";

type BrandProps = { compact?: boolean; href?: string; className?: string };

export default function Brand({ compact = false, href = "/", className = "" }: BrandProps) {
  return (
    <Link href={href} className={`brand brand-modern ${compact ? "brand-compact" : ""} ${className}`.trim()} aria-label="HELP-ME home">
      <span className="brand-emblem" aria-hidden="true">
        <svg viewBox="0 0 80 80" focusable="false">
          <defs>
            <linearGradient id="helpme-globe-blue" x1="10" y1="8" x2="68" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#64F0FF"/><stop offset=".48" stopColor="#0789F9"/><stop offset="1" stopColor="#173C9A"/>
            </linearGradient>
            <linearGradient id="helpme-globe-gold" x1="18" y1="15" x2="64" y2="67" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF0B1"/><stop offset=".52" stopColor="#FFC45C"/><stop offset="1" stopColor="#C17B22"/>
            </linearGradient>
            <clipPath id="helpme-globe-clip"><circle cx="40" cy="40" r="29"/></clipPath>
          </defs>
          <circle cx="40" cy="40" r="34" fill="#06152D" stroke="url(#helpme-globe-gold)" strokeWidth="1.6"/>
          <circle cx="40" cy="40" r="29" fill="url(#helpme-globe-blue)" stroke="#59E7FF" strokeOpacity=".9" strokeWidth="1.2"/>
          <g clipPath="url(#helpme-globe-clip)" fill="none" stroke="#B9F5FF" strokeOpacity=".68" strokeWidth="1.05">
            <ellipse cx="40" cy="40" rx="12" ry="29"/><ellipse cx="40" cy="40" rx="23" ry="29"/>
            <ellipse cx="40" cy="40" rx="29" ry="11"/><ellipse cx="40" cy="40" rx="29" ry="21"/><path d="M10 40H70"/>
          </g>
          <path d="M14 51C25 59 45 61 61 45" fill="none" stroke="url(#helpme-globe-gold)" strokeWidth="3.2" strokeLinecap="round"/>
          <path d="M18 23C29 13 48 11 61 21" fill="none" stroke="#EAFBFF" strokeOpacity=".9" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="61" cy="21" r="3" fill="#FFD27A"/>
        </svg>
      </span>
      <span className="brand-word">HELP<span>-ME</span></span>
    </Link>
  );
}
