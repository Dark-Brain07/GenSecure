"use client";

import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Eye, Building2 } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = status?.toUpperCase() || "PENDING";

  if (norm === "ACTIVE" || norm === "BASELINE_VERIFIED" || norm === "NO_RELEVANT_CHANGE") {
    return (
      <span className="status-badge active">
        <ShieldCheck size={12} />
        {norm.replaceAll("_", " ")}
      </span>
    );
  }

  if (norm === "BREACH" || norm === "BREACHED" || norm === "MATERIAL_CHANGE" || norm === "PERSISTENT_WITHDRAWAL") {
    return (
      <span className="status-badge breached">
        <AlertTriangle size={12} />
        {norm.replaceAll("_", " ")}
      </span>
    );
  }

  if (norm.includes("PENDING") || norm.includes("RETRYABLE") || norm.includes("TEMPORARY")) {
    return (
      <span className="status-badge pending">
        <Clock size={12} />
        {norm.replaceAll("_", " ")}
      </span>
    );
  }

  return (
    <span className="status-badge expired">
      <CheckCircle2 size={12} />
      {norm.replaceAll("_", " ")}
    </span>
  );
}

export function CovenantTypeBadge({ covenantType }: { covenantType?: string }) {
  const isOrg = covenantType === "ORGANIZATION_AUTHENTICATED";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "14px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "var(--font-mono)",
        background: isOrg ? "rgba(0, 240, 255, 0.12)" : "rgba(168, 85, 247, 0.12)",
        color: isOrg ? "var(--cyan)" : "#c084fc",
        border: `1px solid ${isOrg ? "rgba(0, 240, 255, 0.3)" : "rgba(168, 85, 247, 0.3)"}`,
      }}
      title={isOrg ? "Authenticated by policy owner / verified domain" : "Independent third-party community assurance"}
    >
      {isOrg ? <Building2 size={12} /> : <Eye size={12} />}
      {isOrg ? "VERIFIED ORG" : "COMMUNITY ASSURANCE"}
    </span>
  );
}

export function SourceStatusBadge({ sourceStatus, failures }: { sourceStatus?: string; failures?: number }) {
  const norm = sourceStatus?.toUpperCase() || "HEALTHY";
  if (norm === "WITHDRAWN") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          background: "rgba(239, 68, 68, 0.15)",
          color: "#f87171",
          border: "1px solid rgba(239, 68, 68, 0.3)",
        }}
      >
        <XCircle size={11} /> Source Withdrawn (Breach)
      </span>
    );
  }
  if (norm === "DEGRADED" || (failures && failures > 0)) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          background: "rgba(245, 158, 11, 0.15)",
          color: "#fbbf24",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        }}
      >
        <AlertTriangle size={11} /> Unreachable ({failures || 1}/3)
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "11px",
        background: "rgba(34, 197, 94, 0.12)",
        color: "#4ade80",
        border: "1px solid rgba(34, 197, 94, 0.25)",
      }}
    >
      <CheckCircle2 size={11} /> Source Active
    </span>
  );
}
