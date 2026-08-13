"use client";

import type { AdjudicationResult } from "@/lib/types";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";

/**
 * The left-column case picker. A vertical list of adjudication results; each
 * row shows the patient, drug, verdict and (when expedited) urgency. Selected
 * row is tinted brand-soft; the rest are white with a hairline border. No
 * shadow — that belongs to the decision panel.
 */
export function ReviewQueue({
  cases,
  selectedId,
  onSelect,
}: {
  cases: AdjudicationResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-ink-3">
        Review Queue
      </h2>
      <ul className="flex flex-col gap-2">
        {cases.map((c) => {
          const selected = c.caseId === selectedId;
          return (
            <li key={c.caseId}>
              <button
                type="button"
                onClick={() => onSelect(c.caseId)}
                aria-current={selected ? "true" : undefined}
                className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-brand/40 bg-brand-soft"
                    : "border-edge bg-white hover:border-brand/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.patient.name}</p>
                    <p className="truncate text-sm text-ink-2">{c.drug}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <VerdictBadge verdict={c.verdict} />
                    <UrgencyBadge urgency={c.urgency} hideStandard />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
