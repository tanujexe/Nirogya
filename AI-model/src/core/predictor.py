"""
MediSense AI — Prediction & Differential Inference Engine v11.1
================================================================
Combines:
  1. Shared Canonical Feature Engineering (src.core.features)
  2. Calibrated Soft-Voting Ensemble (CatBoost, LightGBM, XGBoost)
  3. Body-system Plausibility & Confusion Rule Optimization
  4. Emergency screening & Triage Evaluation
  5. Multi-turn Session Diagnostic Follow-up
"""

import os
import pickle
import warnings
from typing import Dict, List, Set, Any, Optional
import numpy as np
import pandas as pd

# Suppress scikit-learn InconsistentVersionWarning
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

from config.settings import ARTIFACTS_DIR
from src.core.features import build_features, align_to_feature_names, ALL_SYMPTOM_COLS
from src.core.emergency import check_emergency, compute_triage
from src.core.specialist_matcher import get_specialist
from src.core.session_manager import (
    create_session,
    update_session,
    get_session,
    set_followup_pending,
    mark_symptom_addressed,
    append_qa_history,
    generate_best_question,
    is_uncertain,
    should_stop,
    shap_question,
    get_tests,
    get_diet,
    get_recovery,
    calculate_entropy,
)
from src.nlp.extractor import extract_symptoms, parse_vitals, interpret_followup_answer

CLINICAL_DISCLAIMER = (
    "Educational decision-support only — not a medical diagnosis. "
    "Emergency cues are heuristic; always consult a licensed clinician or emergency services."
)

# ─── LOAD ARTIFACTS ──────────────────────────────────────────────────────────
_models: list = []
_weights: list = [1.0]
_le = None
_fnames: list = []
_conf_rules: list = []

def _load_artifacts():
    global _models, _weights, _le, _fnames, _conf_rules
    if _models and _le is not None:
        return
    try:
        models_file = ARTIFACTS_DIR / "models.pkl"
        single_model_file = ARTIFACTS_DIR / "model.pkl"
        weights_file = ARTIFACTS_DIR / "weights.pkl"
        le_file = ARTIFACTS_DIR / "label_encoder.pkl"
        fnames_file = ARTIFACTS_DIR / "feature_names.pkl"
        conf_file = ARTIFACTS_DIR / "confusion_optimizer.pkl"

        if models_file.exists():
            with open(models_file, "rb") as f:
                _models = pickle.load(f)
        elif single_model_file.exists():
            with open(single_model_file, "rb") as f:
                _models = [pickle.load(f)]

        if weights_file.exists():
            with open(weights_file, "rb") as f:
                _weights = pickle.load(f)
        else:
            _weights = [1.0] * len(_models)

        with open(le_file, "rb") as f:
            _le = pickle.load(f)
        with open(fnames_file, "rb") as f:
            _fnames = pickle.load(f)

        if conf_file.exists():
            with open(conf_file, "rb") as f:
                _conf_rules = pickle.load(f)
    except Exception as e:
        raise RuntimeError(f"Cannot load ML artifacts from '{ARTIFACTS_DIR}': {e}\nPlease check model directory or train the model.")

_load_artifacts()

# ─── BODY SYSTEM PLAUSIBILITY ─────────────────────────────────────────────────
_SYS = {
    "cardiac": {"chest_pain", "palpitations", "rapid_heartbeat", "irregular_heartbeat", "leg_swelling", "shortness_of_breath"},
    "neuro": {"severe_headache", "one_side_weakness", "speech_difficulty", "seizures", "confusion", "loss_of_consciousness", "neck_stiffness", "tremors"},
    "respiratory": {"cough", "shortness_of_breath", "wheezing", "chest_tightness", "dry_cough", "productive_cough", "hemoptysis"},
    "metabolic": {"excessive_thirst", "frequent_urination", "weight_loss", "weight_gain", "heat_intolerance", "cold_intolerance"},
    "gi": {"abdominal_pain", "nausea", "vomiting", "diarrhea", "constipation", "jaundice", "dark_urine"},
    "kidney": {"flank_pain", "blood_in_urine", "burning_urination", "frequent_urination", "reduced_urination"},
    "musculo": {"joint_pain", "bone_pain", "muscle_pain", "back_pain"},
    "skin": {"skin_rash", "skin_itching", "hives", "petechiae"},
    "infectious": {"high_fever", "fever", "chills", "night_sweats", "fatigue"},
    "hematologic": {"fatigue", "general_weakness", "petechiae", "frequent_infections"},
    "psychiatric": {"anxiety", "depression", "mood_changes", "tremors"},
}

