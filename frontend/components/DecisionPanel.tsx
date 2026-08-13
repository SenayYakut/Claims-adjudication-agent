"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { AdjudicationResult } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { ConfidenceBand } from "@/components/ui/ConfidenceBand";
import { VERDICT_META, TONE_CLASSES } from "@/lib/format";

type ConfirmState = "idle" | "pending" | "confirmed";

/** Drop a trailing period so clauses join cleanly. */
function stripPeriod(s: string): string {
  return s.replace(/\.\s*$/, "").trim();
}

/** Join a list of clauses into readable prose (a, b, and c). */
function joinClauses(clauses: string[]): string {
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return clauses[0];
  if (clauses.length === 2) return `${clauses[0]} and ${clauses[1]}`;
  return `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;
}

/**
 * Synthesize a 1–2 sentence rationale from the rule evaluations.
 * Derived entirely from `result.rules` — no per-case hardcoded copy.
 */
function synthesizeReasoning(result: AdjudicationResult): string {
  const rules = result.rules;
  const total = rules.length;
  const unsatisfied = rules.filter((r) => !r.satisfied);
  const lowConfidence = rules.filter((r) => r.satisfied && r.confidence < 0.5);
  const satisfied = rules.filter((r) => r.satisfied);

  if (result.verdict === "DENY") {
    const reasons = unsatisfied.map((r) => stripPeriod(r.reason)).filter(Boolean);
    if (reasons.length > 0) {
      return `Denied: ${joinClauses(reasons)}.`;
    }
    return "Denied because one or more coverage criteria were not satisfied.";
  }

  if (result.verdict === "NEEDS_REVIEW") {
    const pending = [...unsatisfied, ...lowConfidence];
    const names = pending.map((r) => r.ruleName).filter(Boolean);
    if (names.length > 0) {
      const detail = pending
        .map((r) => stripPeriod(r.reason))
        .filter(Boolean);
      const lead = `Routed for review — ${joinClauses(names)} ${
        names.length === 1 ? "is" : "are"
      } unresolved or low-confidence.`;
      return detail.length > 0
        ? `${lead} ${joinClauses(detail)}.`
        : lead;
    }
    return "Routed for review pending additional data before a final determination.";
  }

  // APPROVE
  const qualifier =
    satisfied.length === total ? `All ${total}` : `${satisfied.length} of ${total}`;
  return `${qualifier} coverage criteria satisfied with sufficient confidence. No unresolved rules block approval.`;
}

export function DecisionPanel({ result }: { result: AdjudicationResult }) {
  const [state, setState] = useState<ConfirmState>("idle");

  const meta = VERDICT_META[result.verdict];
  const tone = meta.tone;
  const toneClasses = TONE_CLASSES[tone];
  const reasoning = synthesizeReasoning(result);

  function handleConfirm() {
    if (state !== "idle") return;
    setState("pending");
    setTimeout(() => setState("confirmed"), 900);
  }

  const isPending = state === "pending";
  const isConfirmed = state === "confirmed";

  return (
    <Card dominant accent={tone} className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
        Agent decision
      </p>

      {/* Verdict — large and unmistakable */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={result.verdict} variant="solid" />
        <span className={`text-2xl font-semibold ${toneClasses.text}`}>
          {meta.label}
        </span>
      </div>

      {/* Overall confidence — band only, never a raw decimal */}
      <div className="mt-4">
        <ConfidenceBand confidence={result.verdictConfidence} size="md" />
      </div>

      {/* Synthesized reasoning */}
      <div className="mt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Agent reasoning
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{reasoning}</p>
      </div>

      {/* Actions — one primary, one lower-weight secondary */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending || isConfirmed}
          className={[
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
            isConfirmed
              ? "bg-ok text-white"
              : "bg-brand text-white",
            isPending || isConfirmed ? "cursor-default opacity-90" : "hover:bg-brand-deep",
          ].join(" ")}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {isConfirmed && <Check className="h-4 w-4" strokeWidth={2} />}
          {isPending
            ? "Confirming…"
            : isConfirmed
            ? "Decision confirmed"
            : "Confirm decision"}
        </button>

        <button
          type="button"
          disabled={isPending || isConfirmed}
          className={[
            "rounded-md border border-edge px-4 py-2 text-sm font-normal text-ink-2",
            isPending || isConfirmed
              ? "cursor-default opacity-50"
              : "hover:bg-canvas",
          ].join(" ")}
        >
          Override
        </button>
      </div>
    </Card>
  );
}
