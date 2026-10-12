"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Lock, ExternalLink, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { submitWrite, waitForFinalization, findLatestCovenantByOwner } from "@/lib/protocol";
import { genToAtto } from "@/lib/format";
import { useInjectedWallet } from "@/lib/wallet";
import { EXPLORER_URL } from "@/lib/constants";

const STEPS = [
  "Source URL",
  "Public Promise",
  "Breach Rule",
  "Permitted Changes",
  "Beneficiary",
  "Stake & Bounty",
  "Expiry Time",
  "Review & Sign",
];

export default function CreateCovenantPage() {
  const router = useRouter();
  const wallet = useInjectedWallet();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [txHash, setTxHash] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    canonicalUrl: "",
    promise: "",
    breachRule: "",
    permitted: "Editorial styling, typography adjustments, and additions unrelated to the protected promise are permitted.",
    beneficiary: "",
    stake: "0.1",
    bountyPercent: "10",
    expiryHours: "168", // 7 days
  });

  const updateField = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const expiryTimestamp = useMemo(() => {
    const hours = Math.max(2, Number(formData.expiryHours || 0));
    return Math.floor(Date.now() / 1000) + hours * 3600;
  }, [formData.expiryHours]);

  const validateCurrentStep = (): boolean => {
    if (step === 0) {
      if (!formData.title.trim()) { toast.error("Please enter a covenant title."); return false; }
      if (!formData.subject.trim()) { toast.error("Please describe the subject context."); return false; }
      if (!formData.canonicalUrl.startsWith("https://")) { toast.error("Canonical source must start with https://"); return false; }
    } else if (step === 1) {
      if (formData.promise.trim().length < 12) { toast.error("Protected promise must be at least 12 characters long."); return false; }
    } else if (step === 2) {
      if (formData.breachRule.trim().length < 20) { toast.error("Breach rule must be specific (minimum 20 characters)."); return false; }
    } else if (step === 3) {
      if (formData.permitted.trim().length < 4) { toast.error("Specify what modifications remain permitted."); return false; }
    } else if (step === 4) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(formData.beneficiary)) { toast.error("Enter a valid 0x Ethereum/GenLayer beneficiary address."); return false; }
    } else if (step === 5) {
      try {
        const atto = genToAtto(formData.stake);
        if (atto < 10n ** 15n || atto > 10n * 10n ** 18n) { toast.error("Stake must be between 0.001 and 10 test GEN."); return false; }
      } catch {
        toast.error("Invalid stake number."); return false;
      }
      const b = Number(formData.bountyPercent);
      if (b < 1 || b > 25) { toast.error("Finder bounty must be between 1% and 25%."); return false; }
    } else if (step === 6) {
      const h = Number(formData.expiryHours);
      if (h < 2 || h > 720) { toast.error("Expiry must be between 2 and 720 hours (up to 30 days)."); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    if (!wallet.address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    setBusy(true);
    setTxHash("");
    try {
      const rewardBps = BigInt(Math.round(Number(formData.bountyPercent) * 100));
      const stakeAtto = genToAtto(formData.stake);

      const hash = await submitWrite(
        wallet.address,
        "create_covenant",
        [
          formData.title.trim(),
          formData.subject.trim(),
          formData.canonicalUrl.trim(),
          formData.promise.trim(),
          formData.breachRule.trim(),
          formData.permitted.trim(),
          formData.beneficiary.trim(),
          rewardBps,
          BigInt(expiryTimestamp),
        ],
        stakeAtto
      );

      setTxHash(hash);
      toast.info("Covenant transaction submitted to GenLayer Studionet", {
        description: "Waiting for validator baseline inspection consensus...",
      });

      await waitForFinalization(hash);
      toast.success("Covenant registered on StudioNet! Fetching created covenant ID...");

      const newId = await findLatestCovenantByOwner(wallet.address, true);
      if (newId) {
        router.push(`/covenants/${newId}`);
      } else {
        router.push("/covenants");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: "800px", margin: "0 auto 36px", textAlign: "center" }}>
        <span className="mono-tag">GENSECURE COVENANT STUDIO</span>
        <h1 style={{ fontSize: "38px", fontWeight: 800, marginTop: "8px" }}>
          Stake a Public Commitment
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "15px", marginTop: "8px" }}>
          Lock economic GEN behind a canonical web policy. GenSecure will independently evaluate the live URL to verify the baseline before activating.
        </p>
      </div>

      {/* Wizard Steps Bar */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto 36px",
        display: "flex",
        justifyContent: "space-between",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "8px",
      }}>
        {STEPS.map((name, i) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: i === step ? "var(--cyan)" : i < step ? "var(--emerald)" : "var(--text-dim)",
              fontWeight: 600,
            }}
          >
            <span style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: i === step ? "rgba(6, 182, 212, 0.2)" : i < step ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${i === step ? "var(--cyan)" : i < step ? "var(--emerald)" : "var(--border-subtle)"}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {i < step ? <Check size={11} /> : i + 1}
            </span>
            <span>{name}</span>
          </div>
        ))}
      </div>

      {/* Step Body */}
      <div className="form-step-wrapper">
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Define the Public Source & Subject
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              The canonical URL will be frozen permanently. Challengers cannot substitute an alternative source.
            </p>

            <div className="form-group">
              <label>Covenant Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Zero Customer Data Monetization Guarantee"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Canonical HTTPS URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com/legal/privacy-policy"
                value={formData.canonicalUrl}
                onChange={(e) => updateField("canonicalUrl", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Subject Context</label>
              <textarea
                className="form-control"
                placeholder="Describe the organization or entity and the scope of this policy..."
                value={formData.subject}
                onChange={(e) => updateField("subject", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Formulate the Protected Promise
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              State the exact substantive commitment that must remain active on the canonical page.
            </p>

            <div className="form-group">
              <label>Protected Promise</label>
              <textarea
                className="form-control"
                style={{ minHeight: "140px", fontSize: "16px" }}
                placeholder="e.g. Customer personal and financial records are never sold, rented, leased, or transferred to third-party data brokers."
                value={formData.promise}
                onChange={(e) => updateField("promise", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Establish Strict Breach Rules
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              What operational wording changes count as violating the covenant? GenSecureJudge uses this rule during adjudication.
            </p>

            <div className="form-group">
              <label>Breach Rule Definition</label>
              <textarea
                className="form-control"
                style={{ minHeight: "140px" }}
                placeholder="e.g. Any amendment or addition permitting commercial licensing, selling, or brokerage of customer information to third parties constitutes an immediate breach."
                value={formData.breachRule}
                onChange={(e) => updateField("breachRule", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Permitted Exceptions & Routine Updates
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              Formatting, typographical corrections, or non-substantive adjustments should not trigger false breaches.
            </p>

            <div className="form-group">
              <label>Permitted Modifications</label>
              <textarea
                className="form-control"
                value={formData.permitted}
                onChange={(e) => updateField("permitted", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Designate Beneficiary Address
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              If a covenant breach is confirmed, the remaining stake is automatically transferred to this address.
            </p>

            <div className="form-group">
              <label>Beneficiary Wallet Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="0x..."
                value={formData.beneficiary}
                onChange={(e) => updateField("beneficiary", e.target.value)}
              />
              <button
                type="button"
                onClick={() => wallet.address && updateField("beneficiary", wallet.address)}
                style={{ background: "none", border: "none", color: "var(--cyan)", fontSize: "12px", cursor: "pointer", textAlign: "left", marginTop: "4px" }}
              >
                Use connected wallet ({wallet.address ? wallet.address.slice(0, 10) + "..." : "none"})
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Economic Stakes & Challenger Bounty
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              Deposit test GEN stake into GenSecure escrow. The finder reward incentivizes public community monitors.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label>Stake Escrow (GEN)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.stake}
                  onChange={(e) => updateField("stake", e.target.value)}
                />
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Min 0.001 - Max 10 GEN</span>
              </div>

              <div className="form-group">
                <label>Challenger Bounty (%)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.bountyPercent}
                  onChange={(e) => updateField("bountyPercent", e.target.value)}
                />
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Between 1% and 25%</span>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
              Covenant Lifetime & Expiration
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
              At expiration, if no breach has occurred, the owner can reclaim 100% of the unbreached stake.
            </p>

            <div className="form-group">
              <label>Active Duration (Hours)</label>
              <input
                type="number"
                className="form-control"
                value={formData.expiryHours}
                onChange={(e) => updateField("expiryHours", e.target.value)}
              />
              <span style={{ fontSize: "12px", color: "var(--cyan)", marginTop: "6px" }}>
                Target Expiration: {new Date(expiryTimestamp * 1000).toUTCString()}
              </span>
            </div>
          </div>
        )}

        {step === 7 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Lock size={20} color="var(--cyan)" />
              <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Review & Commit to StudioNet</h2>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "20px" }}>
              Once submitted, GenLayer validators will independently crawl the canonical URL to establish the certified baseline.
            </p>

            <div style={{ background: "rgba(5, 8, 14, 0.7)", borderRadius: "12px", padding: "20px", display: "grid", gap: "12px" }}>
              <div className="meta-key-value">
                <span>Covenant Title</span>
                <strong>{formData.title}</strong>
              </div>
              <div className="meta-key-value">
                <span>Canonical URL</span>
                <strong style={{ color: "var(--cyan)" }}>{formData.canonicalUrl}</strong>
              </div>
              <div className="meta-key-value">
                <span>Stake Value</span>
                <strong style={{ color: "var(--emerald)" }}>{formData.stake} GEN</strong>
              </div>
              <div className="meta-key-value">
                <span>Finder Reward</span>
                <strong>{formData.bountyPercent}%</strong>
              </div>
              <div className="meta-key-value">
                <span>Beneficiary</span>
                <strong>{formData.beneficiary}</strong>
              </div>
            </div>

            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "inline-block", marginTop: "16px", color: "var(--cyan)", fontSize: "12px", fontFamily: "var(--font-mono)" }}
              >
                View Submitted Transaction on StudioNet Explorer ↗
              </a>
            )}
          </div>
        )}

        {/* Wizard Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBack}
            disabled={step === 0 || busy}
          >
            <ArrowLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void handleSubmit()}
            >
              {busy ? "Locking on StudioNet..." : "Sign & Lock Covenant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
