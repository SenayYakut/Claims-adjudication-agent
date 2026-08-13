import type { AdjudicationResult } from "@/lib/types";

/**
 * Demo fixtures — mirror the structured output of agent/adjudication_api.py
 * for the three synthetic cases in data/synthetic_cases.py. These let the
 * desktop demo run without live AWS/Bedrock credentials. Field values track
 * the real prescription data and the engine's documented decision logic.
 */

const CASE_1_APPROVE: AdjudicationResult = {
  caseId: "SYN-PA-001",
  patient: { name: "Robert Chen", id: "SYN-PA-001" },
  drug: "Pembrolizumab (Keytruda)",
  diagnosis: "NSCLC, adenocarcinoma — Stage IV",
  policySource: "fallback",
  urgency: "STANDARD",
  urgencyReason: "Newly diagnosed metastatic disease; stable over 4-week staging workup.",
  verdict: "APPROVE",
  verdictConfidence: 0.97,
  rules: [
    {
      ruleName: "Histologic confirmation",
      satisfied: true,
      confidence: 0.98,
      evidence: "NSCLC adenocarcinoma, ICD-10 C34.10 (histologically confirmed)",
      reason: "Confirmed NSCLC subtype; small cell excluded.",
    },
    {
      ruleName: "Disease stage (IIIB unresectable / IV)",
      satisfied: true,
      confidence: 0.99,
      evidence: "Stage IV (metastatic) — contralateral lung + mediastinal nodes",
      reason: "Stage IV meets the covered-stage requirement.",
    },
    {
      ruleName: "PD-L1 expression (TPS ≥ 1%)",
      satisfied: true,
      confidence: 0.99,
      evidence: "PD-L1 TPS 78% via 22C3 pharmDx (resulted 2025-10-10)",
      reason: "TPS 78% far exceeds the ≥1% first-line monotherapy threshold.",
    },
    {
      ruleName: "EGFR / ALK exclusion",
      satisfied: true,
      confidence: 0.97,
      evidence: "EGFR wild-type (NGS); ALK negative (FISH); ROS1 negative",
      reason: "No sensitizing driver alteration; first-line checkpoint inhibitor is appropriate.",
    },
    {
      ruleName: "ECOG performance status 0–2",
      satisfied: true,
      confidence: 0.98,
      evidence: "ECOG 1 — ambulatory, self-care intact",
      reason: "ECOG 1 is within the covered 0–2 range.",
    },
    {
      ruleName: "Line of therapy",
      satisfied: true,
      confidence: 0.96,
      evidence: "No prior systemic chemotherapy for advanced disease",
      reason: "Treatment-naïve — qualifies for first-line therapy.",
    },
    {
      ruleName: "Organ function labs (within 28 days)",
      satisfied: true,
      confidence: 0.97,
      evidence: "Cr 0.9, bili 0.7, AST 22 / ALT 18, ANC 3200, Hgb 13.1, Plt 220K (2025-10-15)",
      reason: "All organ-function thresholds met within the required window.",
    },
  ],
};

