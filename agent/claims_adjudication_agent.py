"""
Claims Adjudication Simulator — Biopharma Hack Day @ AWS
Problem Statement #4: Prior Authorization for Oncology Drugs

Drug: Pembrolizumab (Keytruda) — PD-1 checkpoint inhibitor for NSCLC
Model: Claude 3.5 Sonnet via Amazon Bedrock
Orchestration: Strands Agents SDK
Live policy fetch: Bright Data Web Unlocker API (falls back to hardcoded policy)
"""

import json
import logging
import os

import requests
import urllib3
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from strands import Agent, tool
from strands.models.bedrock import BedrockModel

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Hardcoded fallback: Pembrolizumab (Keytruda) coverage policy for NSCLC
# Modelled on publicly available payer policies (synthetic for demo use only)
# ─────────────────────────────────────────────────────────────────────────────
FALLBACK_POLICY = """
COVERAGE POLICY: Pembrolizumab (Keytruda) — Non-Small Cell Lung Cancer (NSCLC)
Policy Type: Medical Prior Authorization | Effective: 2025-01-01
Issuer: Synthetic Reference Payer [HACKATHON DEMO — NOT FOR CLINICAL USE]

COVERED INDICATIONS: Pembrolizumab is covered for NSCLC when ALL of the
following criteria are met:

RULE 1 — HISTOLOGIC CONFIRMATION
Patient must have histologically or cytologically confirmed NSCLC (adenocarcinoma,
squamous cell carcinoma, or large cell carcinoma NOS). Small cell lung cancer is
NOT covered under this policy.

RULE 2 — DISEASE STAGE
Patient must have Stage IIIB (unresectable) or Stage IV NSCLC, OR locally
advanced disease not amenable to curative surgery or chemoradiation.

RULE 3 — PD-L1 EXPRESSION (Required Biomarker)
PD-L1 tumor proportion score (TPS) must be documented via FDA-approved assay
(e.g., PD-L1 IHC 22C3 pharmDx):
  • First-line monotherapy: TPS ≥ 1% required
  • Combination with platinum-based chemo: TPS ≥ 1% required
  • Second-line+: TPS ≥ 1% preferred; TPS < 1% covered with clinical rationale
  • If TPS result is PENDING or unavailable, authorization is held pending results.

RULE 4 — EGFR / ALK BIOMARKER EXCLUSION
For first-line pembrolizumab (mono or combination):
  • Patient must NOT have known sensitizing EGFR mutations (exon 19 del, L858R,
    exon 20 insertion, or other activating mutations).
  • Patient must NOT have known ALK gene rearrangements.
  • Patients with EGFR/ALK alterations must receive approved targeted therapy first.
  • EGFR and ALK status must be KNOWN before first-line pembrolizumab is approved.
    If testing is incomplete, authorization is withheld pending results.

RULE 5 — ECOG PERFORMANCE STATUS
Patient must have ECOG PS 0, 1, or 2 at time of treatment initiation.
ECOG 3 or 4 requires mandatory medical director review.

RULE 6 — LINE OF THERAPY
  • First-line: No prior systemic chemotherapy for metastatic/advanced NSCLC.
  • Second-line+: Documented disease progression on ≥ 1 prior platinum-based
    regimen is required.

RULE 7 — ORGAN FUNCTION (labs within past 28 days required)
  • Creatinine ≤ 1.5× ULN or eGFR ≥ 30 mL/min
  • Total bilirubin ≤ 1.5× ULN (≤ 3× ULN for documented Gilbert's syndrome)
  • AST/ALT ≤ 2.5× ULN (≤ 5× ULN if liver metastases)
  • ANC ≥ 1000/μL, Hgb ≥ 8 g/dL, Platelets ≥ 100K/μL

DENIAL CRITERIA (any one → automatic denial):
  • Active autoimmune disease requiring systemic immunosuppression
  • Systemic corticosteroids > 10 mg/day prednisone equivalent (ongoing)
  • Prior Grade 3/4 immune-related AE on a checkpoint inhibitor
  • Known sensitizing EGFR mutation or ALK rearrangement in treatment-naive patient

QUANTITY LIMITS: 200 mg IV q3w OR 400 mg IV q6w
Initial auth period: 6 months; renewal requires documented response/stability.

[SYNTHETIC POLICY — HACKATHON DEMONSTRATION ONLY. NOT FOR CLINICAL USE.]
"""

