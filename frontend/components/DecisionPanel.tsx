"use client";

import { useState } from "react";
import type { AdjudicationResult, Verdict } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { ConfidenceBand } from "@/components/ui/ConfidenceBand";
import {
  VERDICT_META,
  TONE_CLASSES,
  confirmConsequences,
  otherVerdicts,
} from "@/lib/format";

type Mode = "idle" | "confirm" | "override" | "confirmed" | "overridden";

const REVIEWER = "Dr. R. Jain (RJ)";

/** What happens next once a verdict is confirmed, per verdict. */
const NEXT_PHRASE: Record<Verdict, string> = {
  APPROVE: "authorization issued",
  DENY: "prescriber notified",
  NEEDS_REVIEW: "case held pending data",
};

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
      const detail = pending.map((r) => stripPeriod(r.reason)).filter(Boolean);
      const lead = `Routed for review — ${joinClauses(names)} ${
        names.length === 1 ? "is" : "are"
      } unresolved or low-confidence.`;
      return detail.length > 0 ? `${lead} ${joinClauses(detail)}.` : lead;
    }
    return "Routed for review pending additional data before a final determination.";
  }

  // APPROVE
  const qualifier =
    satisfied.length === total ? `All ${total}` : `${satisfied.length} of ${total}`;
  return `${qualifier} coverage criteria satisfied with sufficient confidence. No unresolved rules block approval.`;
}

export function DecisionPanel({ result }: { result: AdjudicationResult }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict | null>(null);
  const [reason, setReason] = useState("");
  const [decidedAt, setDecidedAt] = useState("");

  const meta = VERDICT_META[result.verdict];
  const tone = meta.tone;
  const toneClasses = TONE_CLASSES[tone];
  const reasoning = synthesizeReasoning(result);

  function stamp() {
    setDecidedAt(new Date().toLocaleString());
  }

  function resetToIdle() {
    setMode("idle");
  }

  function handleConfirmSave() {
    stamp();
    setMode("confirmed");
  }

  function handleSubmitOverride() {
    if (!overrideVerdict || reason.trim() === "") return;
    stamp();
    setMode("overridden");
  }

  const consequences = confirmConsequences(result);
  const otherOptions = otherVerdicts(result.verdict);
  const overrideReady = overrideVerdict !== null && reason.trim() !== "";

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

      {/* Action area — one expansion at a time, verdict stays visible above */}
      <div className="mt-6">
        {mode === "idle" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode("confirm")}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
            >
              Confirm decision
            </button>
            <button
              type="button"
              onClick={() => {
                setOverrideVerdict(null);
                setReason("");
                setMode("override");
              }}
              className="rounded-md border border-edge px-4 py-2 text-sm text-ink-2 hover:bg-canvas"
            >
              Override
            </button>
          </div>
        )}

        {mode === "confirm" && (
          <div className="animate-fade-in">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
              This will:
            </p>
            <ul className="mt-2 space-y-1.5">
              {consequences.map((line) => (
                <li key={line} className="text-sm leading-relaxed text-ink-2">
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                onClick={handleConfirmSave}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-deep"
              >
                Confirm &amp; save
              </button>
              <button
                type="button"
                onClick={resetToIdle}
                className="text-sm text-ink-3 hover:text-ink-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === "override" && (
          <div className="animate-fade-in">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
              Override to:
            </p>
            <div className="mt-3 space-y-2">
              {otherOptions.map((v) => (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-2 text-sm text-ink-2"
                >
                  <input
                    type="radio"
                    name="override-verdict"
                    value={v}
                    checked={overrideVerdict === v}
                    onChange={() => setOverrideVerdict(v)}
                    className="accent-brand"
                  />
                  {VERDICT_META[v].label}
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label
                htmlFor="override-reason"
                className="text-xs font-medium uppercase tracking-wide text-ink-3"
              >
                Reason — logged with the case
              </label>
              <textarea
                id="override-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-md border border-edge bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                onClick={handleSubmitOverride}
                disabled={!overrideReady}
                className={[
                  "rounded-md px-4 py-2 text-sm font-medium",
                  overrideReady
                    ? "bg-brand text-white hover:bg-brand-deep"
                    : "cursor-not-allowed bg-brand-soft text-ink-3",
                ].join(" ")}
              >
                Submit override
              </button>
              <button
                type="button"
                onClick={resetToIdle}
                className="text-sm text-ink-3 hover:text-ink-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === "confirmed" && (
          <p className="animate-fade-in text-sm leading-relaxed text-ink-2">
            {meta.label} confirmed — Reviewed by {REVIEWER} · {decidedAt} ·{" "}
            {NEXT_PHRASE[result.verdict]}
          </p>
        )}

        {mode === "overridden" && overrideVerdict && (
          <p className="animate-fade-in text-sm leading-relaxed text-ink-2">
            {VERDICT_META[overrideVerdict].label} — overridden by {REVIEWER} ·{" "}
            {decidedAt}. Reason: {reason.trim()}
          </p>
        )}
      </div>
    </Card>
  );
}
