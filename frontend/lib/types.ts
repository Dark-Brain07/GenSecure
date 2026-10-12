export type BaselineReview = {
  status?: "BASELINE_VERIFIED" | "PROMISE_NOT_SUPPORTED" | "SOURCE_UNAVAILABLE" | "AMBIGUOUS" | string;
  source_accessible?: boolean;
  same_subject?: boolean;
  protected_promise_supported?: boolean;
  rule_testable?: boolean;
  time_scope_valid?: boolean;
  baseline_compliant?: boolean;
  breach_condition_present?: boolean;
  basis?: string;
  recorded_at?: string;
  provenance?: string;
  [key: string]: unknown;
};

export type InspectionReview = {
  status?: "NO_RELEVANT_CHANGE" | "MATERIAL_CHANGE" | "SOURCE_UNAVAILABLE" | "AMBIGUOUS" | string;
  source_accessible?: boolean;
  same_subject?: boolean;
  promise_still_supported?: boolean;
  current_compliant?: boolean;
  breach_condition_now_supported?: boolean;
  effective_now?: boolean;
  basis?: string;
  recorded_at?: string;
  provenance?: string;
  baseline_context?: Record<string, unknown>;
  [key: string]: unknown;
};

export type JudgmentReview = {
  outcome?: "BREACH" | "PERMITTED_CHANGE" | "INCONCLUSIVE" | string;
  breach_supported?: boolean;
  permitted_by_rule?: boolean;
  same_subject?: boolean;
  effective_now?: boolean;
  basis?: string;
  recorded_at?: string;
  provenance?: string;
  [key: string]: unknown;
};

export type Covenant = {
  id: string;
  title: string;
  subject: string;
  canonical_url: string;
  protected_promise: string;
  breach_rule?: string;
  permitted_changes?: string;
  owner: string;
  beneficiary: string;
  finder_reward_bps: string;
  stake_atto: string;
  remaining_stake_atto: string;
  challenge_bond_atto: string;
  status: "BASELINE_PENDING" | "BASELINE_RETRYABLE" | "BASELINE_REJECTED" | "ACTIVE" | "BREACHED" | "EXPIRED_UNBREACHED" | "EXPIRED_UNVERIFIED" | string;
  created_at: string;
  activated_at: string;
  expires_at: string;
  baseline_deadline?: string;
  baseline_attempt?: number;
  baseline_review?: BaselineReview | null;
  pending_challenge?: string;
  challenge_count: number | string;
  last_challenge_at?: string;
  last_inspection?: InspectionReview | null;
  breach_challenge?: string;
  breached_at?: string;
  closed_at?: string;
  can_challenge?: boolean;
  can_expire?: boolean;
  can_expire_baseline?: boolean;
};

export type Challenge = {
  id: string;
  covenant_id: string;
  challenger: string;
  status: "INSPECTION_PENDING" | "JUDGMENT_PENDING" | "NO_RELEVANT_CHANGE" | "MATERIAL_CHANGE" | "SOURCE_UNAVAILABLE" | "AMBIGUOUS" | "PERMITTED_CHANGE" | "INCONCLUSIVE" | "BREACH" | "TIMED_OUT" | "STALE" | "PROTOCOL_BLOCKED" | string;
  bond_atto: string;
  bond_released?: boolean;
  bond_recipient?: string;
  created_at: string;
  stage_deadline: string;
  inspection?: InspectionReview | null;
  judgment?: JudgmentReview | null;
  settled_at?: string;
  finder_reward_atto?: string;
  can_expire?: boolean;
};

export type ProtocolStats = {
  product: string;
  version: string;
  network: string;
  chain_id: string;
  rpc: string;
  inspector: string;
  judge: string;
  components_configured: boolean;
  admin_controls: boolean;
  protocol_fee_bps: string;
  max_challenges_per_covenant: string;
  total_covenants: string;
  total_challenges: string;
  covenants_activated: string;
  covenants_breached: string;
  covenants_expired: string;
  total_deposited_atto: string;
  stake_escrow_atto: string;
  bond_escrow_atto: string;
  claimable_atto: string;
  withdrawn_atto: string;
  accounting_balanced: boolean;
};
