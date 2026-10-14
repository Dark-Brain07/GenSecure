"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Shield, AlertTriangle, RefreshCw } from "lucide-react";
import { StatusBadge, CovenantTypeBadge, SourceStatusBadge } from "@/components/StatusBadge";
import { listCovenants } from "@/lib/protocol";
import { Covenant } from "@/lib/types";
import { attoToGen, timeLabel } from "@/lib/format";

export default function CovenantsDirectoryPage() {
  const [items, setItems] = useState<Covenant[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setRpcError(null);
    listCovenants()
      .then((res) => {
        setItems(res.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error("RPC Error fetching covenants:", err);
        setRpcError(err?.message || "Could not connect to StudioNet RPC node. Please retry.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ORGANIZATIONS" && c.covenant_type === "ORGANIZATION_AUTHENTICATED") ||
        (filter === "COMMUNITY" && c.covenant_type !== "ORGANIZATION_AUTHENTICATED") ||
        (filter === "ACTIVE" && c.status === "ACTIVE") ||
        (filter === "BREACHED" && c.status === "BREACHED") ||
        (filter === "PENDING" && c.status.includes("PENDING"));

      const text = `${c.title} ${c.protected_promise} ${c.canonical_url} ${c.id}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [items, filter, query]);

  return (
    <div className="page-container">
      <div style={{ marginBottom: "40px" }}>
        <span className="mono-tag">GENSECURE PROTOCOL REGISTRY</span>
        <h1 style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Public Covenant Directory
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "16px", marginTop: "8px", maxWidth: "680px" }}>
          Browse all active covenants verified on GenLayer Studionet. Each covenant locks economic GEN stake behind an immutable HTTPS policy source with autonomous validator monitoring.
        </p>
      </div>

      {/* RPC Error Notice if Node Disconnected */}
      {rpcError && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            color: "#f87171",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle size={20} />
            <div>
              <strong>StudioNet RPC Connection Notice:</strong>
              <div style={{ fontSize: "13px", marginTop: "2px", color: "var(--text-soft)" }}>
                {rpcError} (This is a network connectivity warning, not an empty protocol state).
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "13px" }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{
          position: "relative",
          width: "min(420px, 100%)",
          display: "flex",
          alignItems: "center",
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
          <input
            type="text"
            className="form-control"
            style={{ width: "100%", paddingLeft: "40px", borderRadius: "24px" }}
            placeholder="Search covenant title, promise, or URL..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["ALL", "ORGANIZATIONS", "COMMUNITY", "ACTIVE", "BREACHED", "PENDING"].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                background: filter === tag ? "var(--cyan)" : "var(--bg-panel)",
                color: filter === tag ? "#000" : "var(--text-soft)",
                border: "1px solid",
                borderColor: filter === tag ? "var(--cyan)" : "var(--border-subtle)",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Directory List */}
      <div className="covenant-table">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Loading verified on-chain covenants...
          </div>
        ) : filtered.length === 0 && !rpcError ? (
          <div className="cyber-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <Shield size={36} color="var(--cyan)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
              {query ? "No covenants matching search" : "No covenants registered yet"}
            </h3>
            <p style={{ color: "var(--text-soft)", fontSize: "14px", maxWidth: "420px", margin: "0 auto 20px" }}>
              {query ? "Try clearing your search query or filter." : "Create the first verified autonomous covenant on GenLayer StudioNet."}
            </p>
            {!query && (
              <Link href="/create" className="btn-primary" style={{ display: "inline-flex" }}>
                Create Covenant
              </Link>
            )}
          </div>
        ) : (
          filtered.map((c) => (
            <Link key={c.id} href={`/covenants/${c.id}`} className="covenant-row-card">
              <span className="row-id">{c.id}</span>
              <div className="row-body">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                  <CovenantTypeBadge covenantType={c.covenant_type} />
                  <SourceStatusBadge sourceStatus={c.source_status} failures={c.consecutive_source_failures} />
                </div>
                <h3>{c.title}</h3>
                <p>&ldquo;{c.protected_promise}&rdquo;</p>
              </div>
              <div className="row-metrics">
                <span>STAKE ESCROW</span>
                <strong style={{ color: "var(--cyan)", fontSize: "15px" }}>
                  {attoToGen(c.remaining_stake_atto || c.stake_atto)} GEN
                </strong>
                <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>
                  Finder Reward: {Number(c.finder_reward_bps || 0) / 100}%
                </span>
              </div>
              <div className="row-metrics">
                <span>COVERAGE EXPIRY</span>
                <strong style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                  {timeLabel(c.expires_at)}
                </strong>
                <span style={{ fontSize: "11px" }}>{c.challenge_count || 0} disputes</span>
              </div>
              <StatusBadge status={c.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
