"use client";

import { useState } from "react";
import { FileSearch } from "lucide-react";
import { CASES, getCase } from "@/lib/fixtures";
import { AppShell } from "@/components/AppShell";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReviewQueue } from "@/components/ReviewQueue";
import { CaseHeader } from "@/components/CaseHeader";
import { DecisionPanel } from "@/components/DecisionPanel";
import { RuleChecklist } from "@/components/RuleChecklist";

export default function Page() {
  const [selectedId, setSelectedId] = useState<string | null>(CASES[0]?.caseId ?? null);
  const selected = selectedId ? getCase(selectedId) : undefined;

  return (
    <AppShell
      breadcrumb={
        selected ? (
          <Breadcrumb caseName={selected.patient.name} onBack={() => setSelectedId(null)} />
        ) : null
      }
      sidebar={
        <ReviewQueue cases={CASES} selectedId={selectedId} onSelect={setSelectedId} />
      }
    >
      {selected ? (
        // Scan order by visual weight: quiet header (context) -> dominant
        // decision panel -> rule checklist (flagged expanded, passed collapsed).
        <div className="flex flex-col gap-6">
          <CaseHeader result={selected} />
          <DecisionPanel result={selected} />
          <RuleChecklist rules={selected.rules} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-edge bg-white py-24 text-center">
          <FileSearch size={28} className="text-ink-3" strokeWidth={1.75} aria-hidden />
          <p className="text-ink-2">Select a request from the queue to review.</p>
        </div>
      )}
    </AppShell>
  );
}
