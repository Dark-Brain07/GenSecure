import { ExternalLink, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import deployment from "@/lib/deployment.json";

export default function VerificationProofsPage() {
  const contracts = [
    {
      name: "GenSecureRegistry",
      role: "Escrow Accounting, Lifecycle, and Settlement",
      address: deployment.contracts.registry.address,
      txHash: deployment.contracts.registry.txHash,
    },
    {
      name: "GenSecureInspector",
      role: "Baseline Web Certification & Material Change Detection",
      address: deployment.contracts.inspector.address,
      txHash: deployment.contracts.inspector.txHash,
    },
    {
      name: "GenSecureJudge",
      role: "Independent Semantic Breach Adjudication",
      address: deployment.contracts.judge.address,
      txHash: deployment.contracts.judge.txHash,
    },
  ];

  return (
    <div className="page-container">
      <div style={{ maxWidth: "800px", marginBottom: "40px" }}>
        <span className="mono-tag">GENLAYER STUDIONET (CHAIN 61999) · ON-CHAIN VERIFICATION</span>
        <h1 style={{ fontSize: "38px", fontWeight: 800, marginTop: "8px" }}>
          Deployed Contracts & Live Proofs
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "15px", marginTop: "8px" }}>
          The GenSecure protocol operates autonomously across three interconnected intelligent contracts on GenLayer StudioNet. Below are the verified addresses and finalized deployment transactions.
        </p>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 20px",
        background: "rgba(16, 185, 129, 0.08)",
        border: "1px solid rgba(16, 185, 129, 0.25)",
        borderRadius: "14px",
        marginBottom: "36px",
      }}>
        <CheckCircle2 size={18} color="var(--emerald)" />
        <span style={{ fontSize: "14px", color: "var(--text-main)" }}>
          <b>StudioNet 61999 Verified Deployment:</b> All three components are bound under one-time initialization with zero administrative keys.
        </span>
      </div>

      <div style={{ display: "grid", gap: "20px", marginBottom: "40px" }}>
        {contracts.map((c) => (
          <div key={c.name} className="cyber-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="mono-tag" style={{ marginBottom: "4px" }}>INTELLIGENT CONTRACT</span>
                <h3 style={{ fontSize: "20px", fontWeight: 700 }}>{c.name}</h3>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{c.role}</span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--cyan)" }}>
                  {c.address}
                </span>
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
                <span>Tx: </span>
                <span style={{ color: "var(--text-soft)" }}>{c.txHash}</span>
              </div>
              <a
                href={`${EXPLORER_URL}/tx/${c.txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "12px", color: "var(--cyan)", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
              >
                Inspect on GenLayer Explorer <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {deployment.contracts.configureTxHash && (
        <div className="cyber-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="mono-tag">SECURITY BINDING</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700 }}>One-Time Registry Component Binding</h4>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Tx: {deployment.contracts.configureTxHash}
            </span>
          </div>

          <a
            href={`${EXPLORER_URL}/tx/${deployment.contracts.configureTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: "12px", padding: "8px 14px" }}
          >
            Verify Binding Tx <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}
