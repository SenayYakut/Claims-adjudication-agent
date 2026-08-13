"use client";

import { useState } from "react";
import type { RuleEvaluation } from "@/lib/types";
import { isFlagged } from "@/lib/format";
import { ConfidenceBand } from "@/components/ui/ConfidenceBand";
import { Card } from "@/components/ui/Card";

/**
 * The core hierarchy rule of the review surface (spec rules 2, 6, 7): rules
 * that pass cleanly collapse into one quiet disclosure line, while flagged
 * rules (unsatisfied OR low-confidence) stay expanded so the reviewer sees
 * exactly what needs a human. Flagged rules read at level 2 — a colored left
 * bar + soft row tint, no shadow (quieter than the decision panel, louder than
 * everything else). No icons anywhere: colored bars + text pills only.
 */
export function RuleChecklist({ rules }: { rules: RuleEvaluation[] }) {
  const [showPassed, setShowPassed] = useState(false);

  const flagged = rules.filter((r) => isFlagged(r));
  const passed = rules.filter((r) => !isFlagged(r));

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-3">
        Coverage Policy Match
      </h3>

      <ol className="flex flex-col gap-2">
        {flagged.map((rule) => (
          <FlaggedRule key={rule.ruleName} rule={rule} />
        ))}
      </ol>

      {passed.length > 0 && (
        <div className={flagged.length > 0 ? "mt-3" : ""}>
          <button
            type="button"
            onClick={() => setShowPassed((v) => !v)}
            aria-expanded={showPassed}
            className="w-full rounded-sm py-1 text-left text-sm text-ink-2"
          >
            {passed.length} of {rules.length} rules satisfied —{" "}
            {showPassed ? "hide details" : "show details"}
          </button>

          {showPassed && (
            <ul className="mt-1 flex flex-col gap-1">
              {passed.map((rule) => (
                <SatisfiedRule key={rule.ruleName} rule={rule} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Spec rule 7: DENY and NEEDS_REVIEW are not the same kind of "not satisfied."
 * A confident, definitive failure (hard clinical mismatch — the wrong drug for
 * this genotype) reads red with "Does not qualify" copy. A rule stuck at low
 * confidence because data hasn't resulted yet reads amber with provisional
 * "Pending data" copy. Both use a left bar; the distinction is carried in the
 * copy and the color.
 */
function FlaggedRule({ rule }: { rule: RuleEvaluation }) {
  const hardFail = !rule.satisfied && rule.confidence >= 0.7;

  const bar = hardFail ? "bg-danger" : "bg-warn";
  const tint = hardFail ? "bg-danger-soft" : "bg-warn-soft";
  const pillClass = hardFail
    ? "text-danger bg-danger-soft border border-danger/40"
    : "text-warn bg-warn-soft border border-warn/40";
  const pillLabel = hardFail ? "Does not qualify" : "Pending data";

  return (
    <li className={`flex gap-2 rounded-sm ${tint} px-3 py-2`}>
      <span className={`w-[3px] self-stretch rounded-full ${bar}`} aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{rule.ruleName}</span>
          <span
            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${pillClass}`}
          >
            {pillLabel}
          </span>
          <ConfidenceBand confidence={rule.confidence} showLabel={false} />
        </div>

        <div className="text-sm">
          <span className="text-ink-3">Evidence</span>{" "}
          <span className="text-ink">{rule.evidence}</span>
        </div>

        <p className="text-sm text-ink-2">{rule.reason}</p>
      </div>
    </li>
  );
}

/**
 * Quiet satisfied row revealed by the disclosure toggle: a green left bar, the
 * rule name, and the word "Satisfied" in place of a confidence label. Kept
 * deliberately low-key — not celebratory (spec rule 2).
 */
function SatisfiedRule({ rule }: { rule: RuleEvaluation }) {
  return (
    <li className="flex items-center gap-2 rounded-sm px-3 py-1.5">
      <span className="w-[3px] self-stretch rounded-full bg-ok" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
        {rule.ruleName}
      </span>
      <span className="text-xs text-ok">Satisfied</span>
    </li>
  );
}