_DIS_SYS = {
    "Coronary Artery Disease": "cardiac", "Heart Failure": "cardiac", "Hypertension": "cardiac", "Pulmonary Embolism": "cardiac",
    "Stroke": "neuro", "Meningitis": "neuro", "Epilepsy": "neuro", "Migraine": "neuro", "Multiple Sclerosis": "neuro", "Parkinson's Disease": "neuro", "Alzheimer's Disease": "neuro",
    "Pneumonia": "respiratory", "Asthma": "respiratory", "Tuberculosis": "respiratory", "COVID-19": "respiratory", "Lung Cancer": "respiratory", "Common Cold": "respiratory", "Influenza (Flu)": "respiratory",
    "Type 1 Diabetes": "metabolic", "Type 2 Diabetes": "metabolic", "Hypothyroidism": "metabolic", "Hyperthyroidism": "metabolic", "Addison's Disease": "metabolic", "Cushing's Syndrome": "metabolic",
    "Gastroenteritis": "gi", "Peptic Ulcer Disease": "gi", "Irritable Bowel Syndrome": "gi", "Hepatitis B": "gi", "Hepatitis C": "gi", "Liver Cirrhosis": "gi", "Appendicitis": "gi", "Cholera": "gi", "Colorectal Cancer": "gi",
    "Chronic Kidney Disease": "kidney", "Kidney Stones": "kidney", "Urinary Tract Infection": "kidney",
    "Rheumatoid Arthritis": "musculo", "Gout": "musculo", "Osteoarthritis": "musculo", "Osteoporosis": "musculo",
    "Eczema (Atopic Dermatitis)": "skin", "Psoriasis": "skin", "Chickenpox": "skin",
    "Systemic Lupus Erythematosus": "skin",
    "Malaria": "infectious", "Dengue Fever": "infectious", "Typhoid Fever": "infectious", "Leptospirosis": "infectious", "Chikungunya": "infectious", "HIV/AIDS": "infectious",
    "Anemia (Iron Deficiency)": "hematologic", "Leukemia": "hematologic",
    "Anxiety Disorder": "psychiatric", "Major Depressive Disorder": "psychiatric",
}

def _plausibility_boost(disease: str, symptom_set: Set[str]) -> float:
    sys = _DIS_SYS.get(disease)
    if not sys:
        return 1.0
    key = _SYS.get(sys, set())
    if not key:
        return 1.0
    return 1.0 + (len(symptom_set & key) / len(key)) * 0.35


def _apply_confusion_rules(preds: List[Dict[str, Any]], symptom_set: Set[str]) -> List[Dict[str, Any]]:
    conf = {p["disease"]: p["confidence"] for p in preds}
    for r in _conf_rules:
        da, db, sym = r["disease_a"], r["disease_b"], r["key_symptom"]
        pen, sup = float(r.get("penalty", 0.25)), r.get("supports", "a")
        if da not in conf or db not in conf:
            continue
        if sup == "a":
            if sym not in symptom_set:
                conf[da] *= (1.0 - pen * 0.5)
            else:
                conf[db] *= (1.0 - pen * 0.3)
        else:
            if sym not in symptom_set:
                conf[db] *= (1.0 - pen * 0.5)
            else:
                conf[da] *= (1.0 - pen * 0.3)

    for p in preds:
        p["confidence"] = round(conf.get(p["disease"], p["confidence"]), 1)
    preds.sort(key=lambda x: x["confidence"], reverse=True)
    for i, p in enumerate(preds):
        p["rank"] = i + 1
    return preds


