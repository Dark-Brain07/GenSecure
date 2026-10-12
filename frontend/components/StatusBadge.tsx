"use client";

import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from "lucide-react";

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

  if (norm === "BREACH" || norm === "BREACHED" || norm === "MATERIAL_CHANGE") {
    return (
      <span className="status-badge breached">
        <AlertTriangle size={12} />
        {norm.replaceAll("_", " ")}
      </span>
    );
  }

  if (norm.includes("PENDING") || norm.includes("RETRYABLE")) {
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
