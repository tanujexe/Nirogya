"""
MediSense AI — Dynamic LLM Fallback (Claude API)
================================================
Provides non-blocking dynamic extraction for unstructured Hinglish/Hindi
when an ANTHROPIC_API_KEY is configured.
"""

import os
import re
import json
from typing import Dict
from config.settings import ANTHROPIC_API_KEY
from src.nlp.hinglish_lexicon import SYMPTOM_SET

_CLAUDE_AVAILABLE = False
_claude_client = None

CLAUDE_SYSTEM = """You extract medical symptoms from patient text and return ONLY valid JSON.

Map to these exact column names (underscore, lowercase):
fever, high_fever, chills, night_sweats, cold_sweats, cough, dry_cough, productive_cough, hemoptysis, shortness_of_breath, wheezing, chest_tightness, nasal_congestion, runny_nose, sneezing, chest_pain, palpitations, rapid_heartbeat, irregular_heartbeat, leg_swelling, headache, severe_headache, dizziness, confusion, seizures, loss_of_consciousness, tremors, one_side_weakness, speech_difficulty, memory_problems, nausea, vomiting, diarrhea, constipation, abdominal_pain, bloating, loss_of_appetite, blood_in_stool, rectal_bleeding, difficulty_swallowing, jaundice, dark_urine, pale_stools, right_upper_quadrant_pain, flank_pain, blood_in_urine, burning_urination, frequent_urination, reduced_urination, excessive_thirst, increased_appetite, weight_loss, weight_gain, heat_intolerance, cold_intolerance, increased_sweating, excessive_fatigue, joint_pain, muscle_pain, back_pain, neck_stiffness, bone_pain, skin_rash, skin_itching, hives, petechiae, skin_lesions, hair_loss, yellow_eyes, blurred_vision, eye_redness, swollen_lymph_nodes, sore_throat, loss_of_smell, loss_of_taste, anxiety, depression, mood_changes, fatigue, general_weakness, malaise, slow_healing_wounds, frequent_infections

Rules:
1. Return ONLY JSON — no explanation, no markdown.
2. Use 1 for present symptoms only.
3. Handle negations: "no fever", "nahi hai bukhar" -> do NOT include.
4. "severe/very/tez/bahut" + symptom -> use severe version (e.g., severe_headache).
5. Only include symptoms actually mentioned.
Example: {"fever": 1, "headache": 1, "neck_stiffness": 1}"""


def _init_client():
    global _CLAUDE_AVAILABLE, _claude_client
    if not ANTHROPIC_API_KEY:
        return
    try:
        import anthropic
        _claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        _CLAUDE_AVAILABLE = True
    except Exception:
        _CLAUDE_AVAILABLE = False


_init_client()


def extract_via_claude(text: str) -> Dict[str, int]:
    """Call Claude API for dynamic extraction."""
    if not _CLAUDE_AVAILABLE or not _claude_client:
        return {}
    try:
        resp = _claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=CLAUDE_SYSTEM,
            messages=[{"role": "user", "content": text[:1200]}],
        )
        raw = resp.content[0].text.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        parsed = json.loads(raw)
        return {
            k: 1 for k, v in parsed.items()
            if k in SYMPTOM_SET and str(v) in ("1", "true", "True")
        }
    except Exception:
        return {}
