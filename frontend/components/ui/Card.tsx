import type { ReactNode } from "react";

/**
 * Shared surface primitive. `dominant` grants the single per-screen shadow +
 * saturated border; every other card recedes (flat, hairline border).
 */
export function Card({
  children,
  dominant = false,
  accent,
  className = "",
}: {
  children: ReactNode;
  dominant?: boolean;
  accent?: "ok" | "warn" | "danger" | "brand";
  className?: string;
}) {
  const accentBorder =
    accent === "ok"
      ? "border-ok/50"
      : accent === "warn"
      ? "border-warn/50"
      : accent === "danger"
      ? "border-danger/50"
      : accent === "brand"
      ? "border-brand/50"
      : "border-edge";

  return (
    <section
      className={[
        "rounded-lg bg-white",
        "border",
        dominant ? `${accentBorder} shadow-panel` : "border-edge",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
