import type { Verdict } from "@/lib/types";

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

/** Tailwind class bundles per tone — keeps the color vocabulary controlled. */
export const TONE_CLASSES: Record<
  "ok" | "warn" | "danger" | "brand",
  { text: string; bg: string; border: string; solidText: string; solidBg: string }
> = {
  ok: {
    text: "text-ok",
    bg: "bg-ok-soft",
    border: "border-ok/40",
    solidText: "text-white",
    solidBg: "bg-ok",
  },
  warn: {
    text: "text-warn",
    bg: "bg-warn-soft",
    border: "border-warn/40",
    solidText: "text-white",
    solidBg: "bg-warn",
  },
  danger: {
    text: "text-danger",
    bg: "bg-danger-soft",
    border: "border-danger/40",
    solidText: "text-white",
    solidBg: "bg-danger",
  },
  brand: {
    text: "text-brand-deep",
    bg: "bg-brand-soft",
    border: "border-brand/40",
    solidText: "text-white",
    solidBg: "bg-brand",
  },
};
