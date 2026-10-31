"""
MediSense AI — System & Utility Routes
======================================
Handles /health, /normalize-input, and index rendering.
"""

from flask import Blueprint, request, jsonify, render_template
from src.nlp.extractor import normalize_input_text

system_bp = Blueprint("system_bp", __name__)


@system_bp.route("/", methods=["GET"])
def serve_index():
    try:
        return render_template("index.html")
    except Exception:
        return jsonify({"service": "MediSense AI", "status": "running", "version": "11.1"})


@system_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "MediSense AI",
        "version": "11.1",
    })


@system_bp.route("/normalize-input", methods=["POST"])
def normalize_input():
    try:
        data = request.get_json(force=True) or {}
        text = str(data.get("text", "")).strip()
        normalized = normalize_input_text(text)
        return jsonify({"normalized_text": normalized})
    except Exception as e:
        return jsonify({"error": f"Normalization failed: {str(e)}"}), 500
