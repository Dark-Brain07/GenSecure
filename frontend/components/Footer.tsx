import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src="/logo.png"
            alt="GenSecure"
            width={20}
            height={20}
            style={{ borderRadius: "5px", border: "1px solid rgba(6, 182, 212, 0.4)", display: "block" }}
          />
          <span style={{ fontWeight: 700, color: "var(--text-main)" }}>GenSecure Protocol</span>
          <span>· Autonomous Public Covenant & Semantic Assurance</span>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="/protocol" style={{ color: "var(--text-soft)" }}>
            Trust Architecture
          </Link>
          <Link href="/contracts" style={{ color: "var(--text-soft)" }}>
            Contract Verification
          </Link>
          <a
            href={EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--cyan)" }}
          >
            StudioNet Explorer <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
          GenVM Consensus · Chain 61999
        </div>
      </div>
    </footer>
  );
}