_KEY_SYMS = {
    "Meningitis": ["neck_stiffness", "severe_headache", "high_fever", "confusion", "petechiae"],
    "Dengue Fever": ["petechiae", "severe_headache", "high_fever", "joint_pain", "eye_redness", "skin_rash"],
    "Malaria": ["chills", "night_sweats", "high_fever", "muscle_pain"],
    "COVID-19": ["loss_of_taste", "loss_of_smell", "fever", "cough"],
    "Stroke": ["one_side_weakness", "speech_difficulty", "severe_headache"],
    "Pneumonia": ["productive_cough", "high_fever", "shortness_of_breath"],
    "Asthma": ["wheezing", "shortness_of_breath", "chest_tightness"],
    "Tuberculosis": ["hemoptysis", "night_sweats", "weight_loss", "productive_cough"],
    "Coronary Artery Disease": ["chest_pain", "shortness_of_breath", "cold_sweats", "palpitations"],
    "Heart Failure": ["leg_swelling", "shortness_of_breath", "fatigue", "reduced_urination"],
    "Type 2 Diabetes": ["excessive_thirst", "frequent_urination", "weight_loss", "slow_healing_wounds"],
    "Hepatitis B": ["jaundice", "dark_urine", "right_upper_quadrant_pain"],
    "Kidney Stones": ["flank_pain", "blood_in_urine", "nausea"],
    "Urinary Tract Infection": ["burning_urination", "frequent_urination", "fever"],
    "Hypothyroidism": ["cold_intolerance", "weight_gain", "hair_loss", "fatigue"],
    "Hyperthyroidism": ["heat_intolerance", "weight_loss", "rapid_heartbeat", "anxiety"],
    "Epilepsy": ["seizures", "loss_of_consciousness", "confusion"],
    "Migraine": ["severe_headache", "nausea", "blurred_vision"],
    "Anxiety Disorder": ["anxiety", "palpitations", "tremors", "dizziness"],
    "Anemia (Iron Deficiency)": ["fatigue", "general_weakness", "dizziness"],
    "Leukemia": ["frequent_infections", "petechiae", "fatigue"],
    "HIV/AIDS": ["frequent_infections", "weight_loss", "swollen_lymph_nodes"],
    "Chickenpox": ["skin_rash", "skin_itching", "fever"],
    "Chikungunya": ["joint_pain", "fever", "skin_rash"],
    "Typhoid Fever": ["high_fever", "constipation", "abdominal_pain", "malaise"],
}

