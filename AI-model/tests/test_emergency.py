"""
Unit Tests for Safety-Critical Emergency & Triage Logic
"""

from src.core.emergency import check_emergency, compute_triage


def test_cardiac_emergency_trigger():
    symptoms = {"chest_pain", "cold_sweats", "shortness_of_breath"}
    vitals = {"heart_rate_bpm": 120, "blood_pressure_systolic_mmhg": 165}
    em = check_emergency(symptoms, vitals)
    assert em is not None
    assert em["triggered"] is True
    assert "Cardiac" in em["name"]


def test_stroke_alert_trigger():
    symptoms = {"one_side_weakness", "speech_difficulty"}
    vitals = {}
    em = check_emergency(symptoms, vitals)
    assert em is not None
    assert "Stroke" in em["name"]


def test_meningitis_alert_trigger():
    symptoms = {"neck_stiffness", "severe_headache", "high_fever"}
    vitals = {}
    em = check_emergency(symptoms, vitals)
    assert em is not None
    assert "Meningitis" in em["name"]


def test_critical_hypoxia_trigger():
    symptoms = {"shortness_of_breath", "cough"}
    vitals = {"oxygen_saturation_pct": 87.0}
    em = check_emergency(symptoms, vitals)
    assert em is not None
    assert "Oxygen" in em["name"]


def test_triage_scoring_levels():
    # Mild
    triage_mild = compute_triage({"fever"}, {})
    assert triage_mild["level"] in ("MILD", "MODERATE")

    # Critical
    triage_crit = compute_triage({"loss_of_consciousness", "chest_pain"}, {"oxygen_saturation_pct": 88.0})
    assert triage_crit["level"] == "CRITICAL"
    assert triage_crit["score"] >= 10
