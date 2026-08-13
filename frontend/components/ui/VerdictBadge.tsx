import type { Verdict } from "@/lib/types";
import { VERDICT_META, TONE_CLASSES } from "@/lib/format";

/** Soft (default) for headers/queue rows; solid for the dominant decision panel. */
export function VerdictBadge({
  verdict,
  variant = "soft",
}: {
  verdict: Verdict;
  variant?: "soft" | "solid";
}) {
  const meta = VERDICT_META[verdict];
  const tone = TONE_CLASSES[meta.tone];
  const cls =
    variant === "solid"
      ? `${tone.solidBg} ${tone.solidText}`
      : `${tone.bg} ${tone.text}`;

  return (
    <span
      className={`inline-flex items-center rounded-sm px-3 py-1 text-sm font-medium ${cls}`}
    >
      {meta.label}
    </span>
  );
}
