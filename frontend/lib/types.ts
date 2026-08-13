/**
 * Shared contract between the Python adjudication engine and the reviewer UI.
 * Confirmed against agent/adjudication_api.py (the JSON wrapper).
 */

export type Verdict = "APPROVE" | "DENY" | "NEEDS_REVIEW";
export type Urgency = "EXPEDITE" | "STANDARD";
export type PolicySource = "live" | "fallback";

export interface RuleEvaluation {
  ruleName: string;
  satisfied: boolean;
  confidence: number; // 0–1
  evidence: string; // the exact patient value used
  reason: string; // one-line explanation
}

export interface AdjudicationResult {
  caseId: string;
  patient: { name: string; id: string };
  drug: string; // e.g. "Pembrolizumab"
  diagnosis: string; // e.g. "NSCLC, Stage IV"
  policySource: PolicySource;
  urgency: Urgency;
  urgencyReason?: string;
  rules: RuleEvaluation[]; // 7 entries
  verdict: Verdict;
  verdictConfidence: number; // 0–1, overall
}
