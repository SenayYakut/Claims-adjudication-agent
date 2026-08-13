import type { AdjudicationResult, Verdict } from "@/lib/types";

export type Band = "Low" | "Med" | "High";

/** Convert a raw 0–1 confidence into a band. Never show the raw decimal in UI. */
export function confidenceBand(confidence: number): Band {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Med";
  return "Low";
}

/**
 * A rule stays expanded when it is unsatisfied OR below 0.7 confidence.
 * Satisfied + high-confidence rules collapse into the summary line.
 */
export function isFlagged(rule: { satisfied: boolean; confidence: number }): boolean {
  return !rule.satisfied || rule.confidence < 0.7;
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; tone: "ok" | "warn" | "danger" }
> = {
  APPROVE: { label: "Approve", tone: "ok" },
  DENY: { label: "Deny", tone: "danger" },
  NEEDS_REVIEW: { label: "Needs Review", tone: "warn" },
};

/** The two verdicts a reviewer can override TO, given the current verdict. */
export function otherVerdicts(v: Verdict): Verdict[] {
  return (["APPROVE", "DENY", "NEEDS_REVIEW"] as Verdict[]).filter((x) => x !== v);
}

/**
 * Plain-language "This will:" consequence lines for the Confirm expansion,
 * specific to the verdict (and urgency).
 */
export function confirmConsequences(result: AdjudicationResult): string[] {
  const expedite = result.urgency === "EXPEDITE";
  const base: string[] = [];
  if (result.verdict === "APPROVE") {
    base.push(
      "Authorize the requested drug for this patient",
      "Notify the prescriber's office of the approval",
    );
  } else if (result.verdict === "DENY") {
    base.push(
      "Record the denial against the cited coverage rule",
      "Notify the prescriber's office with the denial reason and covered alternatives",
    );
  } else {
    base.push(
      "Keep the case open pending the missing data",
      "Notify the prescriber's office of the outstanding items",
    );
  }
  base.push("Log this review under the reviewer's name");
  if (expedite) base.push("Keep Expedite handling active on this case");
  return base;
}

/** Tailwind class bundles per tone — keeps the color vocabulary controlled. */
export const TONE_CLASSES: Record<
  "ok" | "warn" | "danger" | "brand",
  {
    text: string;
    bg: string;
    border: string;
    borderStrong: string;
    solidText: string;
    solidBg: string;
  }
> = {
  ok: {
    text: "text-ok",
    bg: "bg-ok-soft",
    border: "border-ok/40",
    borderStrong: "border-ok",
    solidText: "text-white",
    solidBg: "bg-ok",
  },
  warn: {
    text: "text-warn",
    bg: "bg-warn-soft",
    border: "border-warn/40",
    borderStrong: "border-warn",
    solidText: "text-white",
    solidBg: "bg-warn",
  },
  danger: {
    text: "text-danger",
    bg: "bg-danger-soft",
    border: "border-danger/40",
    borderStrong: "border-danger",
    solidText: "text-white",
    solidBg: "bg-danger",
  },
  brand: {
    text: "text-brand-deep",
    bg: "bg-brand-soft",
    border: "border-brand/40",
    borderStrong: "border-brand",
    solidText: "text-white",
    solidBg: "bg-brand",
  },
};
