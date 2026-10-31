"""
Unit Tests for NLP Symptom & Vital Sign Extraction
"""

from src.nlp.extractor import (
    extract_symptoms,
    parse_vitals,
    normalize_input_text,
    interpret_followup_answer,
)


def test_english_symptom_extraction():
    text = "I have high fever, severe headache, and stiff neck."
    syms = extract_symptoms(text)
    assert "high_fever" in syms or "fever" in syms
    assert "severe_headache" in syms or "headache" in syms
    assert "neck_stiffness" in syms


def test_hinglish_symptom_extraction():
    text = "mujhe tez bukhar hai aur gardan akad gayi hai, sir mein bahut dard hai"
    syms = extract_symptoms(text)
    assert "high_fever" in syms or "fever" in syms
    assert "neck_stiffness" in syms
    assert "severe_headache" in syms or "headache" in syms


def test_negation_handling():
    text = "I have severe headache, but no fever and no chest pain"
    syms = extract_symptoms(text)
    assert "severe_headache" in syms or "headache" in syms
    assert "fever" not in syms
    assert "high_fever" not in syms
    assert "chest_pain" not in syms


def test_vital_sign_extraction():
    text = "Patient is 45 year old, BP 145/90, HR 112 bpm, SpO2 93%, temp 39.2 C"
    v = parse_vitals(text)
    assert v.get("age") == 45
    assert v.get("blood_pressure_systolic_mmhg") == 145
    assert v.get("heart_rate_bpm") == 112
    assert v.get("oxygen_saturation_pct") == 93.0
    assert v.get("body_temperature_celsius") == 39.2


def test_followup_interpretation():
    adds, rems = interpret_followup_answer("Yes, definitely having chills", "chills")
    assert adds.get("chills") == 1
    assert rems == []

    adds, rems = interpret_followup_answer("Nahi, bilkul nahi", "chills")
    assert adds == {}
    assert "chills" in rems
