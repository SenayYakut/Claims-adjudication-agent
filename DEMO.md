# Claims Adjudication Simulator
## Biopharma Hack Day @ AWS — Problem Statement #4

---

## The Problem

Prior authorization (PA) is the process where an insurance company must approve a drug before a patient can receive it.

For oncology drugs today:

- ⏱ **3–14 days** average review time — manual, fax-based, opaque
- 🧑‍💼 A human reviewer reads a policy document + prescription from scratch every time
- ❌ Denials come with no explanation — doctor has to guess why and appeal
- 🚨 No urgency triage — a Stage IV rapidly progressing patient waits the same as a stable case
- ❓ When biomarker results are pending, reviewers guess instead of flagging incomplete data

**For a patient with late-stage cancer, a 10-day wait is not administrative friction — it is clinical harm.**

---

## How We Solve It

An AI agent that sits on the **payer side** and reviews each prior authorization request in under 60 seconds — transparently, rule by rule, with full auditability.

Instead of a black-box yes/no, every decision comes with:

- Which rules passed and which failed
- A confidence score (0–1) on each rule
- The exact patient data point that drove the decision
- A clinical urgency flag (EXPEDITE / STANDARD)

If data is missing — a biomarker result still pending, a lab value not yet reported — the agent marks that rule **low confidence** and escalates to **NEEDS REVIEW** instead of guessing.

---

## Architecture

```
                        ┌─────────────────────────┐
                        │     Payer PA Portal      │
                        │  (prescription intake)   │
                        └────────────┬────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   Claims Adjudication   │
                        │        Agent            │
                        │  (Strands + Bedrock)    │
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
   ┌─────────────────┐   ┌─────────────────────┐  ┌──────────────────┐
   │ fetch_coverage  │   │ record_rule_        │  │ assess_clinical  │
   │ _policy()       │   │ evaluation()        │  │ _urgency()       │
   │                 │   │ × 7 rules           │  │                  │
   │ Bright Data     │   │ one call per rule   │  │ EXPEDITE vs      │
   │ Web Unlocker    │   │                     │  │ STANDARD         │
   │ → live policy   │   │ satisfied: bool     │  │                  │
   │ → fallback if   │   │ confidence: 0–1     │  └──────────────────┘
   │   fetch fails   │   │ evidence: str       │
   └─────────────────┘   │ reasoning: str      │
                         └─────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │  finalize_adjudication() │
                        │                         │
                        │  confidence < 0.5  →    │
                        │    NEEDS REVIEW          │
                        │  rule failed ≥ 0.7 →    │
                        │    DENY                  │
                        │  all passed ≥ 0.7  →    │
                        │    APPROVE               │
                        └─────────────────────────┘
```

**Stack**
- Strands Agents SDK — agent orchestration and tool calling
- Amazon Bedrock (Claude Sonnet 4.6) — clinical reasoning
- Bright Data Web Unlocker — live payer policy fetch
- Flask — browser demo UI

---

## How It Works

**Step 1 — Prescription comes in**

A structured record with patient demographics, diagnosis, biomarker results, lab values, and the requested drug and dose.

**Step 2 — Agent fetches the coverage policy**

Uses Bright Data's Web Unlocker to pull the live coverage policy from a public payer website (e.g. Aetna). Falls back to a hardcoded reference policy if the fetch fails. The full policy text goes directly into Claude's context — no RAG, no chunking, no retrieval errors.

**Step 3 — Agent evaluates each rule one at a time**

For each of the 7 coverage rules, the agent makes one tool call and records:

| Field | Example |
|---|---|
| Rule | PD-L1 Expression (TPS ≥ 1%) |
| Satisfied | ✅ Yes |
| Confidence | 0.99 |
| Evidence | TPS = 78% via 22C3 pharmDx, resulted 2025-10-10 |
| Reasoning | TPS of 78% far exceeds the ≥1% threshold for first-line monotherapy |

If data is missing (e.g. "EGFR status: pending"), confidence drops below 0.5 → triggers NEEDS REVIEW.

**Step 4 — Agent assesses clinical urgency**

Separate from the coverage decision. Applies clinical criteria:
- Stage IV → EXPEDITE
- Rapid disease progression → EXPEDITE
- ECOG ≥ 2 → EXPEDITE
- Acute symptoms (dyspnea, weight loss, obstruction) → EXPEDITE

**Step 5 — Final decision**

| Outcome | Condition |
|---|---|
| ✅ APPROVE | All 7 rules satisfied, confidence ≥ 70% |
| ❌ DENY | Any rule violated, confidence ≥ 70% |
| ⚠️ NEEDS REVIEW | Any rule has confidence < 50% (data missing) |

---

## The Three Demo Cases

### Case 1 — APPROVE
**Patient:** SYN-PA-001 · Male, 65 · Stage IV NSCLC · PD-L1 78% · EGFR wild-type · ECOG 1 · Treatment-naïve

All 7 rules satisfied with HIGH confidence (96–99%). Agent approved in 45 seconds.

---

### Case 2 — DENY
**Patient:** SYN-PA-002 · Female, 52 · Stage IV NSCLC · **EGFR exon-19 deletion confirmed**

Rule 4 (EGFR/ALK exclusion) failed at 99% confidence. An EGFR-positive patient must receive an EGFR TKI (e.g. osimertinib) first — checkpoint inhibitors are contraindicated first-line. Agent recommended re-submitting for Tagrisso.

---

### Case 3 — NEEDS REVIEW + EXPEDITE
**Patient:** SYN-PA-003 · Male, 71 · Stage IIIB NSCLC · PD-L1 PENDING · EGFR/ALK UNKNOWN · ECOG 2 · Rapid weight loss, post-obstructive pneumonia

Three rules flagged LOW confidence (10–35%) — biomarker panel not back yet. Agent listed exactly what's missing and flagged EXPEDITE due to rapidly deteriorating clinical status.

---

## Coverage Rules Evaluated (Pembrolizumab / NSCLC)

| # | Rule | Why It Matters |
|---|---|---|
| 1 | Histologic confirmation | Small cell lung cancer is not covered |
| 2 | Stage ≥ IIIB unresectable or IV | Not indicated for early resectable disease |
| 3 | PD-L1 TPS ≥ 1% via 22C3 pharmDx | Predictive biomarker — drives first-line eligibility |
| 4 | No EGFR/ALK mutation (first-line) | EGFR/ALK+ patients must get targeted therapy first |
| 5 | ECOG performance status 0–2 | ECOG 3/4 requires medical director review |
| 6 | Line of therapy | First-line = no prior chemo; second-line = documented progression |
| 7 | Organ function labs within 28 days | Renal, hepatic, hematopoietic thresholds |

---

## What Makes This Different

| Today | This Agent |
|---|---|
| 3–14 day manual review | Under 60 seconds |
| Black-box yes/no | Rule-by-rule breakdown, cited evidence |
| Reviewer guesses on missing data | Low confidence → NEEDS REVIEW, never guesses |
| No urgency differentiation | EXPEDITE / STANDARD with clinical rationale |
| No audit trail | Every decision fully documented and reproducible |

---

## Safety

- All patient data is **100% synthetic** — no real PHI anywhere in this project
- The agent is explicitly designed to **never guess** on missing data — low confidence is a first-class output
- This is a hackathon prototype, not a regulated medical device

---

*Built at Biopharma Hack Day @ AWS · 2025 · Strands Agents SDK + Amazon Bedrock*
