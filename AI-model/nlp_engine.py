"""
MediSense AI — NLP Engine Proxy
===============================
Redirects to src.nlp.extractor for backward compatibility.
"""

from src.nlp.extractor import (
    extract_symptoms,
    parse_vitals,
    normalize_input_text,
    interpret_followup_answer,
    get_symptom_severity,
)
from src.nlp.hinglish_lexicon import ALL_SYMPTOMS, SYMPTOM_SET

__all__ = [
    "extract_symptoms",
    "parse_vitals",
    "normalize_input_text",
    "interpret_followup_answer",
    "get_symptom_severity",
    "ALL_SYMPTOMS",
    "SYMPTOM_SET",
]
