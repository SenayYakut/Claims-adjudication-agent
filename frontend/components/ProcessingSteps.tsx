"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

const STEPS = [
  "Fetching coverage policy…",
  "Evaluating 7 policy rules…",
  "Assessing clinical urgency…",
  "Finalizing decision…",
] as const;

const STEP_MS = 650;

/**
 * The four rows map to the four real tool calls. Steps activate sequentially
 * on timers; the active row shows a three-dot pulse, completed rows read
 * "— done", and after the last step completes we call onDone().
 */
export function ProcessingSteps({ onDone }: { onDone: () => void }) {
  // 0..3 while stepping; STEPS.length once every step has completed.
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Advance the active row, then advance again past the last to signal done.
    for (let i = 1; i <= STEPS.length; i += 1) {
      timers.push(
        setTimeout(() => {
          setActiveIndex(i);
          if (i === STEPS.length) onDone();
        }, STEP_MS * i),
      );
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
        Processing
      </p>

      {/* 4-segment progress bar — each segment fills as its step activates */}
      <div className="mt-4 flex gap-1.5">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={[
              "h-1.5 flex-1 rounded-full",
              i < activeIndex + 1 ? "bg-brand" : "bg-edge",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Step rows — revealed as they activate, sliding up + fading in */}
      <div className="mt-5 space-y-3">
        {STEPS.map((label, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          const isPending = i > activeIndex;

          if (isPending) return null;

          return (
            <div
              key={label}
              className="flex animate-step-in items-center gap-3 text-sm"
            >
              <span className={isDone ? "text-ink-2" : "text-ink"}>{label}</span>

              {isActive && (
                <span className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 rounded-full bg-brand animate-dot-pulse"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              )}

              {isDone && (
                <span className="font-medium text-ok">— done</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
