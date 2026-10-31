"""
MediSense AI — Diagnostic Session Manager & Clinical Protocol Logic
===================================================================
Manages diagnostic uncertainty, entropy calculation, expert/SHAP follow-up questions,
and clinical tests/diet/recovery recommendations loaded from configuration.
"""

from typing import List, Dict, Set, Any, Optional
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

from config.settings import BASE_DIR, ARTIFACTS_DIR
from src.storage.session_store import session_store

# Load medical protocols
_PROTOCOLS_FILE = BASE_DIR / "config" / "medical_protocols.json"
_PROTOCOLS: Dict[str, Any] = {}
if _PROTOCOLS_FILE.exists():
    try:
        with open(_PROTOCOLS_FILE, "r", encoding="utf-8") as f:
            _PROTOCOLS = json.load(f)
    except Exception:
        pass

EXPERT_QUESTIONS = _PROTOCOLS.get("expert_questions", [])
TEST_MAP = _PROTOCOLS.get("tests", {})
DIET_MAP = _PROTOCOLS.get("diet", {})
RECOVERY_MAP = _PROTOCOLS.get("recovery", {})

_PROFILE: Optional[pd.DataFrame] = None


def load_disease_profile() -> Optional[pd.DataFrame]:
    """Load pre-computed disease symptom frequency profile."""
    global _PROFILE
    if _PROFILE is not None:
        return _PROFILE
    path = ARTIFACTS_DIR / "disease_symptom_profile.pkl"
    if path.exists():
        try:
            with open(path, "rb") as f:
                _PROFILE = pickle.load(f)
        except Exception:
            pass
    return _PROFILE


def get_expert_question(da: str, db: str) -> Optional[Dict[str, Any]]:
    """Retrieve curated clinician question between two candidate diseases."""
    da_clean, db_clean = da.lower().strip(), db.lower().strip()
    for item in EXPERT_QUESTIONS:
        p1, p2 = item["pair"][0].lower(), item["pair"][1].lower()
        if (da_clean == p1 and db_clean == p2) or (da_clean == p2 and db_clean == p1):
            return {
                "question": item["question"],
                "symptom_a": item["sym"],
                "type": item.get("type", "text"),
                "options": item.get("options", []),
                "hint": item.get("hint", ""),
            }

    # Partial prefix match fallback
    for item in EXPERT_QUESTIONS:
        p1_w, p2_w = item["pair"][0].split()[0].lower(), item["pair"][1].split()[0].lower()
        if (p1_w in da_clean and p2_w in db_clean) or (p1_w in db_clean and p2_w in da_clean):
            return {
                "question": item["question"],
                "symptom_a": item["sym"],
                "type": item.get("type", "text"),
                "options": item.get("options", []),
                "hint": item.get("hint", ""),
            }
    return None


def auto_question(da: str, db: str, known: Set[str]) -> Optional[Dict[str, Any]]:
    """Data-driven discriminating question based on profile differences."""
    profile = load_disease_profile()
    if profile is None or da not in profile.index or db not in profile.index:
        return None
    diff = (profile.loc[da] - profile.loc[db]).abs().sort_values(ascending=False)
    for sym, score in diff.items():
        if score < 0.10 or sym in known:
            continue
        return {
            "question": f"Do you experience {sym.replace('_', ' ')}?",
            "symptom_a": sym,
            "type": "radio",
            "options": ["Yes, significantly", "Mildly", "No"],
            "hint": f"This symptom helps differentiate between {da} and {db}.",
        }
    return None


def calculate_entropy(predictions: List[Dict[str, Any]]) -> float:
    """Calculate Shannon entropy across top predictions."""
    if not predictions:
        return 0.0
    probs = np.array([p["confidence"] / 100.0 for p in predictions])
    probs = np.clip(probs / probs.sum(), 1e-9, 1.0)
    return float(-np.sum(probs * np.log(probs)))


def is_uncertain(predictions: List[Dict[str, Any]]) -> bool:
    """Evaluate whether top predictions require further differential interview."""
    if len(predictions) < 2:
        return False
    gap = predictions[0]["confidence"] - predictions[1]["confidence"]
    return (gap < 15 or calculate_entropy(predictions) > 0.80) and predictions[0]["confidence"] < 92


def should_stop(step: int, predictions: List[Dict[str, Any]], max_steps: int = 4) -> bool:
    """Determine if multi-turn diagnostic interview has reached confident resolution."""
    if step >= max_steps or not predictions:
        return True
    if predictions[0]["confidence"] > 92:
        return True
    if len(predictions) >= 2 and (predictions[0]["confidence"] - predictions[1]["confidence"]) > 25:
        return True
    return False


