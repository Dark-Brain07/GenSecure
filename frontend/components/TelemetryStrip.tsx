"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/protocol";
import { ProtocolStats } from "@/lib/types";
import { attoToGen } from "@/lib/format";
import { ShieldCheck, Lock, Activity, Award } from "lucide-react";

export function TelemetryStrip() {
  const [stats, setStats] = useState<ProtocolStats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return null;

  return (
    <div className="telemetry-strip">
      <div className="telemetry-cell">
        <small style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Lock size={12} color="var(--cyan)" />
          Total Escrow Staked
        </small>
        <strong>{attoToGen(stats.total_deposited_atto, 4)} GEN</strong>
        <span>Strict conservation invariant verified</span>
      </div>

      <div className="telemetry-cell">
        <small style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={12} color="var(--emerald)" />
          Covenants Registered
        </small>
        <strong>{Number(stats.total_covenants) || Number(stats.covenants_activated) || 0}</strong>
        <span>{Number(stats.covenants_activated) > 0 ? `${stats.covenants_activated} active on StudioNet` : "Staked on StudioNet"}</span>
      </div>

      <div className="telemetry-cell">
        <small style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Activity size={12} color="var(--amber)" />
          Challenges Processed
        </small>
        <strong>{stats.total_challenges}</strong>
        <span>Re-inspections on StudioNet</span>
      </div>

      <div className="telemetry-cell">
        <small style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Award size={12} color="var(--rose)" />
          Breaches Enforced
        </small>
        <strong>{stats.covenants_breached}</strong>
        <span>Bounty settlements finalized</span>
      </div>
    </div>
  );
}
