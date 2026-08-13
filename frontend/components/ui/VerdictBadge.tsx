import type { Verdict } from "@/lib/types";
import { VERDICT_META, TONE_CLASSES } from "@/lib/format";

/**
 * Outline pill — white background, colored stroke + colored text (no fill).
 * `variant="solid"` reads slightly heavier via a full-opacity border, but stays
 * unfilled.
 */
export function VerdictBadge({
  verdict,
  variant = "soft",
}: {
  verdict: Verdict;
  variant?: "soft" | "solid";
}) {
  const meta = VERDICT_META[verdict];
  const tone = TONE_CLASSES[meta.tone];
  const border = variant === "solid" ? tone.borderStrong : tone.border;

  return (
    <span
      className={`inline-flex items-center rounded-sm border bg-white px-3 py-1 text-sm font-medium ${border} ${tone.text}`}
    >
      {meta.label}
    </span>
  );
}