# ─────────────────────────────────────────────────────────────────────────────
# Module-level session state — reset between claims
# ─────────────────────────────────────────────────────────────────────────────
_rule_evaluations: list[dict] = []
# Captured during a run so the JSON wrapper can surface them (additive telemetry
# only — these do not affect the decision logic).
_last_urgency: dict | None = None
_last_policy_source: str = "fallback"


def _reset_session():
    global _rule_evaluations, _last_urgency, _last_policy_source
    _rule_evaluations = []
    _last_urgency = None
    _last_policy_source = "fallback"


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 1 — Fetch live coverage policy via Bright Data Web Unlocker
# ─────────────────────────────────────────────────────────────────────────────
@tool
def fetch_coverage_policy(drug_name: str, policy_url: str) -> str:
    """
    Fetch the live coverage policy for a drug from a public payer website using
    Bright Data's Web Unlocker API. Falls back to a hardcoded reference policy
    if the fetch fails or credentials are not configured.

    Args:
        drug_name: Name of the drug (e.g. 'Pembrolizumab')
        policy_url: Public URL of the payer coverage policy page to fetch

    Returns:
        Full text of the coverage policy to use for adjudication.
    """
    api_token = os.getenv("BRIGHTDATA_API_TOKEN", "")
    zone = os.getenv("BRIGHTDATA_ZONE", "hackathon_unlocker")

    if api_token and policy_url:
        try:
            logger.info("Fetching live policy via Bright Data Web Unlocker: %s", policy_url)
            resp = requests.post(
                "https://api.brightdata.com/request",
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json",
                },
                json={"zone": zone, "url": policy_url, "format": "raw"},
                timeout=45,
            )
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            # Trim to stay within context window
            policy_text = f"[LIVE POLICY — fetched from {policy_url}]\n\n{text[:8000]}"
            logger.info("Live policy fetched successfully (%d chars).", len(policy_text))
            global _last_policy_source
            _last_policy_source = "live"
            return policy_text
        except Exception as exc:
            logger.warning("Bright Data fetch failed (%s). Using fallback policy.", exc)

    logger.info("Using hardcoded fallback policy for %s.", drug_name)
    _last_policy_source = "fallback"
    return f"[FALLBACK POLICY — {drug_name}]\n\n{FALLBACK_POLICY}"


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 2 — Record evaluation of a single coverage rule
# ─────────────────────────────────────────────────────────────────────────────
@tool
def record_rule_evaluation(
    rule_id: str,
    rule_description: str,
    is_satisfied: bool,
    confidence_score: float,
    supporting_evidence: str,
    reasoning: str,
) -> str:
    """
    Record the evaluation result for exactly ONE coverage rule. The agent must call
    this tool once per rule — do NOT batch multiple rules into one call.

    Confidence scoring guide:
      0.9-1.0  Explicit data in the prescription confirms/refutes the rule
      0.7-0.89 Strong inference from available data
      0.5-0.69 Partial data; some inference required
      0.3-0.49 Data absent or ambiguous — triggers NEEDS REVIEW
      0.0-0.29 Completely unknown — no basis for assessment

    Args:
        rule_id: Short identifier (e.g. 'RULE_3_PDL1', 'RULE_4_EGFR_ALK')
        rule_description: One-line description of the rule being evaluated
        is_satisfied: True if the patient/prescription meets this rule
        confidence_score: Float 0.0–1.0; use <0.5 when key data is missing
        supporting_evidence: Exact value or finding from the prescription that
                             supports or contradicts this rule
        reasoning: One sentence citing the specific fact and how it maps to the rule

    Returns:
        JSON string confirming the recorded evaluation.
    """
    confidence_score = max(0.0, min(1.0, confidence_score))

    evaluation = {
        "rule_id": rule_id,
        "rule_description": rule_description,
        "is_satisfied": is_satisfied,
        "confidence_score": round(confidence_score, 2),
        "supporting_evidence": supporting_evidence,
        "reasoning": reasoning,
    }
    _rule_evaluations.append(evaluation)

    conf_label = (
        "HIGH" if confidence_score >= 0.8 else
        "MEDIUM" if confidence_score >= 0.5 else
        "LOW ← NEEDS REVIEW"
    )
    status = "SATISFIED" if is_satisfied else "NOT SATISFIED"
    logger.info("  Rule %-25s | %-13s | Confidence: %s (%.2f)",
                rule_id, status, conf_label, confidence_score)
    return json.dumps(evaluation)


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 3 — Assess clinical urgency
# ─────────────────────────────────────────────────────────────────────────────
@tool
def assess_clinical_urgency(
    cancer_stage: str,
    disease_progression_notes: str,
    ecog_performance_status: int,
    time_sensitivity_factors: str,
) -> str:
    """
    Determine whether this prior authorization requires EXPEDITE or STANDARD
    processing based on clinical urgency. Expedite is warranted when treatment
    delay could cause significant harm.

    Args:
        cancer_stage: Current cancer stage (e.g. 'Stage IV', 'Stage IIIB')
        disease_progression_notes: Trajectory description (e.g. 'rapidly progressing')
        ecog_performance_status: ECOG PS score (0=fully active … 4=completely disabled)
        time_sensitivity_factors: Additional urgency factors (hospitalization, organ
                                  compromise, symptom burden, etc.)

    Returns:
        JSON string with urgency_level (EXPEDITE|STANDARD) and clinical_rationale.
    """
    urgency = "STANDARD"
    rationale = []

    stage_lower = cancer_stage.lower()
    if "iv" in stage_lower or "4" in stage_lower:
        rationale.append("Stage IV metastatic disease significantly limits treatment window")
        urgency = "EXPEDITE"

    prog_lower = disease_progression_notes.lower()
    rapid_kw = ["rapid", "rapidly", "aggressive", "progressing", "progressive",
                "deteriorat", "worsening", "urgent", "acute", "obstructi"]
    if any(k in prog_lower for k in rapid_kw):
        rationale.append("Documented rapid disease progression indicating time-critical need")
        urgency = "EXPEDITE"

    if ecog_performance_status >= 2:
        rationale.append(
            f"ECOG PS {ecog_performance_status} indicates compromised functional status"
        )
        urgency = "EXPEDITE"

    ts_lower = time_sensitivity_factors.lower()
    urgent_kw = ["hospital", "icu", "emergenc", "organ", "dyspnea", "pain",
                 "failure", "obstruct", "pneumon", "weight loss"]
    if any(k in ts_lower for k in urgent_kw):
        rationale.append(f"Acute time-sensitive factor: {time_sensitivity_factors[:120]}")
        urgency = "EXPEDITE"

    if not rationale:
        rationale.append(
            "Stable disease trajectory; no acute indicators of imminent deterioration"
        )

    result = {
        "urgency_level": urgency,
        "clinical_rationale": " | ".join(rationale),
        "ecog_score": ecog_performance_status,
        "cancer_stage": cancer_stage,
    }
    logger.info("Clinical Urgency: %s", urgency)
    global _last_urgency
    _last_urgency = result
    return json.dumps(result)


