"use client";

import { useEffect, useState, use } from "react";
import { ExternalLink, Shield, AlertTriangle, Scale, Lock, Clock, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getCovenant,
  listChallenges,
  submitWrite,
  waitForFinalization,
  baselineExpiryAvailable,
  challengeExpiryAvailable,
} from "@/lib/protocol";
import { Covenant, Challenge } from "@/lib/types";
import { attoToGen, shorten, timeLabel, isoLabel } from "@/lib/format";
import { useInjectedWallet, EXPLORER_URL, sameWallet } from "@/lib/wallet";

export default function CovenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const wallet = useInjectedWallet();

  const [covenant, setCovenant] = useState<Covenant | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txHash, setTxHash] = useState("");

  const refresh = async () => {
    try {
      const c = await getCovenant(id, true);
      const chList = await listChallenges(id, 0, 24, true);
      setCovenant(c);
      setChallenges(chList.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (fnName: string, args: unknown[], successMsg: string, value = 0n) => {
    if (!wallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    setBusy(true);
    setTxHash("");
    try {
      const hash = await submitWrite(wallet.address, fnName, args, value);
      setTxHash(hash);
      toast.info("Transaction submitted to GenLayer Studionet", {
        description: "Waiting for validator consensus finalization...",
      });
      await waitForFinalization(hash);
      toast.success(successMsg);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleChallenge = () => {
    if (!covenant) return;
    const bond = BigInt(covenant.challenge_bond_atto || "100000000000000");
    void handleAction(
      "challenge_covenant",
      [covenant.id],
      "Challenge initiated! GenSecureInspector is re-evaluating the canonical source.",
      bond
    );
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "100px 0" }}>
        <span className="mono-tag">READING STUDIONET STATE...</span>
        <h2 style={{ marginTop: "12px" }}>Synchronizing Covenant Protocol State</h2>
      </div>
    );
  }

  if (!covenant) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "100px 0" }}>
        <h2>Covenant Not Found</h2>
        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
          Unable to find covenant ID {id} on GenSecureRegistry.
        </p>
      </div>
    );
  }

  const canExpireBaseline = baselineExpiryAvailable(covenant);
  const expirableChallenges = challenges.filter((ch) => challengeExpiryAvailable(ch));

  return (
    <div className="page-container">
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "28px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span className="row-id" style={{ fontSize: "16px" }}>{covenant.id}</span>
            <StatusBadge status={covenant.status} />
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800 }}>{covenant.title}</h1>
        </div>

        <a
          href={covenant.canonical_url}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ fontSize: "13px", padding: "10px 16px" }}
        >
          View Live Source URL <ExternalLink size={13} />
        </a>
      </div>

      <div className="detail-layout">
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Covenant Specification Card */}
          <div className="cyber-card">
            <span className="mono-tag">IMMUTABLE PARAMETERS FROZEN ON-CHAIN</span>
            <div style={{ display: "grid", gap: "18px", marginTop: "16px" }}>
              <div>
                <small style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>PROTECTED PROMISE</small>
                <div className="document-quote" style={{ marginTop: "6px", fontSize: "17px", fontWeight: 500 }}>
                  &ldquo;{covenant.protected_promise}&rdquo;
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                <div>
                  <small style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>BREACH RULE</small>
                  <p style={{ marginTop: "6px", fontSize: "14px", lineHeight: "1.5", color: "var(--text-soft)" }}>
                    {covenant.breach_rule}
                  </p>
                </div>
                <div>
                  <small style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>PERMITTED EXCEPTIONS</small>
                  <p style={{ marginTop: "6px", fontSize: "14px", lineHeight: "1.5", color: "var(--text-soft)" }}>
                    {covenant.permitted_changes}
                  </p>
                </div>
              </div>

              <div>
                <small style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>SUBJECT CONTEXT</small>
                <p style={{ marginTop: "6px", fontSize: "14px", color: "var(--text-soft)" }}>
                  {covenant.subject}
                </p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Semantic Drift Comparison */}
          <div className="cyber-card">
            <span className="mono-tag">INDEPENDENT SEMANTIC AUDIT</span>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "8px 0 20px" }}>
              Baseline Certification vs Current URL Snapshot
            </h2>

            <div className="split-viewport">
              <div className="split-panel">
                <div className="panel-tag">
                  <span>STAGE 01</span>
                  <strong style={{ color: "var(--cyan)" }}>CERTIFIED BASELINE</strong>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: 1.5 }}>
                  {covenant.baseline_review?.basis || "Baseline consensus verified the canonical source matches the promised covenant."}
                </div>
                <div style={{ marginTop: "auto", fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  Compliant: {covenant.baseline_review?.baseline_compliant !== false ? "YES" : "NO"} · Breach Active: {covenant.baseline_review?.breach_condition_present ? "YES" : "NO"}
                </div>
              </div>

              <div className={`split-panel ${covenant.last_inspection?.status === "MATERIAL_CHANGE" ? "breached-glow" : ""}`}>
                <div className="panel-tag">
                  <span>STAGE 02</span>
                  <strong>{covenant.last_inspection?.status ? covenant.last_inspection.status.replaceAll("_", " ") : "NO CHALLENGE"}</strong>
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-main)", lineHeight: 1.5 }}>
                  {covenant.last_inspection?.basis || "No material inspection recorded yet. Source remains unchallenged."}
                </div>
                <div style={{ marginTop: "auto", fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  Current Compliant: {covenant.last_inspection?.current_compliant ? "YES" : "NO"} · Breach Condition Now: {covenant.last_inspection?.breach_condition_now_supported ? "YES" : "NO"}
                </div>
              </div>
            </div>
          </div>

          {/* Dispute & Challenge History */}
          <div className="cyber-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="mono-tag">CHALLENGE AUDIT TRAIL</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {challenges.length} RECORDED
              </span>
            </div>

            {challenges.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px", padding: "16px 0" }}>
                No challenges submitted against this covenant yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {challenges.map((ch) => (
                  <div key={ch.id} style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "rgba(5, 8, 14, 0.6)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyan)" }}>{ch.id}</span>
                        <StatusBadge status={ch.status} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {isoLabel(ch.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5 }}>
                      {ch.judgment?.basis || ch.inspection?.basis || "Validator consensus in progress."}
                    </p>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                      Challenger: {shorten(ch.challenger)} · Bond: {attoToGen(ch.bond_atto)} GEN
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Stake Escrow Panel */}
          <div className="stake-box">
            <span className="mono-tag">ECONOMIC ASSURANCE</span>
            <div>
              <div className="stake-amount-hero">
                {attoToGen(covenant.remaining_stake_atto || covenant.stake_atto)}
                <small>GEN</small>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Escrowed in GenSecureRegistry
              </span>
            </div>

            <div>
              <div className="meta-key-value">
                <span>Owner</span>
                <strong>{shorten(covenant.owner)}</strong>
              </div>
              <div className="meta-key-value">
                <span>Beneficiary</span>
                <strong>{shorten(covenant.beneficiary)}</strong>
              </div>
              <div className="meta-key-value">
                <span>Finder Bounty</span>
                <strong style={{ color: "var(--emerald)" }}>{Number(covenant.finder_reward_bps || 0) / 100}%</strong>
              </div>
              <div className="meta-key-value">
                <span>Challenge Bond</span>
                <strong>{attoToGen(covenant.challenge_bond_atto)} GEN</strong>
              </div>
              <div className="meta-key-value">
                <span>Covenant Expiry</span>
                <strong>{timeLabel(covenant.expires_at)}</strong>
              </div>
            </div>

            {/* Challenge Action */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>
                Challenge Drift on Live Source
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
                Challengers do not submit evidence screenshots. GenLayer independently re-crawls the canonical URL and evaluates breach rules.
              </p>

              {!wallet.connected ? (
                <button className="btn-wallet" style={{ width: "100%", justifyContent: "center" }} onClick={() => void wallet.connect()}>
                  Connect Wallet to Challenge
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={!covenant.can_challenge || busy}
                  onClick={handleChallenge}
                >
                  {busy ? "Confirming on StudioNet..." : covenant.can_challenge ? "Re-Inspect & Challenge Source" : "Challenge Unavailable"}
                </button>
              )}

              {/* Lifecycle Recovery Buttons */}
              {wallet.connected && (canExpireBaseline || covenant.can_expire || expirableChallenges.length > 0) && (
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {canExpireBaseline && (
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", fontSize: "12px" }}
                      disabled={busy}
                      onClick={() => void handleAction("expire_baseline", [covenant.id], "Baseline expired successfully.")}
                    >
                      Expire Timeout Baseline
                    </button>
                  )}
                  {covenant.can_expire && (
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", fontSize: "12px" }}
                      disabled={busy}
                      onClick={() => void handleAction("expire_covenant", [covenant.id], "Covenant expired. Stake returned to owner.")}
                    >
                      Expire Covenant & Return Stake
                    </button>
                  )}
                  {expirableChallenges.map((ch) => (
                    <button
                      key={ch.id}
                      className="btn-secondary"
                      style={{ width: "100%", fontSize: "12px" }}
                      disabled={busy}
                      onClick={() => void handleAction("expire_challenge", [ch.id], `Challenge ${ch.id} expired. Bond refunded.`)}
                    >
                      Refund Timed-Out Challenge {ch.id}
                    </button>
                  ))}
                </div>
              )}

              {txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", marginTop: "12px", fontSize: "11px", color: "var(--cyan)", fontFamily: "var(--font-mono)" }}
                >
                  View Submitted Tx on Explorer ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
