"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, AlertCircle, Scan, CheckCircle2, ChevronRight } from "lucide-react";
import { TelemetryStrip } from "@/components/TelemetryStrip";
import { SecurityRadar } from "@/components/SecurityRadar";
import { StatusBadge } from "@/components/StatusBadge";
import { listCovenants } from "@/lib/protocol";
import { Covenant } from "@/lib/types";
import { attoToGen, timeLabel } from "@/lib/format";

export default function HomePage() {
  const [covenants, setCovenants] = useState<Covenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCovenants(0, 3)
      .then((res) => {
        setCovenants(res.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero-wrapper">
        <span className="mono-tag">
          <Sparkles size={13} />
          GENLAYER-NATIVE COVENANT PROTOCOL
        </span>

        <h1 className="hero-title">
          Stake a public promise. <br />
          <span className="hero-highlight">Prove when it changes.</span>
        </h1>

        <p className="hero-desc">
          Lock real economic stake behind critical web policies and terms. If the canonical source
          silently drifts or violates the frozen covenant, GenLayer validators independently verify the
          shift and settle breach bounties without centralized oracles.
        </p>

        <div className="hero-cta-group">
          <Link href="/create" className="btn-primary">
            Create Covenant <ArrowRight size={16} />
          </Link>
          <Link href="/covenants" className="btn-secondary">
            Explore Active Registry
          </Link>
        </div>
      </section>

      {/* Protocol Telemetry */}
      <TelemetryStrip />

      {/* Interactive Semantic Drift Visualizer */}
      <section className="visualizer-card">
        <div className="visualizer-header">
          <div>
            <span className="mono-tag">INDEPENDENT WEB VERIFICATION ARCHITECTURE</span>
            <h2 style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>
              How Semantic Drift Is Caught On-Chain
            </h2>
          </div>
          <span className="status-badge breached">
            <AlertCircle size={13} />
            BREACH RESOLVED
          </span>
        </div>

        <div className="split-viewport">
          <div className="split-panel">
            <div className="panel-tag">
              <span>FROZEN AT CREATION</span>
              <strong style={{ color: "var(--cyan)" }}>CERTIFIED BASELINE</strong>
            </div>
            <div className="document-quote">
              &ldquo;Customer personal and financial records are <b>never sold, rented, leased, or transferred</b> to third-party data brokers.&rdquo;
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} color="var(--emerald)" />
              Validator consensus confirmed baseline compliance prior to covenant activation.
            </div>
          </div>

          <div className="split-panel breached-glow">
            <div className="panel-tag">
              <span>INDEPENDENT RE-FETCH</span>
              <strong style={{ color: "var(--rose)" }}>DRIFTED STATE DETECTED</strong>
            </div>
            <div className="document-quote">
              &ldquo;Customer personal information <b style={{ color: "var(--rose)" }}>may be shared with selected commercial advertising partners</b>.&rdquo;
            </div>
            <div style={{ fontSize: "12px", color: "var(--rose)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Scan size={14} />
              Material change detected → GenSecureJudge confirmed covenant breach → Stake distributed.
            </div>
          </div>
        </div>
      </section>

      {/* Dual Consensus Architecture */}
      <SecurityRadar />

      {/* Live Covenants Showcase */}
      <section style={{ margin: "80px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <span className="mono-tag">LIVE REGISTRY INDEX</span>
            <h2 style={{ fontSize: "28px", fontWeight: 700 }}>Featured On-Chain Covenants</h2>
          </div>
          <Link href="/covenants" style={{ color: "var(--cyan)", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
            View Full Index <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="cyber-card" style={{ textAlign: "center", padding: "36px 24px", color: "var(--cyan)" }}>
            <span className="pulse-dot" style={{ display: "inline-block", marginRight: "8px" }}></span>
            Connecting to StudioNet RPC node...
          </div>
        ) : covenants.length === 0 ? (
          <div className="cyber-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <ShieldCheck size={40} color="var(--cyan)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No Covenants Registered Yet</h3>
            <p style={{ color: "var(--text-soft)", fontSize: "14px", maxWidth: "460px", margin: "0 auto 20px" }}>
              The GenSecure registry is freshly deployed and live on StudioNet. Be the first to stake a promise!
            </p>
            <Link href="/create" className="btn-primary" style={{ display: "inline-flex" }}>
              Create First Covenant
            </Link>
          </div>
        ) : (
          <div className="covenant-table">
            {covenants.map((c) => (
              <Link key={c.id} href={`/covenants/${c.id}`} className="covenant-row-card">
                <span className="row-id">{c.id}</span>
                <div className="row-body">
                  <h3>{c.title}</h3>
                  <p>&ldquo;{c.protected_promise}&rdquo;</p>
                </div>
                <div className="row-metrics">
                  <span>CANONICAL SOURCE</span>
                  <strong style={{ color: "var(--text-soft)", fontSize: "12px", wordBreak: "break-all" }}>
                    {c.canonical_url.replace("https://", "")}
                  </strong>
                </div>
                <div className="row-metrics">
                  <span>STAKE ESCROW</span>
                  <strong style={{ color: "var(--cyan)", fontSize: "15px" }}>
                    {attoToGen(c.remaining_stake_atto || c.stake_atto)} GEN
                  </strong>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section style={{
        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))",
        border: "1px solid var(--border-glow)",
        borderRadius: "24px",
        padding: "60px 40px",
        textAlign: "center",
        margin: "80px 0 40px",
      }}>
        <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
          Make Critical Public Words Expensive to Break
        </h2>
        <p style={{ color: "var(--text-soft)", maxWidth: "620px", margin: "0 auto 32px", fontSize: "16px" }}>
          Back your privacy guarantees, open-source promises, or service covenents with decentralized economic surety.
        </p>
        <Link href="/create" className="btn-primary" style={{ display: "inline-flex" }}>
          Deploy New Covenant <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
