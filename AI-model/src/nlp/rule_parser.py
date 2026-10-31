"""
MediSense AI — Rule-based NLP Parser
====================================
Deterministic, fast (<1ms) extraction of symptoms and vital signs
with negation detection, typo correction, and Hindi/Hinglish normalisation.
"""

import re
import difflib
from typing import Dict, Tuple, List, Optional

from src.nlp.hinglish_lexicon import (
    ALL_SYMPTOMS,
    SYMPTOM_SET,
    HINGLISH_NORMS,
    DEVANAGARI_DIRECT_NORMS,
    DEVANAGARI_CONSONANTS,
    DEVANAGARI_VOWELS,
    DEVANAGARI_MATRAS,
    DEVANAGARI_SIGNS,
    SYNONYM_MAP,
    SEVERITY_WORDS,
    NEGATION_WORDS,
    HIGH_FEVER_HINTS,
)


def _contains_devanagari(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text))


def _romanize_devanagari(text: str) -> str:
    """Best-effort transliteration from Hindi script to Roman Hinglish."""
    pieces = []
    i = 0
    while i < len(text):
        pair = text[i:i + 2]
        if pair in ("क्ष", "त्र", "ज्ञ"):
            pieces.append({"क्ष": "ksh", "त्र": "tr", "ज्ञ": "gy"}[pair])
            i += 2
            continue

        ch = text[i]
        if ch in DEVANAGARI_VOWELS:
            pieces.append(DEVANAGARI_VOWELS[ch])
        elif ch in DEVANAGARI_CONSONANTS:
            base = DEVANAGARI_CONSONANTS[ch]
            nxt = text[i + 1] if i + 1 < len(text) else ""
            if nxt in DEVANAGARI_MATRAS:
                pieces.append(base + DEVANAGARI_MATRAS[nxt])
                i += 1
            elif nxt == "्":
                pieces.append(base)
                i += 1
            elif nxt and _contains_devanagari(nxt):
                pieces.append(base + "a")
            else:
                pieces.append(base)
        elif ch in DEVANAGARI_MATRAS:
            pieces.append(DEVANAGARI_MATRAS[ch])
        elif ch in DEVANAGARI_SIGNS:
            pieces.append(DEVANAGARI_SIGNS[ch])
        else:
            pieces.append(ch)
        i += 1

    romanized = re.sub(r"\s+", " ", "".join(pieces)).strip()
    romanized = re.sub(r"\s+([,.;:!?])", r"\1", romanized)
    return romanized


def _replace_phrase(text: str, phrase: str, replacement: str) -> str:
    if not phrase:
        return text
    pattern = re.compile(rf"(?<!\w){re.escape(phrase)}(?!\w)")
    return pattern.sub(replacement, text)


def normalize_input_text(text: str) -> str:
    """Normalize Hindi/Hinglish/English symptom text to clean romanized text."""
    t = str(text or "").strip().lower()
    if not t:
        return ""

    for hindi, english in DEVANAGARI_DIRECT_NORMS:
        if hindi:
            t = t.replace(hindi, english)

    if _contains_devanagari(t):
        t = _romanize_devanagari(t)

    for hindi, english in HINGLISH_NORMS:
        if hindi:
            t = _replace_phrase(t, hindi, english)

    return re.sub(r"\s+", " ", t).strip()


def _has_negation(text_lower: str, pos: int, window: int = 40) -> bool:
    snippet = text_lower[max(0, pos - window): pos]
    return any(neg in snippet.split() or neg in snippet for neg in NEGATION_WORDS)


def rule_extract_symptoms(text: str) -> Dict[str, int]:
    """Fast rule-based symptom extraction with severity and negation support."""
    t = normalize_input_text(text)
    found: Dict[str, int] = {}

    # 1. Exact & synonym matching
    for symptom, phrases in SYNONYM_MAP.items():
        for phrase in phrases:
            pat = r"\b" + re.escape(phrase) + r"\b"
            match = re.search(pat, t)
            if match and not _has_negation(t, match.start()):
                ctx = t[max(0, match.start() - 35): match.end() + 35]
                # Upgrade severity
                if symptom == "fever" and any(h in t for h in HIGH_FEVER_HINTS):
                    found["high_fever"] = 1
                elif symptom == "headache" and any(s in ctx for s in SEVERITY_WORDS):
                    found["severe_headache"] = 1
                elif symptom == "fatigue" and any(s in ctx for s in SEVERITY_WORDS):
                    found["excessive_fatigue"] = 1
                else:
                    found[symptom] = 1
                break

    # 2. Fuzzy spell correction for minor typos
    words = re.findall(r"\b[a-z]{4,}\b", t)
    all_sym_words = set()
    for phrases in SYNONYM_MAP.values():
        for p in phrases:
            all_sym_words.update(p.split())
    for word in words:
        if word in all_sym_words or word in SYMPTOM_SET:
            continue
        if not re.search(r"[aeiou]", word):
            continue
        close = difflib.get_close_matches(word, ALL_SYMPTOMS, n=1, cutoff=0.90)
        if close:
            pos = t.find(word)
            if pos >= 0 and not _has_negation(t, pos):
                found[close[0]] = 1

    return found


