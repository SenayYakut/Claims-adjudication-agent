import type { Urgency } from "@/lib/types";

/**
 * EXPEDITE renders as a noticeable amber chip (urgency changes handling speed).
 * STANDARD renders quietly, or not at all when `hideStandard` is set.
 * Text + color only — no icons.
 */
export function UrgencyBadge({
  urgency,
  hideStandard = false,
}: {
  urgency: Urgency;
  hideStandard?: boolean;
}) {
  if (urgency === "STANDARD") {
    if (hideStandard) return null;
    return (
      <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium text-ink-2 bg-canvas border border-edge">
        Standard
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium text-warn bg-warn-soft border border-warn/40">
      Expedite
    </span>
  );
}
