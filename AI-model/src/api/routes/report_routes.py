"""
MediSense AI — Laboratory Report Analysis API Route
===================================================
Handles POST /analyze-report for image and PDF documents.
"""

import os
import traceback
from datetime import datetime
from flask import Blueprint, request, jsonify

from config.settings import UPLOAD_DIR
from src.ocr.tesseract_engine import extract_text_from_file
from src.ocr.lab_parser import (
    extract_lab_values,
    extract_lab_data,
    analyze_lab_findings,
    predict_conditions_from_findings,
)
from src.core.specialist_matcher import get_doctor_recommendations

report_bp = Blueprint("report_bp", __name__)


@report_bp.route("/analyze-report", methods=["POST"])
def analyze_report():
    try:
        gender = request.form.get("gender") or request.form.get("sex")
        age = request.form.get("age")
        dob = request.form.get("dob") or request.form.get("date_of_birth")
        extra = request.form.get("symptoms", "").strip()

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded. Please select an image or PDF."}), 400

        file = request.files["file"]
        if not file or not file.filename:
            return jsonify({"error": "Empty file received."}), 400

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in (".jpg", ".jpeg", ".png", ".pdf", ".bmp", ".tiff", ".tif", ".webp"):
            return jsonify({"error": "Unsupported file format. Upload JPG, PNG, or PDF."}), 400

        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        save_path = os.path.join(UPLOAD_DIR, f"report_{ts}{ext}")
        file.save(save_path)

        if not os.path.exists(save_path):
            return jsonify({"error": "File could not be saved. Check server write permissions."}), 500

        raw_text = extract_text_from_file(save_path)
        lab_data = extract_lab_data(raw_text)
        lab_values = lab_data["values"]
        extracted_meta = lab_data["meta"]
        report_demographics = lab_data.get("demographics", {})

        findings = analyze_lab_findings(
            lab=lab_values,
            gender=gender,
            extracted_meta=extracted_meta,
            raw_text=raw_text,
            patient_age=age,
            patient_dob=dob,
            patient_sex=gender,
        )
        lab_predictions = predict_conditions_from_findings(findings, patient_symptoms=extra, raw_text=raw_text)

        if not lab_predictions:
            if findings:
                all_normal = all(f["status"] == "normal" for f in findings)
                if all_normal:
                    lab_predictions = [{
                        "rank": 1,
                        "disease": "No Significant Abnormalities Detected",
                        "doctor": "General Physician",
                        "confidence": 95.0,
                        "why": ["All extracted values are within normal reference ranges."],
                    }]
                else:
                    lab_predictions = [{
                        "rank": 1,
                        "disease": "Nonspecific Findings",
                        "doctor": "General Physician",
                        "confidence": 70.0,
                        "why": ["Some values are outside normal ranges but don't match a specific pattern."],
                    }]
            elif len(raw_text.strip()) > 40 and not raw_text.startswith("[Could not extract") and not raw_text.startswith("[OCR error"):
                lab_predictions = [{
                    "rank": 1,
                    "disease": "General Clinical Evaluation Required",
                    "doctor": "General Physician",
                    "confidence": 60.0,
                    "why": ["Document text extracted, but standard biochemical/hematology markers were not detected. Please verify the report type."],
                }]
            else:
                return jsonify({
                    "error": "Could not extract readable text or lab findings from this document. Please ensure your PDF or image is clear, right-side up, and well-lit.",
                    "extracted_text": raw_text,
                    "lab_values": {},
                    "findings": [],
                    "predictions": [],
                }), 422

        has_abnormal = any(f.get("status") != "normal" for f in findings)
        return jsonify({
            "saved_file": os.path.basename(save_path),
            "saved_path": save_path,
            "extracted_text": raw_text[:2500],
            "lab_values": lab_values,
            "findings": findings,
            "disease_hints": [p["disease"] for p in lab_predictions],
            "ml_prediction": lab_predictions,
            "predictions": lab_predictions,
            "doctor_recommendations": get_doctor_recommendations(lab_predictions) if lab_predictions else None,
            "triage": {"level": "MODERATE", "advice": "Monitor symptoms"} if has_abnormal else {"level": "ROUTINE", "advice": "No urgent action needed"},
            "patient_demographics": {
                "age": age or report_demographics.get("age"),
                "sex": gender or report_demographics.get("sex"),
                "dob": dob or report_demographics.get("dob"),
                "demographic_source": "user_provided" if (age or gender or dob) else report_demographics.get("source", "none"),
            },
            "disclaimer": "Lab report analysis is for reference only. Always consult a qualified doctor for diagnosis.",
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Report analysis failed: {str(e)}"}), 500
