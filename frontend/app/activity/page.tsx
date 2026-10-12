"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, ArrowUpRight, ShieldCheck, Wallet, ArrowDownCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { getCredit, listWalletChallenges, submitWrite, waitForFinalization } from "@/lib/protocol";
import { Challenge } from "@/lib/types";
import { attoToGen, isoLabel } from "@/lib/format";
import { useInjectedWallet } from "@/lib/wallet";

export default function ActivityLedgerPage() {
  const wallet = useInjectedWallet();
  const [credit, setCredit] = useState("0");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!wallet.address) {
      setLoading(false);
      return;
    }
    try {
      const [c, ch] = await Promise.all([
        getCredit(wallet.address, true),
        listWalletChallenges(wallet.address, 0, 24, true),
      ]);
      setCredit(c);
      setChallenges(ch.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [wallet.address]);

  const handleWithdraw = async () => {
    if (!wallet.address) return;
    setBusy(true);
    try {
      const hash = await submitWrite(wallet.address, "withdraw_credit", [wallet.address]);
      toast.info("Withdrawal transaction submitted", { description: "Waiting for finality..." });
      await waitForFinalization(hash);
      toast.success("GEN credit transferred to your wallet!");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: "36px" }}>
        <span className="mono-tag">WALLET SETTLEMENT LEDGER</span>
        <h1 style={{ fontSize: "38px", fontWeight: 800 }}>
          Assurance & Rewards Vault
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "15px", marginTop: "8px" }}>
          Track challenge bonds, finder bounties, and unbreached stake distributions credited to your wallet address.
        </p>
      </div>

      {!wallet.connected ? (
        <div className="cyber-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Wallet size={40} color="var(--cyan)" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Connect Your Web3 Wallet</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "8px 0 24px" }}>
            Connect MetaMask or any EIP-1193 browser wallet on GenLayer Studionet to inspect your pull-credit balance.
          </p>
          <button className="btn-wallet" style={{ margin: "0 auto" }} onClick={() => void wallet.connect()}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "32px", alignItems: "start" }}>
          {/* Claimable Credit Card */}
          <div className="stake-box">
            <span className="mono-tag">AVAILABLE FOR WITHDRAWAL</span>
            <div>
              <div className="stake-amount-hero">
                {attoToGen(credit, 4)}
                <small>GEN</small>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Pull-based credit in GenSecureRegistry
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-soft)", lineHeight: 1.5 }}>
              GenSecure uses safe pull-accounting. Successful challenger bounties or returned bonds are credited on-chain before transfer.
            </p>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={busy || BigInt(credit || "0") === 0n}
              onClick={handleWithdraw}
            >
              <ArrowDownCircle size={16} />
              {busy ? "Withdrawing on StudioNet..." : "Withdraw to Wallet"}
            </button>
          </div>

          {/* Wallet Challenges List */}
          <div className="cyber-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span className="mono-tag">MY CHALLENGE VERIFICATIONS</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {challenges.length} ACTIONS
              </span>
            </div>

            {loading ? (
              <div style={{ color: "var(--text-muted)", padding: "20px 0" }}>Loading ledger...</div>
            ) : challenges.length === 0 ? (
              <div style={{ color: "var(--text-muted)", padding: "30px 0", textAlign: "center" }}>
                You have not initiated any challenges from this wallet yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {challenges.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/covenants/${ch.covenant_id}`}
                    style={{
                      padding: "16px",
                      borderRadius: "10px",
                      background: "rgba(5, 8, 14, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cyan)" }}>
                          {ch.id}
                        </span>
                        <StatusBadge status={ch.status} />
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Covenant: {ch.covenant_id} · Bond: {attoToGen(ch.bond_atto)} GEN
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                        {isoLabel(ch.created_at)}
                      </span>
                      <ArrowUpRight size={16} color="var(--cyan)" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
