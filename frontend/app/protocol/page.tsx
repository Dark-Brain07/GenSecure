import { Shield, Eye, Scale, Database, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProtocolArchitecturePage() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: "800px", marginBottom: "48px" }}>
        <span className="mono-tag">PROTOCOL SPECIFICATION & TRUST BOUNDARIES</span>
        <h1 style={{ fontSize: "40px", fontWeight: 800, marginTop: "8px" }}>
          Decentralized Covenant Enforcement
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "16px", lineHeight: "1.6", marginTop: "12px" }}>
          Traditional smart contracts are deterministic state machines incapable of reading the live web or interpreting natural-language policy shifts. GenSecure separates observation from settlement using GenVM intelligent contracts.
        </p>
      </div>

      {/* Trust Boundaries */}
      <div style={{ display: "grid", gap: "24px", marginBottom: "60px" }}>
        <div className="cyber-card">
          <span className="mono-tag">BOUNDARY 01 · IMMUTABLE ENROLLMENT</span>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "8px 0 12px" }}>
            Baseline Verification Pre-Condition
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6, fontSize: "15px" }}>
            An organization cannot simply stake funds on any arbitrary claim. Upon calling <code>create_covenant</code>,
            the covenant enters a <code>BASELINE_PENDING</code> state. GenLayer validators independently fetch the canonical HTTPS
            URL and verify seven deterministic semantic flags (accessible, same subject, promise supported, rule testable, time scope valid, compliant, no active breach condition). Only when verified does the covenant activate.
          </p>
        </div>

        <div className="cyber-card">
          <span className="mono-tag">BOUNDARY 02 · OBJECTIVE EVIDENCE ONLY</span>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "8px 0 12px" }}>
            The Challenger Does Not Supply Proof
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6, fontSize: "15px" }}>
            To prevent fraud or fabricated evidence screenshots, challengers cannot provide arbitrary URLs or documents.
            A challenge merely instructs <code>GenSecureInspector</code> to re-crawl the <b>exact frozen canonical URL</b>
            established at covenant creation. Validators independently determine whether the operative semantic terms have materially deviated.
          </p>
        </div>

        <div className="cyber-card">
          <span className="mono-tag">BOUNDARY 03 · SEPARATE ADJUDICATION GATE</span>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "8px 0 12px" }}>
            Decoupled Breach Judgment
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6, fontSize: "15px" }}>
            Detecting a change is not the same as confirming a breach. Only when <code>GenSecureInspector</code> finalizes a <code>MATERIAL_CHANGE</code>
            consensus does the state proceed to <code>GenSecureJudge</code>. The judge re-fetches the live source independently to verify whether the shift violates the immutable breach rule or is permitted under routine exceptions.
          </p>
        </div>

        <div className="cyber-card">
          <span className="mono-tag">BOUNDARY 04 · MATHEMATICAL CONSERVATION</span>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "8px 0 12px" }}>
            Conservation Invariant & Pull Settlement
          </h2>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6, fontSize: "15px" }}>
            At all times, the Registry strictly maintains the conservation formula:
            <br />
            <code>Total Deposited = Stake Escrow + Bond Escrow + Claimable Credits + Total Withdrawn</code>.
            Payouts are credited on-chain before any ETH/GEN transfer is triggered, ensuring reentrancy safety and zero stranded funds.
          </p>
        </div>
      </div>

      {/* Consensus Principles */}
      <div style={{
        background: "var(--bg-panel-solid)",
        border: "1px solid var(--border-panel)",
        borderRadius: "20px",
        padding: "40px",
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "20px" }}>
          Core Protocol Invariants
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          <div>
            <h4 style={{ color: "var(--cyan)", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Fail Closed</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
              Network hiccups, temporary server downtime, or semantic ambiguity refund the challenger&apos;s bond rather than fabricating a false breach verdict.
            </p>
          </div>

          <div>
            <h4 style={{ color: "var(--cyan)", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>Zero Operator Key</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
              The deployer loses configuration access once components are bound. No admin can pause disputes, alter stakes, or reverse finalized verdicts.
            </p>
          </div>

          <div>
            <h4 style={{ color: "var(--cyan)", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>No Central Oracle</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
              Consensus relies directly on GenLayer validator quorum re-evaluating prompt logic against the live web under comparative equivalence principles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
