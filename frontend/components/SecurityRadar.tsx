"use client";

import { Shield, Eye, Scale, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SecurityRadar() {
  return (
    <section className="radar-section">
      <div className="section-head">
        <span className="mono-tag">TWO-GATE VERIFICATION · ZERO OPERATOR DISCRETION</span>
        <h2>How GenSecure Guarantees Public Promises</h2>
        <p>
          Deterministic smart contracts cannot read the live web or judge natural-language policy shifts.
          GenSecure splits covenant verification into two independent consensus gates.
        </p>
      </div>

      <div className="pipeline-grid">
        <div className="pipeline-node">
          <span className="pipeline-node-num">GATE 01</span>
          <div className="pipeline-node-icon">
            <Shield size={22} />
          </div>
          <h3>GenSecureRegistry</h3>
          <p>
            Locks owner GEN stake behind an exact promise and one immutable canonical HTTPS URL.
            Enforces timeouts, challenge bonds, and conservation accounting.
          </p>
        </div>

        <div className="pipeline-node">
          <span className="pipeline-node-num">GATE 02</span>
          <div className="pipeline-node-icon">
            <Eye size={22} />
          </div>
          <h3>GenSecureInspector</h3>
          <p>
            When challenged, GenLayer validators re-fetch that exact URL to evaluate if the wording has
            materially changed relative to the certified baseline.
          </p>
        </div>

        <div className="pipeline-node">
          <span className="pipeline-node-num">GATE 03</span>
          <div className="pipeline-node-icon">
            <Scale size={22} />
          </div>
          <h3>GenSecureJudge</h3>
          <p>
            If a material change is verified, an independent adjudication stage checks if the operative
            terms violate the immutable breach rule, triggering automated payout.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "36px" }}>
        <Link href="/protocol" className="btn-secondary">
          Explore Protocol Specification <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
