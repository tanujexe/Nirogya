"""
MediSense AI — Unified Symptom Extractor
========================================
Combines deterministic rule-based parsing with optional LLM fallback.
Rule-based extraction is always preferred; Claude can only supplement missed symptoms.
"""

from typing import Dict, Tuple, List, Optional
from src.nlp.hinglish_lexicon import SYMPTOM_SET
from src.nlp.rule_parser import (
    normalize_input_text,
    rule_extract_symptoms,
    parse_vitals,
    interpret_followup_answer,
    get_symptom_severity,
)
from src.nlp.llm_fallback import extract_via_claude


def extract_symptoms(text: str) -> Dict[str, int]:
    """Extract clinical symptoms using hybrid rule-based + optional LLM."""
    rule_found = rule_extract_symptoms(text)
    claude_found = extract_via_claude(text)

    merged = dict(rule_found)
    for k, v in claude_found.items():
        if k in SYMPTOM_SET and k not in merged:
            merged[k] = v

    return merged


__all__ = [
    "extract_symptoms",
    "parse_vitals",
    "normalize_input_text",
    "interpret_followup_answer",
    "get_symptom_severity",
]
