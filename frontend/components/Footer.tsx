import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";
import { EXPLORER_URL } from "@/lib/wallet";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Shield size={16} color="var(--cyan)" />
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
