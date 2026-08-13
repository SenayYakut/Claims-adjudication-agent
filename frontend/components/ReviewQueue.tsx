"use client";

import { useEffect, useState } from "react";
import type { AdjudicationResult } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";

/**
 * The left-column case picker. A vertical list of adjudication results as
 * compact rows (not tall cards): initials avatar, patient name + drug on one
 * line, a status pill on the right, and an Expedite tag underneath if urgent.
 * Selected row gets a brand glow ring, not a filled background. No shadow —
 * that belongs to the decision panel. No icons.
 *
 * "Run Agent" (header, right) drives a staggered run animation: every row's
 * pill flips to "Running…" at once, then reverts to its real verdict badge at
 * a staggered per-row delay so it never feels instant or perfectly in sync.
 */

/** "Robert Chen" -> "RC" (first letter of the first two name words). */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewQueue({
  cases,
  selectedId,
  onSelect,
  onRunAgent,
  running,
}: {
  cases: AdjudicationResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRunAgent: () => void;
  running: boolean;
}) {
  const [runningRows, setRunningRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!running) return;
    // Every row flips to "Running…" immediately...
    setRunningRows(new Set(cases.map((c) => c.caseId)));
    // ...then reverts to its real verdict at a staggered delay per row.
    const timers = cases.map((c, i) =>
      setTimeout(() => {
        setRunningRows((prev) => {
          const next = new Set(prev);
          next.delete(c.caseId);
          return next;
        });
      }, 700 + i * 550),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Review Queue
        </h2>
        <button
          type="button"
          onClick={onRunAgent}
          disabled={running}
          className="rounded-sm bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-deep disabled:opacity-60"
        >
          Run Agent
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {cases.map((c) => {
          const selected = c.caseId === selectedId;
          const rowRunning = runningRows.has(c.caseId);
          return (
            <li key={c.caseId}>
              <button
                type="button"
                onClick={() => onSelect(c.caseId)}
                aria-current={selected ? "true" : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border border-brand bg-white ring-[3px] ring-brand-soft"
                    : "border border-edge bg-white hover:border-brand/30"
                }`}
              >
                <span
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-brand-deep"
                  aria-hidden
                >
                  {initials(c.patient.name)}
                </span>

                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate font-semibold text-ink">
                    {c.patient.name}
                  </span>
                  <span className="truncate text-sm text-ink-2">{c.drug}</span>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  {rowRunning ? (
                    <span className="inline-flex items-center rounded-sm bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
                      Running…
                    </span>
                  ) : (
                    <VerdictBadge verdict={c.verdict} />
                  )}
                  {c.urgency === "EXPEDITE" ? (
                    <span className="text-xs text-warn">Expedite</span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
