"""
MediSense AI — Prediction and Follow-up API Routes
==================================================
Handles /predict and /follow_up endpoints.
"""

import traceback
from flask import Blueprint, request, jsonify

from src.core.predictor import start_session_predict, followup_predict
from src.core.specialist_matcher import get_doctor_recommendations
from src.nlp.extractor import normalize_input_text, extract_symptoms

prediction_bp = Blueprint("prediction_bp", __name__)


def _build_warning(result: dict) -> str | None:
    em = result.get("emergency")
    if em and em.get("triggered"):
        return f"EMERGENCY: {em['name']}. {em['action']}."
    lvl = result.get("triage", {}).get("level")
    if lvl == "CRITICAL":
        return "CRITICAL - go to emergency immediately."
    if lvl == "SEVERE":
        return "SEVERE - visit hospital today."
    return None


def _followup_tips(detected: list, triage_level: str) -> list:
    lower = [s.lower() for s in detected]
    tips = []
    if any(x in lower for x in ["chest pain"]):
        tips.append("Does the chest pain spread to your left arm or jaw?")
    if any(x in lower for x in ["fever", "high fever"]):
        tips.append("How many days have you had fever?")
    if "shortness of breath" in lower:
        tips.append("Are you breathless at rest or only during activity?")
    if any(x in lower for x in ["severe headache", "headache"]):
        tips.append("Is this the worst headache you've ever had?")
    if any(x in lower for x in ["diarrhea", "diarrhoea", "vomiting"]):
        tips.append("Are you able to keep fluids down?")
    if triage_level in ("CRITICAL", "SEVERE"):
        tips = ["Please ask someone to stay with you right now."] + tips
    return tips[:4]


@prediction_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True) or {}
        text = str(data.get("text", "")).strip()
        if len(text) < 3:
            return jsonify({"error": "Please describe your symptoms in more detail."}), 400

        normalized = normalize_input_text(text)
        pre_syms = extract_symptoms(normalized)
        if not pre_syms:
            return jsonify({
                "error": (
                    "Could not identify symptoms. Please describe clear medical symptoms, "
                    "for example: 'high fever, severe headache, stiff neck for 2 days' or "
                    "Hindi/Hinglish: 'mujhe tez bukhar hai aur gardan akad gayi hai'."
                )
            }), 422

        age = data.get("age")
        if age in ("", None):
            age = None
        else:
            try:
                age = float(age)
            except Exception:
                age = None

        gender = data.get("gender")
        if gender in ("", None):
            gender = None

        spo2 = data.get("spo2")
        if spo2 in ("", None):
            spo2 = None
        else:
            try:
                spo2 = float(spo2)
            except Exception:
                spo2 = None

        if spo2:
            text += f" SpO2 {spo2}%"

        result = start_session_predict(text, age=age, gender=gender)

        if not result["predictions"]:
            return jsonify({
                "error": (
                    "Could not identify symptoms. Try: 'I have fever, severe headache "
                    "and stiff neck for 2 days, age 28' or Hindi: "
                    "'mujhe tez bukhar hai aur gardan akad gayi hai'"
                )
            }), 422

        resp = {
            "predictions": result["predictions"],
            "detected_symptoms": result["detected_symptoms"],
            "total_symptoms": result["total_symptoms"],
            "normalized_text": normalize_input_text(text),
            "triage": result["triage"],
            "severity": result["triage"],
            "emergency": result["emergency"],
            "warning": _build_warning(result),
            "follow_up": result["follow_up"],
            "entropy": result["entropy"],
            "session_id": result.get("session_id"),
            "tests": result["tests"],
            "diet": result["diet"],
            "recovery": result["recovery"],
            "doctor_recommendations": get_doctor_recommendations(result["predictions"]),
            "follow_up_questions": _followup_tips(result["detected_symptoms"], result["triage"]["level"]),
            "disclaimer": result.get("disclaimer"),
        }
        return jsonify(resp)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@prediction_bp.route("/follow_up", methods=["POST"])
def follow_up():
    try:
        data = request.get_json(force=True) or {}
        sid = data.get("session_id", "").strip()
        answer = str(data.get("answer", "")).strip()
        if not sid:
            return jsonify({"error": "session_id required"}), 400
        if len(answer) < 2:
            return jsonify({"error": "Please provide an answer"}), 400

        result = followup_predict(sid, answer)
        if not result.get("predictions"):
            return jsonify({"error": "Could not update prediction from your answer"}), 422

        resp = {
            "predictions": result["predictions"],
            "detected_symptoms": result["detected_symptoms"],
            "total_symptoms": result["total_symptoms"],
            "normalized_text": normalize_input_text(answer),
            "triage": result["triage"],
            "severity": result["triage"],
            "emergency": result["emergency"],
            "warning": _build_warning(result),
            "follow_up": result["follow_up"],
            "entropy": result["entropy"],
            "session_id": result.get("session_id", sid),
            "tests": result["tests"],
            "diet": result["diet"],
            "recovery": result["recovery"],
            "doctor_recommendations": get_doctor_recommendations(result["predictions"]),
            "follow_up_questions": _followup_tips(result["detected_symptoms"], result["triage"]["level"]),
            "updated": True,
            "disclaimer": result.get("disclaimer"),
        }
        return jsonify(resp)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Follow-up failed: {str(e)}"}), 500
