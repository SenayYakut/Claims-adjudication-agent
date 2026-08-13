# Meridian — Demo Script
### Biopharma Hack Day @ AWS · Problem Statement #4

---

## OPENING (30 seconds)

> "Hi, I'm [name]. This is Meridian — a prior authorization AI agent for oncology drugs built on Amazon Bedrock and the Strands Agents SDK.

> The problem: when an oncologist prescribes a drug like Keytruda for a lung cancer patient, the insurance company has to approve it first. That process takes 3 to 14 days — done manually, by a human, reading policy documents and faxing paperwork. For a Stage IV cancer patient, that wait is not just frustrating. It's dangerous.

> Meridian replaces that wait with a real-time decision — in under 60 seconds — that is transparent, auditable, and never guesses."

---

## THE TECH (20 seconds)

> "Under the hood: the agent uses the Strands Agents SDK to orchestrate four tools. It fetches the live coverage policy using Bright Data's Web Unlocker, evaluates each coverage rule one at a time with a confidence score, assesses clinical urgency, and produces a final decision — APPROVE, DENY, or NEEDS REVIEW."

---

## CASE 1 — APPROVE (click Run on Case 1)

> "Let's start with a clear approval. Robert Chen, 65 years old, Stage IV lung cancer. His PD-L1 score is 78% — well above the 1% threshold. His EGFR and ALK biomarkers are negative. ECOG performance status is 1. He's treatment-naive."

*[wait for results to load]*

> "Seven rules evaluated, seven satisfied. Notice the confidence scores — 96 to 99 percent on every rule. The agent cites the exact data point for each decision. This is the audit trail that a human reviewer would otherwise have to write by hand.

> Decision: APPROVE."

---

## CASE 2 — DENY (click Run on Case 2)

> "Now a denial. Maria Alvarez, 52, also Stage IV NSCLC. Her PD-L1 is 45% — that looks fine. But watch Rule 4."

*[wait for results to load]*

> "EGFR exon-19 deletion — confirmed positive by NGS. That's a sensitizing mutation. For this patient, the standard of care is an EGFR tyrosine kinase inhibitor — osimertinib, not a checkpoint inhibitor. The coverage policy explicitly excludes pembrolizumab first-line for EGFR-positive patients.

> The agent caught this at 99% confidence. Decision: DENY. And it tells the oncologist exactly what to submit instead — a PA for Tagrisso."

---

## CASE 3 — NEEDS REVIEW + EXPEDITE (click Run on Case 3)

> "This is the most important case. James Whitfield, 71, Stage IIIB. His biomarker panel — PD-L1, EGFR, ALK — is still pending. Results expected in 5 to 7 days."

*[wait for results to load]*

> "Three rules flagged LOW confidence — 10 to 35 percent — because the data simply isn't there yet. A human reviewer might guess, or just deny to be safe. Meridian doesn't guess. It says NEEDS REVIEW and lists exactly which results are missing and who needs to provide them.

> And notice the urgency flag — EXPEDITE. The agent detected rapid disease progression: 12-pound weight loss in 6 weeks, post-obstructive pneumonia, ECOG 2. This case jumps to the front of the human review queue.

> So the reviewer isn't starting from scratch — they receive a pre-analyzed case with the missing items identified, and they make one phone call to unblock it."

---

## THE PITCH (30 seconds)

> "What Meridian gives a payer:

> First — speed. From 14 days to 60 seconds for clear cases.

> Second — consistency. The same rules applied the same way every time. No two reviewers making different calls on the same prescription.

> Third — an audit trail. Every decision is documented with cited evidence and confidence scores — defensible in an appeal.

> And fourth — the safety property that matters most: Meridian never guesses on missing data. Low confidence is a first-class output. That's what makes this safe to put in front of a real patient."

---

## CLOSING (10 seconds)

> "All patient data is 100% synthetic. The agent runs on Amazon Bedrock — Claude Sonnet 4.6 — with the Strands Agents SDK. Thank you."

---

## TIPS

- **Pause after clicking each case** — let the results load before talking through them
- **Point at the confidence scores** — that's the differentiator, make sure the audience sees them
- **Case 3 is your strongest demo moment** — the NEEDS REVIEW + EXPEDITE combination tells the clearest story
- **If something breaks** — "the agent is calling Bedrock live, let me give it a moment" — never apologize, just narrate
- **Expected runtime per case** — ~45–60 seconds