# ─────────────────────────────────────────────────────────────────────────────
# TOOL 4 — Finalize and render the adjudication report
# ─────────────────────────────────────────────────────────────────────────────
@tool
def finalize_adjudication(patient_id: str, drug_name: str, urgency_json: str) -> str:
    """
    Aggregate all recorded rule evaluations and render the final adjudication report.
    Call this LAST — after every rule has been evaluated and urgency has been assessed.

    Decision logic:
      NEEDS REVIEW  Any rule has confidence_score < 0.5 (data missing/ambiguous)
      DENY          Any rule is NOT satisfied with confidence_score ≥ 0.7
      APPROVE       All rules satisfied with confidence_score ≥ 0.7

    Args:
        patient_id: Patient identifier for the report header
        drug_name: Requested drug name
        urgency_json: JSON string returned by assess_clinical_urgency

    Returns:
        Formatted adjudication report.
    """
    if not _rule_evaluations:
        return "ERROR: No rule evaluations found. Call record_rule_evaluation first."

    try:
        urgency = json.loads(urgency_json)
    except Exception:
        urgency = {"urgency_level": "STANDARD", "clinical_rationale": "Parse error"}

    low_conf = [r for r in _rule_evaluations if r["confidence_score"] < 0.5]
    denied = [r for r in _rule_evaluations
              if not r["is_satisfied"] and r["confidence_score"] >= 0.7]

    if low_conf:
        decision, icon = "NEEDS REVIEW", "⚠️ "
    elif denied:
        decision, icon = "DENY", "❌"
    else:
        decision, icon = "APPROVE", "✅"

    sep = "═" * 72
    thin = "─" * 72

    lines = [
        "",
        sep,
        f"  PRIOR AUTHORIZATION DECISION  —  {drug_name.upper()}",
        sep,
        f"  Patient ID : {patient_id}",
        f"  Drug       : {drug_name}",
        f"  Decision   : {icon}  {decision}",
        f"  Urgency    : {'🚨' if urgency['urgency_level'] == 'EXPEDITE' else '📋'}  "
        f"{urgency['urgency_level']}",
        f"  Rules Eval : {len(_rule_evaluations)} coverage rules examined",
        thin,
        "  RULE-BY-RULE EVALUATION",
        thin,
    ]

    for i, r in enumerate(_rule_evaluations, 1):
        c = r["confidence_score"]
        conf_lbl = (
            f"HIGH    ({c:.0%})" if c >= 0.8 else
            f"MEDIUM  ({c:.0%})" if c >= 0.5 else
            f"LOW     ({c:.0%})  ← NEEDS REVIEW"
        )
        s_icon = "✅" if r["is_satisfied"] else "❌"
        lines += [
            "",
            f"  [{i}] {r['rule_id']}",
            f"      Description : {r['rule_description']}",
            f"      Status      : {s_icon}  {'SATISFIED' if r['is_satisfied'] else 'NOT SATISFIED'}",
            f"      Confidence  : {conf_lbl}",
            f"      Evidence    : {r['supporting_evidence']}",
            f"      Reasoning   : {r['reasoning']}",
        ]

    lines += [
        "",
        thin,
        "  CLINICAL URGENCY ASSESSMENT",
        thin,
        f"  Level     : {urgency['urgency_level']}",
        f"  Rationale : {urgency.get('clinical_rationale', 'N/A')}",
        "",
        thin,
        "  DECISION RATIONALE",
        thin,
    ]

    if decision == "APPROVE":
        lines.append("  All coverage criteria are satisfied with sufficient confidence.")
        lines.append("  Recommend APPROVAL of the requested prior authorization.")
    elif decision == "DENY":
        lines.append("  One or more mandatory coverage criteria are NOT satisfied:")
        for r in denied:
            lines.append(f"    • {r['rule_id']}: {r['reasoning']}")
        lines.append("  Recommend DENIAL. Prescriber should consider standard-of-care alternatives.")
    else:
        lines.append("  Insufficient documentation to confirm the following criteria:")
        for r in low_conf:
            lines.append(f"    • {r['rule_id']} (confidence {r['confidence_score']:.0%}): {r['reasoning']}")
        lines.append("  Recommend clinical reviewer contact prescribing physician to obtain missing results.")
        lines.append("  Authorization held pending receipt of outstanding biomarker / lab data.")

    lines += [
        "",
        sep,
        "  ⚕  SYNTHETIC DATA ONLY — NOT FOR CLINICAL USE — HIPAA: No real patient data.",
        sep,
        "",
    ]

    report = "\n".join(lines)
    logger.info("Adjudication complete: %s | Urgency: %s", decision, urgency["urgency_level"])
    return report