def parse_vitals(text: str) -> Dict[str, float]:
    """Extract vital signs from free text (numbers with units)."""
    vitals: Dict[str, float] = {}
    t = str(text or "").lower()

    # Temperature
    for pat in [
        r"(\d+\.?\d*)\s*°?\s*c(?:elsius)?(?:\s|$|,|\.)",
        r"temp(?:erature)?\s*(?:is|of|:)?\s*(\d+\.?\d*)",
        r"(\d+\.?\d*)\s*degree",
        r"(\d+)\s*(?:°c|celsius)",
    ]:
        m = re.search(pat, t)
        if m:
            val = float(m.group(1))
            if 35 <= val <= 42:
                vitals["body_temperature_celsius"] = val
                break

    # Heart Rate
    for pat in [
        r"(?:heart rate|hr|pulse)\s*(?:is|of|:)?\s*(\d+)",
        r"(\d+)\s*(?:bpm|beats per minute)",
        r"pulse\s*(?:is|:)?\s*(\d+)",
    ]:
        m = re.search(pat, t)
        if m:
            val = int(m.group(1))
            if 30 <= val <= 250:
                vitals["heart_rate_bpm"] = float(val)
                break

    # SpO2
    for pat in [
        r"(?:spo2|oxygen saturation|o2 sat|oxygen level)\s*(?:is|of|:)?\s*(\d+)",
        r"(\d+)\s*%\s*(?:oxygen|spo2|o2)",
        r"sp\s?o\s?2\s*(?:is|:)?\s*(\d+)",
    ]:
        m = re.search(pat, t)
        if m:
            val = float(m.group(1))
            if 70 <= val <= 100:
                vitals["oxygen_saturation_pct"] = val
                break

    # Systolic BP
    for pat in [
        r"(?:bp|blood pressure)\s*(?:is|of|:)?\s*(\d+)\s*(?:/|over)\s*\d+",
        r"(\d{2,3})\s*/\s*\d{2,3}\s*(?:mmhg)?",
    ]:
        m = re.search(pat, t)
        if m:
            val = int(m.group(1))
            if 70 <= val <= 250:
                vitals["blood_pressure_systolic_mmhg"] = float(val)
                break

    # Blood Sugar
    for pat in [
        r"(?:blood sugar|glucose|sugar|fbs|rbs|bsl)\s*(?:is|of|:)?\s*(\d+)",
        r"(\d+)\s*mg\s*/?dl",
    ]:
        m = re.search(pat, t)
        if m:
            val = int(m.group(1))
            if 40 <= val <= 600:
                vitals["blood_sugar_fasting_mgdl"] = float(val)
                break

    # Age (supports 'age 45' as well as '45 year old' / '45yo')
    m = re.search(r"(?:age|aged|am|i am|i'm)\s*[:\s]?\s*(\d+)|(\d+)\s*(?:years?\s*old|yrs?\s*old|yo)", t)
    if m:
        raw_age = m.group(1) or m.group(2)
        val = int(raw_age)
        if 0 <= val <= 120:
            vitals["age"] = float(val)

    # BMI
    m = re.search(r"bmi\s*(?:is|of|:)?\s*(\d+\.?\d*)", t)
    if m:
        val = float(m.group(1))
        if 10 <= val <= 60:
            vitals["bmi"] = val

    return vitals


def interpret_followup_answer(answer: str, pending_symptom: Optional[str]) -> Tuple[Dict[str, int], List[str]]:
    """Map follow-up answer (English/Hinglish yes/no) to additions or removals."""
    if not pending_symptom or pending_symptom not in SYMPTOM_SET:
        return {}, []

    t = answer.strip().lower()
    t = re.sub(r"[.!?।।]+\s*$", "", t).strip()
    if not t:
        return {}, []

    neg = bool(
        re.search(
            r"\b(no|nope|nah|never|not|nothing like|without|absent|negative|"
            r"nahi|nahin|nai|नहीं|matlab nahi|bilkul nahi|none|never had)\b",
            t,
        )
    )
    pos = bool(
        re.search(
            r"\b(yes|yeah|yep|sure|correct|right|true|absolutely|definitely|"
            r"haan|han|ji|ji haan|ha\b|hai|okay|ok\b|बिल्कुल|हाँ|हां|"
            r"very|slightly|mildly|often|frequently|sometimes|always|lot|much)\b",
            t,
        )
    )

    if not pos and not neg:
        if re.search(r"\b(i have|i've |i do have|have been having|having |had |"
                     r"mujhe\s+.+\s+hai|mere\s+.+\s+hai|feel\s+.+\s+stiff|is\s+.+\s+stiff)\b", t):
            pos = True
        if re.search(r"\b(i don't|i do not|don't have|dont have|never had|no i )\b", t):
            neg = True

    if neg and pos:
        return {}, []
    if neg:
        return {}, [pending_symptom]
    if pos:
        return {pending_symptom: 1}, []

    return {}, []


def get_symptom_severity(text: str) -> str:
    """Detect general clinical severity from phrasing."""
    t = text.lower()
    if any(k in t for k in ["severe", "very bad", "extreme", "terrible", "unbearable", "worst",
                           "bahut", "bohot", "tez", "critical", "dangerous", "emergency"]):
        return "severe"
    if any(k in t for k in ["mild", "slight", "little", "minor", "light", "thoda", "halka", "tolerable"]):
        return "mild"
    return "moderate"