FRIENDLY = {s: s.replace("_", " ").title() for s in ALL_SYMPTOM_COLS}
FRIENDLY.update({
    "high_fever": "High Fever", "shortness_of_breath": "Shortness of Breath",
    "chest_pain": "Chest Pain", "rapid_heartbeat": "Rapid Heartbeat", "leg_swelling": "Leg Swelling",
    "severe_headache": "Severe Headache", "loss_of_consciousness": "Loss of Consciousness",
    "one_side_weakness": "One-Sided Weakness", "speech_difficulty": "Speech Difficulty",
    "memory_problems": "Memory Problems", "abdominal_pain": "Abdominal Pain",
    "loss_of_appetite": "Loss of Appetite", "blood_in_stool": "Blood in Stool",
    "rectal_bleeding": "Rectal Bleeding", "difficulty_swallowing": "Difficulty Swallowing",
    "dark_urine": "Dark Urine", "pale_stools": "Pale Stools",
    "right_upper_quadrant_pain": "Right Upper Abdomen Pain", "flank_pain": "Flank/Kidney Pain",
    "blood_in_urine": "Blood in Urine", "burning_urination": "Burning Urination",
    "frequent_urination": "Frequent Urination", "reduced_urination": "Reduced Urination",
    "excessive_thirst": "Excessive Thirst", "weight_loss": "Weight Loss", "weight_gain": "Weight Gain",
    "heat_intolerance": "Heat Intolerance", "cold_intolerance": "Cold Intolerance",
    "increased_sweating": "Excessive Sweating", "excessive_fatigue": "Extreme Fatigue",
    "neck_stiffness": "Neck Stiffness", "bone_pain": "Bone Pain", "skin_rash": "Skin Rash",
    "skin_itching": "Skin Itching", "petechiae": "Petechiae (blood spots)", "skin_lesions": "Skin Lesions",
    "hair_loss": "Hair Loss", "yellow_eyes": "Yellow Eyes", "blurred_vision": "Blurred Vision",
    "eye_redness": "Eye Redness", "swollen_lymph_nodes": "Swollen Lymph Nodes",
    "sore_throat": "Sore Throat", "loss_of_smell": "Loss of Smell", "loss_of_taste": "Loss of Taste",
    "mood_changes": "Mood Changes", "general_weakness": "General Weakness",
    "malaise": "Malaise (feeling unwell)", "slow_healing_wounds": "Slow-Healing Wounds",
    "frequent_infections": "Frequent Infections", "joint_pain": "Joint Pain", "muscle_pain": "Muscle Pain",
    "back_pain": "Back Pain",
})

def _explain(disease: str, symptom_set: Set[str]) -> List[str]:
    key = _KEY_SYMS.get(disease, [])
    matched = [FRIENDLY.get(s, s.replace("_", " ").title()) for s in key if s in symptom_set]
    if matched:
        return [f"Key symptoms matched: {', '.join(matched[:4])}"]
    return [f"✓ {FRIENDLY.get(s, '?')}" for s in list(symptom_set)[:3]]


def build_feat_vec(syms: dict, vitals: dict, age: Optional[float] = None, gender: Optional[int] = None) -> np.ndarray:
    """Build canonical 183-feature vector ensuring 100% parity with training schema."""
    row = {f: 0.0 for f in ALL_SYMPTOM_COLS}
    row.update({k: float(v) for k, v in syms.items()})
    row.update({k: float(v) for k, v in vitals.items()})
    if age is not None:
        row["age"] = float(age)
    if gender is not None:
        row["gender"] = float(gender)
    row.setdefault("body_temperature_celsius", 37.0)
    row.setdefault("heart_rate_bpm", 75.0)
    row.setdefault("blood_pressure_systolic_mmhg", 120.0)
    row.setdefault("blood_sugar_fasting_mgdl", 90.0)
    row.setdefault("oxygen_saturation_pct", 98.0)
    row.setdefault("bmi", 22.0)
    row.setdefault("age", 35.0)

    df = pd.DataFrame([row])
    df = build_features(df)
    df = align_to_feature_names(df, _fnames)
    return df.values[0].astype(np.float64)


def _ensemble_proba(feat_vec: np.ndarray) -> np.ndarray:
    proba = np.zeros(len(_le.classes_))
    fdf = pd.DataFrame([feat_vec], columns=_fnames)
    for m, w in zip(_models, _weights):
        proba += w * m.predict_proba(fdf)[0]
    return proba


MIN_CONF = 0.10
TOP_N_OUT = 5


