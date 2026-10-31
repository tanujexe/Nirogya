"""
MediSense AI — Prediction Engine Proxy
======================================
Redirects to src.core.predictor for backward compatibility.
"""

from src.core.predictor import (
    predict_from_text,
    start_session_predict,
    followup_predict,
    check_emergency,
    compute_triage,
    build_feat_vec as _build_feat_vec,
    _ensemble_proba,
    CLINICAL_DISCLAIMER,
)

__all__ = [
    "predict_from_text",
    "start_session_predict",
    "followup_predict",
    "check_emergency",
    "compute_triage",
    "_build_feat_vec",
    "_ensemble_proba",
    "CLINICAL_DISCLAIMER",
]

if __name__ == "__main__":
    tests = [
        ("Meningitis", "high fever 39°C, severe headache, stiff neck, confusion. Age 28, HR 115"),
        ("Stroke", "one side weakness, slurred speech, face drooping. Age 60, BP 180/100"),
        ("Dengue", "petechiae, high fever, severe headache, joint pain, eye redness"),
        ("Malaria", "high fever with chills, night sweats, muscle pain. Age 30"),
        ("COVID-19", "loss of taste, loss of smell, fever, cough. SpO2 94%"),
        ("Diabetes", "excessive thirst, frequent urination, weight loss. sugar 320"),
        ("Hinglish", "mujhe tez bukhar hai aur gardan hilana mushkil hai. sir mein bahut dard"),
        ("Cardiac", "chest pain cold sweats shortness of breath. Age 52, HR 130, BP 170"),
    ]
    print("\n" + "=" * 70)
    print("  MediSense AI v11.1 — Self-Test")
    print("=" * 70)
    for label, t in tests:
        r = predict_from_text(t)
        em = f" 🚨{r['emergency']['name']}" if r["emergency"] else ""
        print(f"\n[{label}] {t[:55]}")
        print(f"  Triage:{r['triage']['level']}  Syms:{r['total_symptoms']}  Entropy:{r['entropy']}{em}")
        for p in r["predictions"]:
            print(f"  #{p['rank']} {p['disease']:<44} {p['confidence']}%")
        if r["follow_up"]["question"]:
            print(f"  ❓ {r['follow_up']['question']}")
