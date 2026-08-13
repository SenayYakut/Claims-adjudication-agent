"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronRight, X } from "lucide-react";
import type { RuleEvaluation } from "@/lib/types";
import { isFlagged } from "@/lib/format";
import { ConfidenceBand } from "@/components/ui/ConfidenceBand";
import { Card } from "@/components/ui/Card";

/**
 * The core hierarchy rule of the review surface: rules that pass cleanly
 * collapse into one quiet line, while flagged rules (unsatisfied OR
 * low-confidence) stay expanded so the reviewer sees exactly what needs a
 * human. Flagged rules read at level 2 (left-border accent + soft tint, no
 * shadow — quieter than the decision panel, louder than everything else).
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
            className="flex w-full items-center gap-2 rounded-sm py-1 text-left text-sm text-ink-2"
          >
            <Check size={15} strokeWidth={2} className="text-ok" aria-hidden />
            <span>
              {passed.length} of {rules.length} rules satisfied
            </span>
            <ChevronRight
              size={14}
              strokeWidth={2}
              aria-hidden
              className={`ml-auto text-ink-3 transition-transform ${
                showPassed ? "rotate-90" : ""
              }`}
            />
          </button>

          {showPassed && (
            <ul className="mt-1 flex flex-col gap-0.5 pl-1">
              {passed.map((rule) => (
                <li
                  key={rule.ruleName}
                  className="flex items-center gap-2 py-0.5 text-sm text-ink-2"
                >
                  <Check
                    size={13}
                    strokeWidth={2}
                    className="text-ok"
                    aria-hidden
                  />
                  <span>{rule.ruleName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

function FlaggedRule({ rule }: { rule: RuleEvaluation }) {
  // Red is reserved for a confident denial (a real, high-confidence failure).
  // Low-confidence / pending rules read amber ("needs review"), not red ("denied").
  const hardFail = !rule.satisfied && rule.confidence >= 0.7;
  const accent = hardFail
    ? "border-l-danger bg-danger-soft"
    : "border-l-warn bg-warn-soft";

  return (
    <li className={`rounded-sm border-l-2 ${accent} px-3 py-2`}>
      <div className="flex items-start gap-2">
        {hardFail ? (
          <X
            size={15}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-danger"
            aria-hidden
          />
        ) : (
          <AlertTriangle
            size={15}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-warn"
            aria-hidden
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{rule.ruleName}</span>
            <ConfidenceBand confidence={rule.confidence} showLabel={false} />
          </div>

          <div className="text-sm">
            <span className="text-ink-3">Evidence</span>{" "}
            <span className="text-ink">{rule.evidence}</span>
          </div>

          <p className="text-sm text-ink-2">{rule.reason}</p>
        </div>
      </div>
    </li>
  );
}