const CASE_2_DENY: AdjudicationResult = {
  caseId: "SYN-PA-002",
  patient: { name: "Maria Alvarez", id: "SYN-PA-002" },
  drug: "Pembrolizumab (Keytruda)",
  diagnosis: "NSCLC, adenocarcinoma — Stage IV (CNS involvement)",
  policySource: "fallback",
  urgency: "EXPEDITE",
  urgencyReason: "Aggressive metastatic disease with active CNS involvement.",
  verdict: "DENY",
  verdictConfidence: 0.99,
  rules: [
    {
      ruleName: "Histologic confirmation",
      satisfied: true,
      confidence: 0.98,
      evidence: "NSCLC adenocarcinoma, ICD-10 C34.32",
      reason: "Confirmed NSCLC subtype.",
    },
    {
      ruleName: "Disease stage (IIIB unresectable / IV)",
      satisfied: true,
      confidence: 0.99,
      evidence: "Stage IV — brain, adrenal, bone metastases",
      reason: "Stage IV meets the covered-stage requirement.",
    },
    {
      ruleName: "PD-L1 expression (TPS ≥ 1%)",
      satisfied: true,
      confidence: 0.95,
      evidence: "PD-L1 TPS 45% via 22C3 pharmDx (resulted 2025-10-05)",
      reason: "TPS 45% exceeds the ≥1% threshold.",
    },
    {
      ruleName: "EGFR / ALK exclusion",
      satisfied: false,
      confidence: 0.99,
      evidence: "EGFR POSITIVE — Exon 19 deletion (L747_P753delinsS) confirmed by NGS",
      reason:
        "Sensitizing EGFR mutation excludes first-line pembrolizumab; standard of care is an EGFR TKI (osimertinib).",
    },
    {
      ruleName: "ECOG performance status 0–2",
      satisfied: true,
      confidence: 0.98,
      evidence: "ECOG 1 — ambulatory, mild post-WBRT fatigue",
      reason: "ECOG 1 is within the covered 0–2 range.",
    },
    {
      ruleName: "Line of therapy",
      satisfied: true,
      confidence: 0.9,
      evidence: "Systemic treatment-naïve (WBRT for brain metastases only)",
      reason: "No prior systemic therapy for advanced disease.",
    },
    {
      ruleName: "Organ function labs (within 28 days)",
      satisfied: true,
      confidence: 0.96,
      evidence: "Cr 0.8, bili 0.5, AST 19 / ALT 22, ANC 2800, Hgb 11.8, Plt 185K (2025-10-12)",
      reason: "All organ-function thresholds met.",
    },
  ],
};

const CASE_3_NEEDS_REVIEW: AdjudicationResult = {
  caseId: "SYN-PA-003",
  patient: { name: "James Whitfield", id: "SYN-PA-003" },
  drug: "Pembrolizumab (Keytruda)",
  diagnosis: "NSCLC — Stage IIIB (locally advanced, unresectable)",
  policySource: "fallback",
  urgency: "EXPEDITE",
  urgencyReason:
    "Rapidly progressing: severe dyspnea, 12 lb weight loss over 6 weeks, post-obstructive pneumonia on IV antibiotics; ECOG 2.",
  verdict: "NEEDS_REVIEW",
  verdictConfidence: 0.35,
  rules: [
    {
      ruleName: "Histologic confirmation",
      satisfied: false,
      confidence: 0.35,
      evidence: "NSCLC — histologic subtype pending final pathology",
      reason: "Subtype not yet finalized; confirmation incomplete.",
    },
    {
      ruleName: "Disease stage (IIIB unresectable / IV)",
      satisfied: true,
      confidence: 0.9,
      evidence: "Stage IIIB (locally advanced, unresectable)",
      reason: "Unresectable Stage IIIB meets the covered-stage requirement.",
    },
    {
      ruleName: "PD-L1 expression (TPS ≥ 1%)",
      satisfied: false,
      confidence: 0.15,
      evidence: "PD-L1 PENDING — sample at reference lab, results in 5–7 business days",
      reason: "Required biomarker not yet resulted; cannot confirm threshold.",
    },
    {
      ruleName: "EGFR / ALK exclusion",
      satisfied: false,
      confidence: 0.1,
      evidence: "EGFR/ALK UNKNOWN — FoundationOne CDx ordered, ALK FISH in progress",
      reason: "Driver status must be known before first-line pembrolizumab; testing incomplete.",
    },
    {
      ruleName: "ECOG performance status 0–2",
      satisfied: true,
      confidence: 0.9,
      evidence: "ECOG 2 — ambulatory >50% of waking hours",
      reason: "ECOG 2 is within the covered 0–2 range.",
    },
    {
      ruleName: "Line of therapy",
      satisfied: true,
      confidence: 0.85,
      evidence: "Newly diagnosed; no prior systemic chemotherapy",
      reason: "Treatment-naïve — qualifies for first-line therapy.",
    },
    {
      ruleName: "Organ function labs (within 28 days)",
      satisfied: true,
      confidence: 0.9,
      evidence: "Cr 1.3 (eGFR 52), bili 0.9, AST 31 / ALT 28, ANC 4100, Hgb 10.2, Plt 310K (2025-10-10)",
      reason: "Organ-function thresholds met within the required window.",
    },
  ],
};

export const CASES: AdjudicationResult[] = [
  CASE_1_APPROVE,
  CASE_2_DENY,
  CASE_3_NEEDS_REVIEW,
];

export function getCase(caseId: string): AdjudicationResult | undefined {
  return CASES.find((c) => c.caseId === caseId);
}