def predict_from_text(
    text: str,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    extra_symptoms: Optional[dict] = None,
    extra_vitals: Optional[dict] = None,
    prior_symptoms: Optional[dict] = None,
    question_known_extra: Optional[set] = None,
) -> Dict[str, Any]:
    """Execute end-to-end clinical assessment from free text."""
    gender_enc = 1 if (gender or "").lower() == "male" else 0

    # 1. NLP symptom & vitals extraction
    if prior_symptoms is not None:
        syms = {k: int(v) for k, v in prior_symptoms.items() if int(v) != 0}
        for k, v in extract_symptoms(text).items():
            if v:
                syms[k] = v
    else:
        syms = extract_symptoms(text)

    if extra_symptoms:
        for k, v in extra_symptoms.items():
            if int(v) != 0 and k not in syms:
                syms[k] = v

    vitals = parse_vitals(text)
    if extra_vitals:
        for k, v in extra_vitals.items():
            if v is not None and v != "":
                try:
                    vitals[k] = float(v)
                except (TypeError, ValueError):
                    vitals[k] = v
    if age is None and "age" in vitals:
        age = int(vitals["age"])
    if age is not None:
        vitals["age"] = float(age)
    symptom_set = set(syms.keys())

    # 2. Emergency & Triage Check
    emergency = check_emergency(symptom_set, vitals)
    triage_early = compute_triage(symptom_set, vitals)
    emergency_short_circuit = False
    saved_triage = triage_early
    if emergency or triage_early.get("level") in ("CRITICAL", "SEVERE"):
        emergency_short_circuit = True

    prelim_critical = None
    if emergency_short_circuit:
        if "chest_pain" in symptom_set or ("cold_sweats" in symptom_set and "chest_pain" in symptom_set):
            prelim_critical = {"disease": "Possible Myocardial Infarction", "confidence": 85.0, "doctor": "Emergency / Critical Care", "why": ["Emergency triage pattern matched"]}
        elif "one_side_weakness" in symptom_set or "speech_difficulty" in symptom_set:
            prelim_critical = {"disease": "Possible Stroke (CVA)", "confidence": 92.0, "doctor": "Neurologist", "why": ["Emergency triage pattern matched"]}
        elif "neck_stiffness" in symptom_set and "severe_headache" in symptom_set:
            prelim_critical = {"disease": "Possible Meningitis", "confidence": 90.0, "doctor": "Infectious Diseases / Neurology", "why": ["Emergency triage pattern matched"]}
        elif "shortness_of_breath" in symptom_set and vitals.get("oxygen_saturation_pct", 99) < 92:
            prelim_critical = {"disease": "Severe Respiratory Compromise", "confidence": 88.0, "doctor": "Pulmonology / Critical Care", "why": ["Low SpO2 and respiratory distress"]}

    # 3. Canonical feature vector construction
    feat_vec = build_feat_vec(syms, vitals, age, gender_enc)

    # 4. Ensemble ML prediction
    proba = _ensemble_proba(feat_vec)
    top_idx = np.argsort(proba)[::-1][:12]
    raw = []
    for i in top_idx:
        conf = float(proba[i])
        if conf < MIN_CONF:
            break
        dis = _le.classes_[i]
        adj = min(conf * _plausibility_boost(dis, symptom_set), 0.99)
        raw.append({
            "rank": len(raw) + 1,
            "disease": dis,
            "confidence": round(adj * 100, 1),
            "doctor": get_specialist(dis),
            "why": _explain(dis, symptom_set),
        })

    # 5. Confusion rules optimization
    if len(raw) >= 2:
        raw = _apply_confusion_rules(raw, symptom_set)

    shown = raw[:TOP_N_OUT]
    if shown:
        s = sum(p["confidence"] for p in shown)
        if s > 1e-9:
            for i, p in enumerate(shown):
                p["confidence"] = round(100.0 * p["confidence"] / s, 1)
                p["rank"] = i + 1
    predictions = shown

    if emergency_short_circuit:
        if predictions:
            critical_prediction = predictions[0]
            predictions = [critical_prediction]
        else:
            critical_prediction = prelim_critical
            if prelim_critical:
                predictions = [prelim_critical]
        triage = saved_triage
        if emergency:
            triage["level"] = "CRITICAL"
            triage["advice"] = emergency["action"]
    else:
        critical_prediction = None
        triage = compute_triage(symptom_set, vitals)
        if emergency:
            triage["level"] = "CRITICAL"
            triage["advice"] = emergency["action"]

    # 6. Uncertainty & Follow-up question
    uncertain = is_uncertain(predictions)
    fup_q = None
    known_for_q = set(symptom_set)
    if question_known_extra:
        known_for_q |= set(question_known_extra)
    if uncertain and not emergency:
        fup_q = generate_best_question(predictions, known_for_q)
        if fup_q is None:
            fup_q = shap_question(_models, _weights, feat_vec, _fnames, known_for_q)

    top_disease = predictions[0]["disease"] if predictions else None

    return {
        "predictions": predictions,
        "critical_prediction": critical_prediction if critical_prediction is not None else prelim_critical,
        "triage": triage,
        "severity": triage,
        "emergency": emergency,
        "detected_symptoms": sorted([FRIENDLY.get(s, s.replace("_", " ").title()) for s in symptom_set]),
        "total_symptoms": len(symptom_set),
        "symptom_dict": syms,
        "vitals": vitals,
        "uncertain": uncertain,
        "entropy": round(calculate_entropy(predictions), 3),
        "follow_up": {
            "needs_follow_up": uncertain and fup_q is not None and not emergency,
            "question": fup_q.get("question") if fup_q else None,
            "symptom_a": fup_q.get("symptom_a") if fup_q else None,
            "type": fup_q.get("type", "text") if fup_q else "text",
            "options": fup_q.get("options", []) if fup_q else [],
            "hint": fup_q.get("hint", "") if fup_q else "",
        },
        "tests": get_tests(top_disease) if top_disease else [],
        "diet": get_diet(top_disease) if top_disease else "",
        "recovery": get_recovery(top_disease) if top_disease else "",
        "top_specialist": predictions[0]["doctor"] if predictions else "General Physician",
        "disclaimer": CLINICAL_DISCLAIMER,
    }


