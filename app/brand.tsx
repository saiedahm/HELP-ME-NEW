import Image from "next/image";
import Link from "next/link";

type BrandProps = { compact?: boolean; href?: string; className?: string };

export default function Brand({ compact = false, href = "/", className = "" }: BrandProps) {
  return (
    <Link href={href} className={`brand brand-modern ${compact ? "brand-compact" : ""} ${className}`.trim()} aria-label="HELP-ME home">
      <Image
        className="brand-uploaded-logo"
        src="/help-me-logo.png"
        alt="HELP-ME — AI support"
        width={96}
        height={96}
        priority
      />
      <span className="brand-word">HELP<span>-ME</span></span>
    </Link>
  );
}
