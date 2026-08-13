"use client";

import { ChevronLeft } from "lucide-react";

/**
 * Quiet sub-nav under the top bar on the request-detail screen. Lets the
 * reviewer get back to the queue they arrived from without the browser back
 * button. Small and low-contrast — it orients, it doesn't compete.
 */
export function Breadcrumb({
  caseName,
  onBack,
}: {
  caseName: string;
  onBack: () => void;
}) {
  return (
    <nav className="flex items-center gap-1 text-sm text-ink-2" aria-label="Breadcrumb">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-0.5 rounded-sm font-medium text-brand-deep hover:text-brand"
      >
        <ChevronLeft size={16} strokeWidth={2} aria-hidden />
        Queue
      </button>
      <span className="text-ink-3">/</span>
      <span className="text-ink-2">{caseName}</span>
    </nav>
  );
}
