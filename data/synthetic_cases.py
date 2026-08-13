"""
Synthetic prior authorization test cases for Pembrolizumab (Keytruda) in NSCLC.
ALL patient data is 100% SYNTHETIC. No real patient information used anywhere.
"""

# ── Case 1: Clear APPROVE ─────────────────────────────────────────────────────
# All criteria met: Stage IV, PD-L1 high, EGFR/ALK wild-type, ECOG 1, treatment-naive
CASE_1_APPROVE = {
    "patient_id": "SYN-PA-001",
    "patient_demographics": {
        "age": 65,
        "sex": "Male",
        "weight_kg": 82,
    },
    "drug_name": "Pembrolizumab (Keytruda)",
    "requested_dose": "200 mg IV every 3 weeks",
    "diagnosis": {
        "primary": "Non-small cell lung cancer (NSCLC), adenocarcinoma",
        "icd10": "C34.10",
        "stage": "Stage IV (metastatic)",
        "sites_of_metastasis": ["contralateral lung nodules", "mediastinal lymph nodes"],
    },
    "biomarkers": {
        "pdl1_tps": "78%",
        "pdl1_assay": "PD-L1 IHC 22C3 pharmDx — resulted 2025-10-10",
        "egfr_mutation": "Wild-type (negative) — NGS panel confirmed",
        "alk_rearrangement": "Negative — FISH confirmed",
        "ros1": "Negative",
        "kras_g12c": "Negative",
        "tmb": "12 mut/Mb",
    },
    "prior_therapy": {
        "prior_systemic_chemotherapy_for_advanced_disease": False,
        "prior_radiation": False,
        "notes": "Treatment-naive for metastatic/advanced NSCLC",
    },
    "performance_status": {
        "ecog": 1,
        "functional_notes": "Ambulatory, capable of self-care, limited strenuous activity",
    },
    "organ_function_labs": {
        "creatinine": "0.9 mg/dL",
        "egfr_renal": "82 mL/min",
        "total_bilirubin": "0.7 mg/dL",
        "ast": "22 U/L",
        "alt": "18 U/L",
        "anc": "3200/μL",
        "hemoglobin": "13.1 g/dL",
        "platelets": "220K/μL",
        "lab_date": "2025-10-15",
    },
    "autoimmune_history": "None",
    "current_steroids": "None",
    "prior_checkpoint_inhibitor_ae": False,
    "disease_trajectory": "Newly diagnosed metastatic disease; stable over 4-week staging workup",
    "prescribing_physician": "Dr. A. Patel, MD — Medical Oncology",
}

# ── Case 2: Clear DENY ────────────────────────────────────────────────────────
# EGFR exon-19 deletion present → checkpoint inhibitor is contraindicated first-line;
# standard of care is an EGFR TKI (osimertinib). Coverage policy explicitly excludes this.
CASE_2_DENY = {
    "patient_id": "SYN-PA-002",
    "patient_demographics": {
        "age": 52,
        "sex": "Female",
        "weight_kg": 61,
    },
    "drug_name": "Pembrolizumab (Keytruda)",
    "requested_dose": "200 mg IV every 3 weeks",
    "diagnosis": {
        "primary": "Non-small cell lung cancer (NSCLC), adenocarcinoma",
        "icd10": "C34.32",
        "stage": "Stage IV (metastatic)",
        "sites_of_metastasis": ["brain (2 lesions, < 1 cm)", "adrenal gland", "bone"],
    },
    "biomarkers": {
        "pdl1_tps": "45%",
        "pdl1_assay": "PD-L1 IHC 22C3 pharmDx — resulted 2025-10-05",
        "egfr_mutation": "POSITIVE — Exon 19 deletion (L747_P753delinsS) confirmed by NGS",
        "alk_rearrangement": "Negative",
        "ros1": "Negative",
        "kras_g12c": "Negative",
        "tmb": "4 mut/Mb",
    },
    "prior_therapy": {
        "prior_systemic_chemotherapy_for_advanced_disease": False,
        "prior_radiation": True,
        "radiation_site": "Whole-brain radiation therapy (WBRT) — completed 2025-08-01",
        "notes": "Systemic treatment-naive; WBRT for brain metastases only",
    },
    "performance_status": {
        "ecog": 1,
        "functional_notes": "Ambulatory; mild fatigue post-WBRT",
    },
    "organ_function_labs": {
        "creatinine": "0.8 mg/dL",
        "egfr_renal": "91 mL/min",
        "total_bilirubin": "0.5 mg/dL",
        "ast": "19 U/L",
        "alt": "22 U/L",
        "anc": "2800/μL",
        "hemoglobin": "11.8 g/dL",
        "platelets": "185K/μL",
        "lab_date": "2025-10-12",
    },
    "autoimmune_history": "None",
    "current_steroids": "Dexamethasone 2 mg daily (post-WBRT taper)",
    "prior_checkpoint_inhibitor_ae": False,
    "disease_trajectory": "Aggressive metastatic disease with active CNS involvement",
    "prescribing_physician": "Dr. B. Kim, MD — Neuro-Oncology / Medical Oncology",
}

