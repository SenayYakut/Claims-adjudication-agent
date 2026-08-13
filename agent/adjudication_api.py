"""
Thin JSON-exposure wrapper around the adjudication engine.

This does NOT change any decision logic. It reruns the same 4-tool pipeline in
`claims_adjudication_agent.adjudicate()` and reshapes the recorded state
(`_rule_evaluations` + the urgency assessment) into a structured
`AdjudicationResult` dict that the reviewer frontend consumes.

The verdict thresholds below are duplicated verbatim from
`finalize_adjudication` so the JSON verdict always matches the text report:
  NEEDS_REVIEW  any rule confidence < 0.5
  DENY          any rule not satisfied with confidence >= 0.7
  APPROVE       otherwise (all satisfied with sufficient confidence)

Frontend contract (frontend/lib/types.ts):

    AdjudicationResult {
      caseId, patient{name,id}, drug, diagnosis,
      policySource: 'live'|'fallback',
      urgency: 'EXPEDITE'|'STANDARD', urgencyReason?,
      rules: RuleEvaluation[], verdict, verdictConfidence
    }
    RuleEvaluation { ruleName, satisfied, confidence, evidence, reason }
"""

from __future__ import annotations

import json
from typing import Optional

from agent import claims_adjudication_agent as core


def _compute_verdict(rules: list[dict]) -> tuple[str, float]:
    """Same thresholds as finalize_adjudication. Returns (verdict, overall_conf)."""
    low_conf = [r for r in rules if r["confidence_score"] < 0.5]
    denied = [
        r for r in rules
        if not r["is_satisfied"] and r["confidence_score"] >= 0.7
    ]

    if low_conf:
        verdict = "NEEDS_REVIEW"
        overall = min((r["confidence_score"] for r in low_conf), default=0.0)
    elif denied:
        verdict = "DENY"
        overall = max((r["confidence_score"] for r in denied), default=0.0)
    else:
        verdict = "APPROVE"
        overall = min((r["confidence_score"] for r in rules), default=0.0)

    return verdict, round(overall, 2)


def _map_rule(r: dict) -> dict:
    return {
        "ruleName": r["rule_description"] or r["rule_id"],
        "satisfied": bool(r["is_satisfied"]),
        "confidence": round(float(r["confidence_score"]), 2),
        "evidence": r["supporting_evidence"],
        "reason": r["reasoning"],
    }


def build_result(
    prescription: dict,
    rule_evaluations: list[dict],
    urgency: dict,
    policy_source: str,
) -> dict:
    """Reshape recorded engine state into the AdjudicationResult contract."""
    rules = [_map_rule(r) for r in rule_evaluations]
    verdict, overall_conf = _compute_verdict(rule_evaluations)

    diagnosis_block = prescription.get("diagnosis", {})
    diagnosis = ", ".join(
        p for p in [diagnosis_block.get("primary"), diagnosis_block.get("stage")] if p
    ) or "Unknown"

    return {
        "caseId": prescription.get("patient_id", "UNKNOWN"),
        "patient": {
            "name": prescription.get("patient_name", prescription.get("patient_id", "UNKNOWN")),
            "id": prescription.get("patient_id", "UNKNOWN"),
        },
        "drug": prescription.get("drug_name", "Unknown Drug"),
        "diagnosis": diagnosis,
        "policySource": policy_source,
        "urgency": urgency.get("urgency_level", "STANDARD"),
        "urgencyReason": urgency.get("clinical_rationale"),
        "rules": rules,
        "verdict": verdict,
        "verdictConfidence": overall_conf,
    }


def adjudicate_structured(prescription: dict, policy_url: str = "") -> dict:
    """
    Run the real agent pipeline and return a structured AdjudicationResult dict.

    Requires AWS/Bedrock credentials (same as core.adjudicate). For a demo
    without credentials, use the JSON fixtures in frontend/lib/fixtures.ts,
    which mirror this shape.
    """
    core._reset_session()
    # core.adjudicate runs the 4-tool pipeline and populates module state.
    core.adjudicate(prescription, policy_url=policy_url)

    rules = list(core._rule_evaluations)

    # Recover the urgency assessment from the recorded run if available;
    # fall back to a STANDARD stub if the agent did not surface it.
    urgency = getattr(core, "_last_urgency", None) or {
        "urgency_level": "STANDARD",
        "clinical_rationale": None,
    }

    policy_source = "fallback"  # live-vs-fallback is decided inside fetch_coverage_policy
    return build_result(prescription, rules, urgency, policy_source)


if __name__ == "__main__":
    import os
    import sys

    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from data.synthetic_cases import CASE_1_APPROVE

    print(json.dumps(adjudicate_structured(CASE_1_APPROVE), indent=2))
