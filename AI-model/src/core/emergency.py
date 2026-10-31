"""
MediSense AI — Emergency Detection & Clinical Triage
=====================================================
Heuristic rule-based safety screening that runs BEFORE probabilistic ML ranking.
Detects Acute Coronary Syndrome (ACS), Stroke, Meningitis, Severe Hypoxia, etc.
"""

from typing import Dict, Set, Any, Optional

def _acs_trigger(v: Dict[str, float], ss: Set[str]) -> bool:
    if v.get("heart_rate_bpm", 75) > 110 or v.get("blood_pressure_systolic_mmhg", 120) > 160:
        return True
    if "cold_sweats" in ss or "shortness_of_breath" in ss:
        return True
    cardio = sum(1 for x in ("nausea", "palpitations", "rapid_heartbeat") if x in ss)
    return cardio >= 2


def _hypoxia_trigger(v: Dict[str, float], ss: Set[str]) -> bool:
    spo2 = float(v.get("oxygen_saturation_pct", 99))
    if spo2 < 92:
        return True
    if spo2 <= 93 and ss & {"shortness_of_breath", "confusion"}:
        return True
    return False


EMERGENCIES = [
    {
        "name": "Cardiac Emergency (Possible Heart Attack)",
        "must": ["chest_pain"],
        "any": ["shortness_of_breath", "rapid_heartbeat", "cold_sweats", "nausea", "palpitations"],
        "vfn": _acs_trigger,
        "action": "🚨 Call emergency services immediately — do NOT drive yourself",
    },
    {
        "name": "Stroke Alert (Act FAST)",
        "must": ["one_side_weakness"],
        "any": ["speech_difficulty", "dizziness", "severe_headache", "confusion"],
        "vfn": lambda v, ss: True,
        "action": "🚨 Call emergency services — every minute matters for stroke",
    },
    {
        "name": "Meningitis Alert",
        "must": ["neck_stiffness", "severe_headache"],
        "any": ["high_fever", "fever", "confusion", "petechiae", "vomiting"],
        "vfn": lambda v, ss: True,
        "action": "🚨 Go to emergency — bacterial meningitis can progress rapidly",
    },
    {
        "name": "Critical Oxygen Level",
        "must": ["shortness_of_breath"],
        "any": ["chest_pain", "loss_of_consciousness", "cough"],
        "vfn": _hypoxia_trigger,
        "action": "🚨 Critical breathing pattern / oxygen — seek emergency care",
    },
    {
        "name": "Seizure Emergency",
        "must": ["seizures"],
        "any": [],
        "vfn": lambda v, ss: True,
        "action": "🚨 Emergency — lay patient on side, protect airway; call help",
    },
    {
        "name": "Loss of Consciousness",
        "must": ["loss_of_consciousness"],
        "any": [],
        "vfn": lambda v, ss: True,
        "action": "🚨 Emergency — check breathing and pulse; call help",
    },
    {
        "name": "Severe Dengue / Bleeding Risk",
        "must": ["petechiae", "high_fever"],
        "any": ["vomiting", "severe_headache", "abdominal_pain", "joint_pain"],
        "vfn": lambda v, ss: True,
        "action": "🚨 Urgent same-day care — bleeding fever illnesses need CBC/platelets urgently",
    },
]


TRIAGE_POINTS = {
    "loss_of_consciousness": (10, "Loss of consciousness"),
    "seizures": (8, "Seizures"),
    "one_side_weakness": (8, "One-sided weakness"),
    "speech_difficulty": (7, "Speech difficulty"),
    "chest_pain": (6, "Chest pain"),
    "shortness_of_breath": (5, "Breathing difficulty"),
    "severe_headache": (4, "Severe headache"),
    "neck_stiffness": (4, "Neck stiffness"),
    "high_fever": (3, "High fever"),
    "confusion": (3, "Confusion"),
    "petechiae": (3, "Petechiae"),
    "fever": (2, "Fever"),
    "rapid_heartbeat": (2, "Rapid heart rate"),
    "vomiting": (1, "Vomiting"),
    "dizziness": (1, "Dizziness"),
}


def check_emergency(symptom_set: Set[str], vitals: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """Check if patient symptoms or vitals trigger an immediate emergency alert."""
    for rule in EMERGENCIES:
        if not all(m in symptom_set for m in rule["must"]):
            continue
        if (not rule["any"]) or any(a in symptom_set for a in rule["any"]):
            if rule["vfn"](vitals, symptom_set):
                return {
                    "triggered": True,
                    "name": rule["name"],
                    "level": "CRITICAL",
                    "action": rule["action"],
                }
    return None


def compute_triage(symptom_set: Set[str], vitals: Dict[str, float]) -> Dict[str, Any]:
    """Calculate triage score, urgency level, and clinical advice."""
    score, factors = 0, []
    for sym, (pts, lbl) in TRIAGE_POINTS.items():
        if sym in symptom_set:
            score += pts
            factors.append(lbl)

    spo2 = vitals.get("oxygen_saturation_pct", 99.0)
    hr   = vitals.get("heart_rate_bpm", 75.0)
    temp = vitals.get("body_temperature_celsius", 37.0)
    bp   = vitals.get("blood_pressure_systolic_mmhg", 120.0)

    if spo2 < 90:
        score += 8
        factors.append(f"Critical SpO2 ({spo2:.0f}%)")
    elif spo2 < 94:
        score += 4
        factors.append(f"Low SpO2 ({spo2:.0f}%)")

    if hr > 130:
        score += 5
        factors.append(f"Very rapid HR ({int(hr)} bpm)")
    elif hr > 110:
        score += 2
        factors.append(f"Elevated HR ({int(hr)} bpm)")

    if temp >= 40:
        score += 4
        factors.append(f"Very high temp ({temp:.1f}°C)")
    elif temp >= 39.5:
        score += 3
        factors.append(f"High temp ({temp:.1f}°C)")
    elif temp >= 38:
        score += 1
        factors.append(f"Fever ({temp:.1f}°C)")

    if bp > 180:
        score += 5
        factors.append(f"Hypertensive crisis ({int(bp)} mmHg)")
    elif bp > 160:
        score += 2
        factors.append(f"High BP ({int(bp)} mmHg)")

    if score >= 10:
        lvl, adv = "CRITICAL", "🚨 Call 112 / Go to emergency immediately"
    elif score >= 6:
        lvl, adv = "SEVERE", "⚠️ Visit hospital or ER within 1–2 hours"
    elif score >= 3:
        lvl, adv = "MODERATE", "🔶 Consult a doctor today"
    else:
        lvl, adv = "MILD", "✅ Rest and monitor. See doctor if worsening"

    return {
        "level": lvl,
        "score": score,
        "advice": adv,
        "factors": factors[:5],
    }
