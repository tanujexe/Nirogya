"""
MediSense AI — Shared Feature Engineering Proxy
===============================================
Redirects to src.core.features for backward compatibility.
"""

from src.core.features import (
    ALL_SYMPTOM_COLS,
    build_features,
    align_to_feature_names,
    _s,
)

__all__ = ["ALL_SYMPTOM_COLS", "build_features", "align_to_feature_names", "_s"]
