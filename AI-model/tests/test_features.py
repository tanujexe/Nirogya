"""
Unit Tests for Canonical Feature Engineering
"""

import pickle
import pandas as pd
import numpy as np
from config.settings import ARTIFACTS_DIR
from src.core.features import ALL_SYMPTOM_COLS, build_features, align_to_feature_names


def test_symptom_columns_count():
    assert len(ALL_SYMPTOM_COLS) == 81 or len(ALL_SYMPTOM_COLS) >= 80


def test_build_features_schema_parity():
    # Load expected feature names from artifacts
    fnames_path = ARTIFACTS_DIR / "feature_names.pkl"
    assert fnames_path.exists(), "feature_names.pkl must exist in artifacts"

    with open(fnames_path, "rb") as f:
        expected_fnames = pickle.load(f)

    # Create dummy row
    row = {col: 0.0 for col in ALL_SYMPTOM_COLS}
    row["fever"] = 1.0
    row["cough"] = 1.0
    row["age"] = 30.0
    row["body_temperature_celsius"] = 38.5

    df = pd.DataFrame([row])
    df_feat = build_features(df)
    df_aligned = align_to_feature_names(df_feat, expected_fnames)

    # Assert shape and exact column match
    assert df_aligned.shape[1] == len(expected_fnames)
    assert list(df_aligned.columns) == list(expected_fnames)
    assert df_aligned["fever_flag"].iloc[0] == 1
    assert df_aligned["has_fever_any"].iloc[0] == 1


def test_align_fills_missing_with_zero():
    df = pd.DataFrame([{"custom_feat": 10}])
    fnames = ["custom_feat", "missing_col_1", "missing_col_2"]
    aligned = align_to_feature_names(df, fnames)
    assert list(aligned.columns) == fnames
    assert aligned["missing_col_1"].iloc[0] == 0
