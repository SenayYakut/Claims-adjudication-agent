"use client";

import { useEffect, useState } from "react";
import type { AdjudicationResult } from "@/lib/types";
import { CASES, getCase } from "@/lib/fixtures";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReviewQueue } from "@/components/ReviewQueue";
import { CaseHeader } from "@/components/CaseHeader";
import { DecisionPanel } from "@/components/DecisionPanel";
import { RuleChecklist } from "@/components/RuleChecklist";
import { ProcessingSteps } from "@/components/ProcessingSteps";

type Source = "live" | "cached";
type Phase = "processing" | "ready";

export default function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(CASES[0]?.caseId ?? null);
  const [result, setResult] = useState<AdjudicationResult | null>(null);
  const [source, setSource] = useState<Source>("cached");
  const [phase, setPhase] = useState<Phase>("processing");
  const [running, setRunning] = useState(false);
  const [runNonce, setRunNonce] = useState(0);

  // Fetch (live agent, else fixture fallback) whenever the case changes or the
  // agent is re-run. Result is cleared first so the previous case never lingers.
  useEffect(() => {
    if (!selectedId) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setPhase("processing");
    setResult(null);

    fetch(`/api/adjudicate?caseId=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.live && data?.result) {
          setResult(data.result as AdjudicationResult);
          setSource("live");
        } else {
          setResult(getCase(selectedId) ?? null);
          setSource("cached");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setResult(getCase(selectedId) ?? null);
        setSource("cached");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, runNonce]);

  // "Run Agent" — re-run the open case (staged processing animation) and pulse
  // the whole queue. runNonce bump re-triggers the fetch + remounts the steps.
  function handleRunAgent() {
    setRunning(true);
    setRunNonce((n) => n + 1);
    window.setTimeout(() => setRunning(false), 700 + CASES.length * 550 + 400);
  }

  const headerCase = result ?? (selectedId ? getCase(selectedId) : undefined);

  return (
    <AppShell
      breadcrumb={
        selectedId && headerCase ? (
          <div className="flex items-center justify-between gap-3">
            <Breadcrumb caseName={headerCase.patient.name} onBack={() => setSelectedId(null)} />
            <SourcePill source={source} processing={phase === "processing"} />
          </div>
        ) : null
      }
      sidebar={
        <ReviewQueue
          cases={CASES}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRunAgent={handleRunAgent}
          running={running}
        />
      }
    >
      {!selectedId || !headerCase ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Quiet context (level 4) — shown throughout */}
          <CaseHeader result={headerCase} />

          {phase === "processing" ? (
            <ProcessingSteps
              key={`${selectedId}-${runNonce}`}
              onDone={() => setPhase("ready")}
            />
          ) : result ? (
            <>
              <DecisionPanel result={result} />
              <RuleChecklist rules={result.rules} />
            </>
          ) : (
            <div className="rounded-lg border border-edge bg-white py-16 text-center text-ink-2">
              Waiting for the agent…
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function SourcePill({ source, processing }: { source: Source; processing: boolean }) {
  if (processing) {
    return (
      <span className="rounded-sm border border-edge bg-white px-2.5 py-1 text-xs font-medium text-ink-2">
        Running agent…
      </span>
    );
  }
  if (source === "live") {
    return (
      <span className="rounded-sm border border-ok/50 bg-white px-2.5 py-1 text-xs font-medium text-ok">
        Live agent
      </span>
    );
  }
  return (
    <span className="rounded-sm border border-edge bg-white px-2.5 py-1 text-xs font-medium text-ink-2">
      Cached result
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-edge bg-white py-24 text-center">
      <p className="text-ink-2">Select a request from the queue to review.</p>
    </div>
  );
}