# ─────────────────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a payer-side prior authorization (PA) specialist AI for oncology drugs,
powered by Amazon Bedrock. Your job: evaluate a prescription against the coverage policy and
produce a structured, rule-by-rule adjudication decision.

WORKFLOW — execute in order:
1. Call fetch_coverage_policy to retrieve the applicable coverage policy.
2. Identify EVERY coverage rule in the policy (typically 5–8 rules).
3. For EACH rule, ONE AT A TIME, call record_rule_evaluation. Never batch rules — one
   tool call per rule. Cite the exact patient data point that confirms or contradicts each rule.
4. Call assess_clinical_urgency using stage, disease trajectory, and ECOG score.
5. Call finalize_adjudication to compile and return the report.

CONFIDENCE RULES:
  ≥ 0.9  Explicit data in prescription directly confirms/refutes the rule
  0.7–0.89  Strong inference with minor assumption
  0.5–0.69  Partial data; material inference required
  < 0.5   Data is missing, ambiguous, or pending → LOW confidence → triggers NEEDS REVIEW

CRITICAL: Do NOT fabricate or assume biomarker values, lab results, or clinical findings
that are not explicitly stated in the prescription. If a value is "pending" or "unknown",
record it with confidence < 0.5 and note exactly what is missing. Patient safety depends
on accurate incomplete-data handling.
"""


# ─────────────────────────────────────────────────────────────────────────────
# Agent factory + public entrypoint
# ─────────────────────────────────────────────────────────────────────────────
def _make_agent() -> Agent:
    model = BedrockModel(
        model_id="us.anthropic.claude-sonnet-4-6",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
    )
    return Agent(
        model=model,
        tools=[
            fetch_coverage_policy,
            record_rule_evaluation,
            assess_clinical_urgency,
            finalize_adjudication,
        ],
        system_prompt=SYSTEM_PROMPT,
    )


def adjudicate(prescription: dict, policy_url: str = "") -> str:
    """
    Run the claims adjudication agent for one prescription dict.

    Args:
        prescription: Patient/drug/clinical data (synthetic only).
        policy_url: Optional public URL for live policy fetch via Bright Data.

    Returns:
        Formatted adjudication report string.
    """
    _reset_session()

    if not policy_url:
        policy_url = os.getenv(
            "COVERAGE_POLICY_URL",
            "https://www.aetna.com/cpb/medical/data/700_799/0770.html",
        )

    drug = prescription.get("drug_name", "Unknown Drug")
    patient_id = prescription.get("patient_id", "UNKNOWN")

    prompt = f"""Process this prior authorization request.

DRUG: {drug}
POLICY URL: {policy_url}

PRESCRIPTION & PATIENT DATA:
{json.dumps(prescription, indent=2)}

Instructions:
1. Call fetch_coverage_policy(drug_name="{drug}", policy_url="{policy_url}")
2. Evaluate each rule one at a time using record_rule_evaluation
3. Call assess_clinical_urgency
4. Call finalize_adjudication(patient_id="{patient_id}", drug_name="{drug}", urgency_json=<result>)
"""

    agent = _make_agent()
    response = agent(prompt)
    return str(response)


# ─────────────────────────────────────────────────────────────────────────────
# Quick smoke test
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
    from data.synthetic_cases import CASE_1_APPROVE

    print("\n=== Smoke test: Case 1 (APPROVE) ===\n")
    result = adjudicate(CASE_1_APPROVE)
    print(result)
