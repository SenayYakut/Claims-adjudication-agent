import { confidenceBand, type Band } from "@/lib/format";

const BAND_CLASSES: Record<Band, string> = {
  High: "text-ok bg-ok-soft border-ok/40",
  Med: "text-warn bg-warn-soft border-warn/40",
  Low: "text-warn bg-warn-soft border-warn/40",
};

/**
 * Confidence shown ONLY as a Low/Med/High band — never a raw decimal.
 * Pass a 0–1 number; the component derives the band.
 */
export function ConfidenceBand({
  confidence,
  showLabel = true,
  size = "sm",
}: {
  confidence: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const band = confidenceBand(confidence);
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border font-medium ${pad} ${BAND_CLASSES[band]}`}
    >
      {showLabel && <span className="text-ink-3 font-normal">Confidence</span>}
      {band}
    </span>
  );
}