def start_session_predict(text: str, age: Optional[int] = None, gender: Optional[str] = None) -> Dict[str, Any]:
    """Initiate a multi-turn diagnostic session."""
    result = predict_from_text(text, age=age, gender=gender)
    sid = create_session(
        result["symptom_dict"],
        result["vitals"],
        result["predictions"],
        chief_text=text,
        age=age,
        gender=gender,
    )
    set_followup_pending(sid, result["follow_up"])
    result["session_id"] = sid
    return result


def followup_predict(session_id: str, answer_text: str) -> Dict[str, Any]:
    """Advance diagnostic interview with patient follow-up reply."""
    sess = get_session(session_id)
    if not sess:
        return predict_from_text(answer_text)

    pending_sym = sess.get("pending_symptom_a")
    pending_q = sess.get("pending_question")
    append_qa_history(session_id, pending_q, answer_text)
    mark_symptom_addressed(session_id, pending_sym)

    adds, removals = interpret_followup_answer(answer_text, pending_sym)

    merged = {k: int(v) for k, v in sess["symptoms"].items() if int(v) != 0}
    for key in removals:
        merged.pop(key, None)
    merged.update(adds)

    chief = (sess.get("chief_text") or "").strip()
    combined_text = (
        f"{chief}\nFollow-up ({sess.get('step', 0) + 1}): {answer_text}".strip()
        if chief else answer_text
    )

    merged_vit = dict(sess.get("vitals") or {})
    merged_vit.update(parse_vitals(combined_text))

    sess_age = sess.get("age")
    sess_gender = sess.get("gender")

    result = predict_from_text(
        combined_text,
        age=sess_age if sess_age is not None else None,
        gender=sess_gender if sess_gender not in (None, "") else None,
        prior_symptoms=merged,
        extra_vitals=merged_vit,
        question_known_extra=sess.get("asked"),
    )
    result["vitals"] = merged_vit

    update_session(session_id, result["symptom_dict"], merged_vit, result["predictions"])
    set_followup_pending(session_id, result["follow_up"])

    updated = get_session(session_id)
    if updated and should_stop(updated["step"], result["predictions"]):
        result["follow_up"]["needs_follow_up"] = False
        result["follow_up"]["question"] = None
        result["follow_up"]["symptom_a"] = None
        set_followup_pending(session_id, result["follow_up"])

    result["session_id"] = session_id
    return result