def generate_best_question(predictions: List[Dict[str, Any]], known: Set[str]) -> Optional[Dict[str, Any]]:
    """Select the most informative follow-up question."""
    if len(predictions) < 2:
        return None
    d1, d2 = predictions[0]["disease"], predictions[1]["disease"]
    q = get_expert_question(d1, d2)
    if q and q.get("symptom_a") in known:
        q = None
    if q is None:
        q = auto_question(d1, d2, known)
    if q is None:
        gap = abs(predictions[0]["confidence"] - predictions[1]["confidence"])
        if gap < 12:
            return {
                "question": "Can you tell me more about any other discomforts you're feeling?",
                "symptom_a": None,
                "type": "text",
                "options": [],
                "hint": "Any detail can help the AI narrow down the possibilities.",
            }
    return q


def shap_question(models, weights, feat_vec, feature_names, known: Set[str]) -> Optional[Dict[str, Any]]:
    """Generate SHAP-based feature importance follow-up question."""
    try:
        import shap
        from src.core.features import ALL_SYMPTOM_COLS
        base = models[0]
        explainer = shap.TreeExplainer(getattr(base, "estimator", base))
        shap_values = explainer.shap_values(feat_vec.reshape(1, -1))
        pred_cls = int(np.argmax(np.sum([w * m.predict_proba(feat_vec.reshape(1, -1))[0]
                                         for m, w in zip(models, weights)], axis=0)))
        vals = shap_values[pred_cls][0] if isinstance(shap_values, list) else shap_values[0]
        for feat, imp in sorted(zip(feature_names, vals), key=lambda x: abs(x[1]), reverse=True):
            if abs(imp) < 0.04:
                break
            if feat not in ALL_SYMPTOM_COLS or feat in known:
                continue
            return {
                "question": f"Do you have {feat.replace('_', ' ')}? (important for your diagnosis)",
                "symptom_a": feat,
                "type": "yesno",
                "options": ["Yes", "No"],
                "hint": "This feature carries high diagnostic weight.",
            }
    except Exception:
        pass
    return None


def get_tests(disease: str) -> List[str]:
    return TEST_MAP.get(disease, ["General blood tests (CBC)", "Consult a physician for specific tests"])


def get_diet(disease: str) -> str:
    return DIET_MAP.get(disease, "Balanced diet with adequate fluids. Avoid junk and processed food. Rest well.")


def get_recovery(disease: str) -> str:
    return RECOVERY_MAP.get(disease, "Follow doctor's prescription completely. Rest. Monitor symptoms. Return if worsening.")


# ─── SESSION WRAPPERS ─────────────────────────────────────────────────────────

def create_session(symptoms: dict, vitals: dict, predictions: list,
                   chief_text: str = "", age: Optional[int] = None, gender: Optional[str] = None) -> str:
    return session_store.create_session({
        "symptoms": dict(symptoms),
        "vitals": dict(vitals),
        "predictions": predictions,
        "step": 0,
        "asked": set(),
        "pending_question": None,
        "pending_symptom_a": None,
        "qa_history": [],
        "chief_text": (chief_text or "").strip(),
        "age": age,
        "gender": gender,
    })


def update_session(sid: str, new_syms: dict, new_vits: dict, new_preds: list) -> Optional[dict]:
    sess = session_store.get_session(sid)
    if not sess:
        return None
    sess["symptoms"].update(new_syms)
    sess["vitals"].update(new_vits)
    sess["predictions"] = new_preds
    sess["step"] += 1
    return session_store.update_session(sid, sess)


def get_session(sid: str) -> Optional[dict]:
    return session_store.get_session(sid)


def set_followup_pending(sid: str, follow_up: Optional[dict]) -> None:
    sess = session_store.get_session(sid)
    if not sess:
        return
    follow_up = follow_up or {}
    needs = bool(follow_up.get("needs_follow_up"))
    q = follow_up.get("question") if needs else None
    sym = follow_up.get("symptom_a") if needs else None
    sess["pending_question"] = q
    sess["pending_symptom_a"] = sym
    if sym:
        sess.setdefault("asked", set()).add(sym)
    session_store.update_session(sid, sess)


def mark_symptom_addressed(sid: str, symptom: Optional[str]) -> None:
    if not symptom:
        return
    sess = session_store.get_session(sid)
    if not sess:
        return
    sess.setdefault("asked", set()).add(symptom)
    session_store.update_session(sid, sess)


def append_qa_history(sid: str, question: Optional[str], answer: Optional[str]) -> None:
    sess = session_store.get_session(sid)
    if not sess:
        return
    q = (question or "").strip()
    a = (answer or "").strip()
    if not q and not a:
        return
    sess.setdefault("qa_history", []).append({"question": q, "answer": a})
    session_store.update_session(sid, sess)
