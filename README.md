# Claims Adjudication Simulator
### Biopharma Hack Day @ AWS — Problem Statement #4

> **Prior authorization for oncology drugs takes 3–10 days on average. Patients with late-stage cancer don't have that time.**

This project replaces the slow, opaque, manual prior-authorization (PA) review process with a real-time AI agent that evaluates every coverage rule transparently — one at a time, with confidence scores and cited evidence.

---

## The Problem

Today's PA process for oncology drugs:
- Takes **3–14 business days** for a manual review that often involves fax machines
- Produces a **yes/no black box** — no explanation for denials
- Has **no urgency differentiation** — a rapidly progressing Stage IV patient waits the same as a stable case
- Is error-prone when **biomarker results are pending** — reviewers guess instead of flagging

## The Solution

An AI agent that reads a drug's coverage policy and a patient's prescription, then evaluates each rule **individually** with a structured, auditable output:

```
Rule: PD-L1 Expression (TPS ≥ 1%)
  Status    : ✅ SATISFIED
  Confidence: HIGH (99%)
  Evidence  : PD-L1 TPS = 78% via 22C3 pharmDx, resulted 2025-10-10
  Reasoning : TPS of 78% far exceeds the ≥1% threshold for first-line monotherapy
```

Low confidence on missing data (e.g. biomarker pending) rolls up to **NEEDS REVIEW** — not a guess.

---

## Demo Output — 3 Synthetic Cases

### Case 1 — APPROVE (Standard)
Patient: 65M, Stage IV NSCLC, PD-L1 78%, EGFR wild-type, ECOG 1, treatment-naïve

```
Decision  : ✅  APPROVE
Urgency   : 📋  STANDARD
Rules Eval: 7 coverage rules examined — 7/7 SATISFIED
```

All 7 rules satisfied with HIGH confidence (96–99%). Approved for 200 mg IV q3w, 6-month authorization.

---

### Case 2 — DENY
Patient: 52F, Stage IV NSCLC, EGFR exon-19 deletion confirmed by NGS

```
Decision  : ❌  DENY
Urgency   : 🚨  EXPEDITE
Rules Eval: 7 coverage rules examined — 1 FAILED (confidence 99%)
```

Rule 4 (EGFR/ALK exclusion) failed with 99% confidence. Standard of care for EGFR-mutant NSCLC is an EGFR TKI (osimertinib), not a checkpoint inhibitor. Agent recommended re-submitting for Tagrisso.

---

### Case 3 — NEEDS REVIEW + EXPEDITE
Patient: 71M, Stage IIIB NSCLC, PD-L1 / EGFR / ALK all PENDING, rapid weight loss, ECOG 2

```
Decision  : ⚠️   NEEDS REVIEW
Urgency   : 🚨  EXPEDITE
Rules Eval: 7 rules — 4 SATISFIED, 3 LOW CONFIDENCE (data missing)
```

Three rules flagged LOW confidence (10–35%) because biomarker results aren't back yet. Agent listed exactly which results are needed and flagged EXPEDITE due to rapidly progressing symptoms and post-obstructive pneumonia.

---

## Architecture

```
run_demo.py
  └── agent/claims_adjudication_agent.py     (Strands Agent)
        │
        ├── fetch_coverage_policy()           Tool 1
        │     Bright Data Web Unlocker → live payer policy
        │     Falls back to hardcoded Pembrolizumab/NSCLC policy
        │
        ├── record_rule_evaluation()          Tool 2  (called once per rule)
        │     rule_id, satisfied, confidence_score, evidence, reasoning
        │
        ├── assess_clinical_urgency()         Tool 3
        │     EXPEDITE vs STANDARD based on stage, ECOG, progression
        │
        └── finalize_adjudication()           Tool 4
              Aggregates rules → APPROVE / DENY / NEEDS REVIEW

data/synthetic_cases.py                       3 test prescriptions
```

**Decision logic:**
- `NEEDS REVIEW` — any rule has confidence < 0.5 (data missing/ambiguous)
- `DENY` — any rule not satisfied with confidence ≥ 0.7
- `APPROVE` — all rules satisfied with confidence ≥ 0.7

---

## Tech Stack

| Component | Technology |
|---|---|
| Agent orchestration | [Strands Agents SDK](https://strandsagents.com) |
| LLM | Amazon Bedrock — Claude Sonnet 4.6 (`us.anthropic.claude-sonnet-4-6`) |
| Live policy fetch | Bright Data Web Unlocker API |
| Drug / indication | Pembrolizumab (Keytruda) — NSCLC |
| Patient data | 100% synthetic — no real PHI anywhere |

---

## Coverage Rules Evaluated

Clinically realistic rules for Pembrolizumab in NSCLC (modelled on public payer policies):

| # | Rule | Why it matters |
|---|---|---|
| 1 | Histologic confirmation | Small cell lung cancer is NOT covered |
| 2 | Disease stage ≥ IIIB unresectable / IV | Pembrolizumab is not indicated for early-stage resectable disease |
| 3 | PD-L1 TPS ≥ 1% (22C3 pharmDx) | Predictive biomarker — TPS drives monotherapy vs combo decision |
| 4 | EGFR/ALK exclusion | EGFR/ALK-positive patients must receive targeted therapy first |
| 5 | ECOG performance status 0–2 | ECOG 3/4 requires medical director review |
| 6 | Line of therapy | First-line = no prior systemic chemo; second-line = documented progression |
| 7 | Organ function labs (within 28 days) | Renal, hepatic, hematopoietic thresholds |

---

## Setup

```bash
git clone https://github.com/SenayYakut/Claims-adjudication-agent
cd Claims-adjudication-agent

python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Add your AWS and Bright Data credentials
```

### Environment Variables

```bash
# Required — AWS (Bedrock)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...        # if using temporary credentials
AWS_DEFAULT_REGION=us-east-1

# Optional — Bright Data Web Unlocker (live policy fetch)
BRIGHTDATA_API_TOKEN=...
BRIGHTDATA_ZONE=hackathon_unlocker

# Optional — override the default policy URL
COVERAGE_POLICY_URL=https://www.aetna.com/cpb/medical/data/700_799/0770.html
```

---

## Running the Demo

```bash
# Single case
.venv/bin/python run_demo.py --case 1   # APPROVE
.venv/bin/python run_demo.py --case 2   # DENY
.venv/bin/python run_demo.py --case 3   # NEEDS REVIEW + EXPEDITE

# All 3 without pausing
.venv/bin/python run_demo.py --all
```

---

## What Makes This Different

| Today's PA | This Agent |
|---|---|
| 3–14 day manual review | Real-time (< 60 seconds) |
| Black-box yes/no | Rule-by-rule breakdown with cited evidence |
| Reviewer guesses on missing data | Low confidence → NEEDS REVIEW (never guesses) |
| No urgency differentiation | EXPEDITE / STANDARD flag with clinical rationale |
| Phone/fax workflow | API-ready structured output |

---

## Safety & Compliance Notes

- All patient data is **100% synthetic** — no real patient information is used anywhere in this project
- The agent is explicitly designed to **refuse to guess** on missing biomarker data — low confidence is a first-class output, not a fallback
- This is a **hackathon prototype**, not a regulated medical device or FDA-approved clinical decision support system

---

*Built at Biopharma Hack Day @ AWS · Problem Statement #4 · 2025*
