import type { AdjudicationResult } from "@/lib/types";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";

/**
 * QUIET CONTEXT (level 4). Small, top, low weight — no shadow, no card border
 * emphasis. Identifies the case so the reviewer knows who and what they're
 * looking at, then gets out of the way. The one noticeable element is the amber
 * EXPEDITE badge, since urgency changes how the case is handled. No icons.
 */
export function CaseHeader({ result }: { result: AdjudicationResult }) {
  const isExpedite = result.urgency === "EXPEDITE";
  const isFallback = result.policySource === "fallback";

  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-medium text-ink">{result.patient.name}</span>
        <span className="text-xs text-ink-3">{result.patient.id}</span>
        {isExpedite && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <UrgencyBadge urgency={result.urgency} />
            {result.urgencyReason && (
              <span className="text-xs text-ink-2">{result.urgencyReason}</span>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 text-sm text-ink-2">
        <span>{result.drug}</span>
        <span className="text-ink-3">·</span>
        <span>{result.diagnosis}</span>
      </div>

      {isFallback && (
        <span className="self-start rounded-sm border border-edge bg-canvas px-2.5 py-1 text-xs text-ink-2">
          Live policy lookup unavailable — running on cached coverage criteria.
        </span>
      )}
    </header>
  );
}
