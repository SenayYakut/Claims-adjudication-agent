# Meridian — Payer Reviewer Dashboard (frontend)

The reviewer-facing UI for the Claims Adjudication engine. A payer reviewer works
a queue of prior-authorization requests, sees the agent's rule-by-rule reasoning,
and confirms or overrides the drafted decision.

> This is the **payer reviewer** surface — not a clinician readiness meter. The
> agent produces a rule-by-rule verdict (`APPROVE` / `DENY` / `NEEDS_REVIEW`);
> the reviewer confirms it.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with Meridian design tokens (`tailwind.config.ts`, `app/globals.css`)
- `lucide-react` icons (no emoji anywhere)
- Poppins (400 / 500 / 600 only — never bold)

## Run

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
```

## Data

The three demo cases render from typed fixtures in `lib/fixtures.ts`, which mirror
the structured output of the Python wrapper `agent/adjudication_api.py` for the
synthetic cases in `data/synthetic_cases.py`:

| Case | Verdict | Urgency | Why |
|---|---|---|---|
| Robert Chen (SYN-PA-001) | APPROVE | Standard | All 7 rules satisfied, high confidence |
| Maria Alvarez (SYN-PA-002) | DENY | Expedite | EGFR exon-19 mutation → wrong drug first-line |
| James Whitfield (SYN-PA-003) | NEEDS REVIEW | Expedite | Biomarker data pending; rapid progression |

Switching cases in the queue drives every downstream panel from the same typed
contract (`lib/types.ts`), proving the UI reflects the engine's reasoning rather
than hardcoded screens. To wire live data, swap the fixture read for a call to
`agent/adjudication_api.adjudicate_structured()` (requires AWS/Bedrock creds).

## Structure

```
app/
  layout.tsx           Poppins + tokens
  page.tsx             composition + case-selection state
  globals.css          design tokens (:root)
lib/
  types.ts             AdjudicationResult / RuleEvaluation contract
  format.ts            confidence bands, flag rule, verdict/tone maps
  fixtures.ts          the 3 demo cases
components/
  ui/                  Card, VerdictBadge, UrgencyBadge, ConfidenceBand
  AppShell, TopNav, Breadcrumb, ReviewQueue      (shell + queue)
  CaseHeader, RuleChecklist                       (case review)
  DecisionPanel                                   (decision + actions)
```

## Design rules enforced

- One dominant element per screen: the **decision panel** (only element with a shadow).
- Satisfied rules collapse to a summary line; unsatisfied / low-confidence rules stay expanded.
- Confidence shown as **Low / Med / High** bands, never a raw decimal.
- Color vocabulary: green = satisfied/approve, amber = needs-review/low-confidence/expedite,
  red = denied/unsatisfied, blue = brand/action. Nothing else gets color.
- `policySource: 'fallback'` shows an honest note that live lookup was unavailable.