# ── Case 3: NEEDS REVIEW + EXPEDITE urgency ───────────────────────────────────
# Biomarker panel pending; EGFR/ALK/PD-L1 all unknown → low confidence on multiple
# rules. Rapid symptom progression and ECOG 2 → EXPEDITE urgency.
CASE_3_NEEDS_REVIEW = {
    "patient_id": "SYN-PA-003",
    "patient_demographics": {
        "age": 71,
        "sex": "Male",
        "weight_kg": 68,
    },
    "drug_name": "Pembrolizumab (Keytruda)",
    "requested_dose": "200 mg IV every 3 weeks",
    "diagnosis": {
        "primary": "Non-small cell lung cancer (NSCLC) — histologic subtype pending final pathology",
        "icd10": "C34.10",
        "stage": "Stage IIIB (locally advanced, unresectable)",
        "sites_of_metastasis": ["N/A — locally advanced; no confirmed distant metastases"],
    },
    "biomarkers": {
        "pdl1_tps": "PENDING — sample submitted to reference lab; results expected in 5–7 business days",
        "pdl1_assay": "PD-L1 IHC 22C3 pharmDx ordered, not resulted",
        "egfr_mutation": "UNKNOWN — comprehensive genomic profiling (FoundationOne CDx) ordered; not resulted",
        "alk_rearrangement": "UNKNOWN — FISH testing in progress",
        "ros1": "UNKNOWN",
        "kras_g12c": "UNKNOWN",
        "tmb": "Not reported",
    },
    "prior_therapy": {
        "prior_systemic_chemotherapy_for_advanced_disease": False,
        "prior_radiation": False,
        "notes": "Newly diagnosed; presentation with obstructive symptoms requiring urgent workup",
    },
    "performance_status": {
        "ecog": 2,
        "functional_notes": "Ambulatory >50% of waking hours; unable to perform any work; "
                            "12 lb (5.4 kg) weight loss over 6 weeks",
    },
    "organ_function_labs": {
        "creatinine": "1.3 mg/dL",
        "egfr_renal": "52 mL/min",
        "total_bilirubin": "0.9 mg/dL",
        "ast": "31 U/L",
        "alt": "28 U/L",
        "anc": "4100/μL",
        "hemoglobin": "10.2 g/dL",
        "platelets": "310K/μL",
        "lab_date": "2025-10-10",
    },
    "autoimmune_history": "Rheumatoid arthritis — managed with hydroxychloroquine 200 mg daily (not systemic immunosuppression)",
    "current_steroids": "None",
    "prior_checkpoint_inhibitor_ae": False,
    "disease_trajectory": (
        "Rapidly progressing symptoms: severe progressive dyspnea, 12 lb weight loss in 6 weeks, "
        "post-obstructive pneumonia requiring IV antibiotics. Clinical team requesting urgent systemic therapy."
    ),
    "prescribing_physician": "Dr. C. Johnson, MD — Pulmonary Oncology",
}

ALL_CASES = [
    ("CASE 1 — Expected: APPROVE (Standard urgency)", CASE_1_APPROVE),
    ("CASE 2 — Expected: DENY", CASE_2_DENY),
    ("CASE 3 — Expected: NEEDS REVIEW + EXPEDITE urgency", CASE_3_NEEDS_REVIEW),
]
