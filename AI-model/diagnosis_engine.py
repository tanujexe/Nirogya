"""
MediSense AI — Diagnosis Engine Proxy
=====================================
Redirects to src.core.session_manager for backward compatibility.
"""

from src.core.session_manager import (
    create_session,
    update_session,
    get_session,
    set_followup_pending,
    mark_symptom_addressed,
    append_qa_history,
    generate_best_question,
    is_uncertain,
    should_stop,
    shap_question,
    get_tests,
    get_diet,
    get_recovery,
    calculate_entropy,
)

__all__ = [
    "create_session",
    "update_session",
    "get_session",
    "set_followup_pending",
    "mark_symptom_addressed",
    "append_qa_history",
    "generate_best_question",
    "is_uncertain",
    "should_stop",
    "shap_question",
    "get_tests",
    "get_diet",
    "get_recovery",
    "calculate_entropy",
]