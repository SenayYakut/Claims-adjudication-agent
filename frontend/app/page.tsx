"use client";

import { useEffect, useState } from "react";
import { FileSearch, Loader2 } from "lucide-react";
import type { AdjudicationResult } from "@/lib/types";
import { CASES, getCase } from "@/lib/fixtures";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReviewQueue } from "@/components/ReviewQueue";
import { CaseHeader } from "@/components/CaseHeader";
import { DecisionPanel } from "@/components/DecisionPanel";
import { RuleChecklist } from "@/components/RuleChecklist";

type Source = "live" | "cached";

export default function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(CASES[0]?.caseId ?? null);
  const [result, setResult] = useState<AdjudicationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<Source>("cached");

  useEffect(() => {
    if (!selectedId) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const headerCase = result ?? (selectedId ? getCase(selectedId) : undefined);

  return (
    <AppShell
      breadcrumb={
        selectedId && headerCase ? (
          <div className="flex items-center justify-between gap-3">
            <Breadcrumb caseName={headerCase.patient.name} onBack={() => setSelectedId(null)} />
            <SourcePill source={source} loading={loading} />
          </div>
        ) : null
      }
      sidebar={
        <ReviewQueue cases={CASES} selectedId={selectedId} onSelect={setSelectedId} />
      }
    >
      {!selectedId ? (
        <EmptyState />
      ) : loading || !result ? (
        <RunningState />
      ) : (
        // Scan order by visual weight: quiet header -> dominant decision panel -> checklist.
        <div className="flex flex-col gap-6">
          <CaseHeader result={result} />
          <DecisionPanel result={result} />
          <RuleChecklist rules={result.rules} />
        </div>
      )}
    </AppShell>
  );
}

function SourcePill({ source, loading }: { source: Source; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-white px-2.5 py-1 text-xs font-medium text-ink-2">
        <Loader2 size={12} strokeWidth={2} className="animate-spin" aria-hidden />
        Running agent…
      </span>
    );
  }
  if (source === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-ok/40 bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
        Live agent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-edge bg-white px-2.5 py-1 text-xs font-medium text-ink-2">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-3" aria-hidden />
      Cached result
    </span>
  );
}

function RunningState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-edge bg-white py-24 text-center">
      <Loader2 size={28} strokeWidth={2} className="animate-spin text-brand" aria-hidden />
      <p className="text-ink-2">Running adjudication…</p>
      <p className="text-xs text-ink-3">Evaluating coverage rules against the prescription.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-edge bg-white py-24 text-center">
      <FileSearch size={28} className="text-ink-3" strokeWidth={1.75} aria-hidden />
      <p className="text-ink-2">Select a request from the queue to review.</p>
    </div>
  );
}
