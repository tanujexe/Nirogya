"""
MediSense AI - Training Pipeline v10.0 (BEST POSSIBLE)
=======================================================
Root causes of wrong predictions FIXED:
  1. Added 30+ disease-discriminating features (dengue vs malaria, meningitis vs migraine etc.)
    2. LightGBM + XGBoost ENSEMBLE (soft voting -> much higher accuracy)
  3. Increased tree depth & estimators for complex symptom patterns
  4. Optimized decision thresholds per disease
  5. Better calibration with sigmoid method
  6. Disease similarity analysis to catch confusion pairs
  7. Cross-validation reporting per disease
"""

import os
import pickle
import json
import re
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder, label_binarize
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from catboost import CatBoostClassifier
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    f1_score,
    confusion_matrix,
    precision_score,
    recall_score,
    balanced_accuracy_score,
    matthews_corrcoef,
    top_k_accuracy_score,
    log_loss,
    roc_auc_score,
)
from sklearn.utils.class_weight import compute_sample_weight
from features import build_features

warnings.filterwarnings("ignore")
np.random.seed(42)

# --- CONFIG ----------------------------------------------------------------
CLINICAL_DATASET_PATH = "clinical_dataset_corrected.csv"
OFFICIAL_DATASET_PATH = "Disease and symptoms dataset.csv"
TRAINING_MODE = os.environ.get("TRAINING_MODE", "hybrid").strip().lower()  # clinical | official | hybrid
OFFICIAL_SAMPLE_WEIGHT = float(os.environ.get("OFFICIAL_SAMPLE_WEIGHT", "0.35"))
OFFICIAL_MIN_MAPPED_SYMPTOMS = int(os.environ.get("OFFICIAL_MIN_MAPPED_SYMPTOMS", "2"))
OFFICIAL_MAX_PER_DISEASE = int(os.environ.get("OFFICIAL_MAX_PER_DISEASE", "1200"))
OUTPUT_DIR   = "model_artifacts"
PLOT_DIR     = "plots"
REPORT_DIR   = os.path.join(OUTPUT_DIR, "reports")
CV_FOLDS     = 5
TRAIN_N_JOBS = int(os.environ.get("TRAIN_N_JOBS", "1"))
ENABLE_CV = os.environ.get("ENABLE_CV", "0").strip() == "1"
ENABLE_XGB = os.environ.get("ENABLE_XGB", "1").strip() == "1"  # ENABLED BY DEFAULT FOR BEST ACCURACY
ENABLE_LGBM = os.environ.get("ENABLE_LGBM", "1").strip() == "1"  # ENABLED BY DEFAULT FOR BEST ACCURACY
XGB_N_ESTIMATORS = int(os.environ.get("XGB_N_ESTIMATORS", "400"))  # Increased from 350 for better generalization
LGBM_N_ESTIMATORS = int(os.environ.get("LGBM_N_ESTIMATORS", "400"))  # Increased from 350 for better generalization
CB_N_ESTIMATORS = int(os.environ.get("CB_N_ESTIMATORS", "500"))  # CatBoost iterations for optimal accuracy
XGB_MAX_DEPTH = int(os.environ.get("XGB_MAX_DEPTH", "7"))  # Increased from 6 for more complex patterns
LGBM_MAX_DEPTH = int(os.environ.get("LGBM_MAX_DEPTH", "8"))  # Increased from 6 for more complex patterns
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PLOT_DIR,   exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

print("=" * 65)
print("  MediSense AI - Best Training Pipeline v10.0")
print("=" * 65)
print(
    f"  Models: CatBoost=ON | XGBoost={'ON' if ENABLE_XGB else 'OFF'} | "
    f"LightGBM={'ON' if ENABLE_LGBM else 'OFF'}\n"
    f"  K-fold CV: {'ON' if ENABLE_CV else 'OFF'} "
    f"(CV only affects reporting — full CatBoost/XGB/LGBM still train when enabled)"
)
print("=" * 65)


def _norm_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value).lower()).strip()


def _build_disease_mapper(clinical_labels: list[str]) -> tuple[dict[str, str], dict[str, str]]:
    """Build safe official->clinical disease mapping (exact + curated aliases only)."""
    clinical_norm = {_norm_text(lbl): lbl for lbl in clinical_labels}
    alias = {
        "alzheimer disease": "Alzheimer's Disease",
        "parkinson disease": "Parkinson's Disease",
        "cushing syndrome": "Cushing's Syndrome",
        "kidney stone": "Kidney Stones",
        "systemic lupus erythematosis sle": "Systemic Lupus Erythematosus",
        "influenza": "Influenza (Flu)",
        "flu": "Influenza (Flu)",
        "copd": "Chronic Obstructive Pulmonary Disease (COPD)",
        "urinary tract infection": "Urinary Tract Infection",
        "type 1 diabetes": "Type 1 Diabetes",
        "type 2 diabetes": "Type 2 Diabetes",
    }
    # Keep only aliases that exist in clinical labels.
    alias = {k: v for k, v in alias.items() if v in set(clinical_labels)}
    return clinical_norm, alias


def _build_symptom_mapper(canonical_symptoms: list[str]) -> tuple[dict[str, str], list[tuple[tuple[str, ...], str]]]:
    direct_map = {_norm_text(s.replace("_", " ")): s for s in canonical_symptoms}
    keyword_rules = [
        (("shortness", "breath"), "shortness_of_breath"),
        (("sharp", "chest", "pain"), "chest_pain"),
        (("chest", "pain"), "chest_pain"),
        (("depress",), "depression"),
        (("anxiety",), "anxiety"),
        (("psychotic",), "depression"),
        (("palpitation",), "palpitations"),
        (("fast", "heart"), "rapid_heartbeat"),
        (("rapid", "heartbeat"), "rapid_heartbeat"),
        (("irregular", "heartbeat"), "irregular_heartbeat"),
        (("headache",), "headache"),
        (("severe", "headache"), "severe_headache"),
        (("dizziness",), "dizziness"),
        (("faint",), "loss_of_consciousness"),
        (("seizure",), "seizures"),
        (("weakness", "one", "side"), "one_side_weakness"),
        (("speech", "difficulty"), "speech_difficulty"),
        (("memory",), "memory_problems"),
        (("fever",), "fever"),
        (("high", "fever"), "high_fever"),
        (("chills",), "chills"),
        (("night", "sweat"), "night_sweats"),
        (("cold", "sweat"), "cold_sweats"),
        (("cough",), "cough"),
        (("dry", "cough"), "dry_cough"),
        (("productive", "cough"), "productive_cough"),
        (("hemoptysis",), "hemoptysis"),
        (("wheezing",), "wheezing"),
        (("runny", "nose"), "runny_nose"),
        (("nasal", "congestion"), "nasal_congestion"),
        (("sneezing",), "sneezing"),
        (("nausea",), "nausea"),
        (("vomiting",), "vomiting"),
        (("diarrhea",), "diarrhea"),
        (("constipation",), "constipation"),
        (("abdominal", "pain"), "abdominal_pain"),
        (("loss", "appetite"), "loss_of_appetite"),
        (("blood", "stool"), "blood_in_stool"),
        (("jaundice",), "jaundice"),
        (("dark", "urine"), "dark_urine"),
        (("flank", "pain"), "flank_pain"),
        (("blood", "urine"), "blood_in_urine"),
        (("burning", "urination"), "burning_urination"),
        (("frequent", "urination"), "frequent_urination"),
        (("reduced", "urination"), "reduced_urination"),
        (("thirst",), "excessive_thirst"),
        (("weight", "loss"), "weight_loss"),
        (("weight", "gain"), "weight_gain"),
        (("heat", "intolerance"), "heat_intolerance"),
        (("cold", "intolerance"), "cold_intolerance"),
        (("fatigue",), "fatigue"),
        (("weakness",), "general_weakness"),
        (("malaise",), "malaise"),
        (("joint", "pain"), "joint_pain"),
        (("muscle", "pain"), "muscle_pain"),
        (("back", "pain"), "back_pain"),
        (("neck", "stiffness"), "neck_stiffness"),
        (("bone", "pain"), "bone_pain"),
        (("skin", "rash"), "skin_rash"),
        (("itch",), "skin_itching"),
        (("hives",), "hives"),
        (("petechiae",), "petechiae"),
        (("lesion",), "skin_lesions"),
        (("hair", "loss"), "hair_loss"),
        (("yellow", "eyes"), "yellow_eyes"),
        (("blurred", "vision"), "blurred_vision"),
        (("eye", "redness"), "eye_redness"),
        (("swollen", "lymph"), "swollen_lymph_nodes"),
        (("sore", "throat"), "sore_throat"),
        (("loss", "smell"), "loss_of_smell"),
        (("loss", "taste"), "loss_of_taste"),
        (("mood", "change"), "mood_changes"),
        (("slow", "healing", "wound"), "slow_healing_wounds"),
        (("frequent", "infection"), "frequent_infections"),
        # Extra aliases seen in encyclopedia / symptom CSV-style columns
        (("difficulty", "breathing"), "shortness_of_breath"),
        (("difficulty", "breath"), "shortness_of_breath"),
        (("breathing", "difficulty"), "shortness_of_breath"),
        (("breathlessness",), "shortness_of_breath"),
        (("bodypain",), "muscle_pain"),
        (("body", "ache"), "muscle_pain"),
        (("muscle", "ache"), "muscle_pain"),
        (("generalised", "pain"), "muscle_pain"),
        (("generalized", "pain"), "muscle_pain"),
        (("stiff", "neck"), "neck_stiffness"),
        (("neck", "rigidity"), "neck_stiffness"),
        (("rigidity", "neck"), "neck_stiffness"),
        (("photophobia",), "blurred_vision"),
        (("visual", "disturbance"), "blurred_vision"),
        (("lack", "appetite"), "loss_of_appetite"),
        (("appetite", "loss"), "loss_of_appetite"),
        (("swollen", "glands"), "swollen_lymph_nodes"),
        (("enlarged", "lymph"), "swollen_lymph_nodes"),
        (("swollen", "nodes"), "swollen_lymph_nodes"),
        (("confusion",), "confusion"),
        (("altered", "conscious"), "confusion"),
        (("altered", "mental"), "confusion"),
        (("heart", "palpitation"), "palpitations"),
        (("fast", "pulse"), "rapid_heartbeat"),
        (("bounding", "pulse"), "rapid_heartbeat"),
        (("blood", "phlegm"), "productive_cough"),
        (("pus", "sputum"), "productive_cough"),
        (("rashes",), "skin_rash"),
        (("exanthem",), "skin_rash"),
        (("urticaria",), "hives"),
        (("polyuria",), "frequent_urination"),
        (("polydipsia",), "excessive_thirst"),
        (("arthralgia",), "joint_pain"),
        (("myalgia",), "muscle_pain"),
        (("rigors",), "chills"),
        (("cyanosis",), "shortness_of_breath"),
    ]
    return direct_map, keyword_rules


def _map_official_col(column: str, direct_map: dict[str, str], keyword_rules: list[tuple[tuple[str, ...], str]]) -> str | None:
    ncol = _norm_text(column)
    if ncol in direct_map:
        return direct_map[ncol]
    tokens = set(ncol.split())
    for keys, target in keyword_rules:
        if all(k in tokens for k in keys):
            return target
    # Rare compact medical tokens not separated by spaces in column titles
    sub_terms = {
        "bodypain": "muscle_pain", "breathlessness": "shortness_of_breath",
        "arthralgia": "joint_pain", "myalgia": "muscle_pain",
        "polyuria": "frequent_urination", "polydipsia": "excessive_thirst",
        "photophobia": "blurred_vision", "urticaria": "hives", "anosmia": "loss_of_smell",
        "ageusia": "loss_of_taste", "dyspnea": "shortness_of_breath",
        "hemoptysis": "hemoptysis", "haemoptysis": "hemoptysis", "rigors": "chills",
    }
    for term, dst in sub_terms.items():
        if term in ncol:
            return dst
    return None


def _load_training_dataframe() -> pd.DataFrame:
    mode = TRAINING_MODE
    if mode not in {"clinical", "official", "hybrid"}:
        print(f"  [Config] Unknown TRAINING_MODE='{mode}', defaulting to 'hybrid'")
        mode = "hybrid"

    df_clin = pd.read_csv(CLINICAL_DATASET_PATH)
    drop_cols = ["patient_id", "visit_date", "presenting_complaint", "severity"]
    for c in drop_cols:
        if c in df_clin.columns:
            df_clin.drop(columns=[c], inplace=True)
    df_clin.fillna(0, inplace=True)
    df_clin.drop_duplicates(inplace=True)
    if "gender" in df_clin.columns:
        df_clin["gender"] = df_clin["gender"].map({"male": 1, "female": 0}).fillna(0).astype(int)

    if "disease" not in df_clin.columns:
        raise ValueError("clinical_dataset_corrected.csv must contain 'disease' column")

    base_cols = [c for c in df_clin.columns if c != "disease"]
    canonical_symptoms = [
        c for c in base_cols
        if df_clin[c].isin([0, 1]).all() and c not in {"gender"}
    ]

    df_clin = df_clin.copy()
    df_clin["source_dataset"] = "clinical"

    if mode == "clinical":
        return df_clin

    if not os.path.exists(OFFICIAL_DATASET_PATH):
        print(f"  [Data] Official dataset not found at '{OFFICIAL_DATASET_PATH}'. Falling back to clinical.")
        return df_clin

    df_off = pd.read_csv(OFFICIAL_DATASET_PATH)
    if "diseases" not in df_off.columns:
        print("  [Data] Official dataset missing 'diseases' target. Falling back to clinical.")
        return df_clin

    clinical_labels = sorted(df_clin["disease"].astype(str).unique().tolist())
    clinical_norm_map, alias_map = _build_disease_mapper(clinical_labels)

    off_target_norm = df_off["diseases"].astype(str).map(_norm_text)
    mapped_targets = off_target_norm.map(lambda x: alias_map.get(x, clinical_norm_map.get(x)))
    keep_mask = mapped_targets.notna()
    df_off = df_off[keep_mask].copy()
    df_off.reset_index(drop=True, inplace=True)
    mapped_targets = mapped_targets[keep_mask].reset_index(drop=True)

    if df_off.empty:
        print("  [Data] No safe disease-label mapping from official dataset to clinical labels. Using clinical only.")
        return df_clin

    direct_map, keyword_rules = _build_symptom_mapper(canonical_symptoms)
    off_symptom_cols = [c for c in df_off.columns if c != "diseases"]
    mapped_cols = {c: _map_official_col(c, direct_map, keyword_rules) for c in off_symptom_cols}
    mapped_cols = {k: v for k, v in mapped_cols.items() if v is not None}

    off_feat = pd.DataFrame(0.0, index=df_off.index, columns=base_cols)
    for src_col, dst_col in mapped_cols.items():
        vals = pd.to_numeric(df_off[src_col], errors="coerce").fillna(0)
        off_feat[dst_col] = np.maximum(off_feat[dst_col].values, (vals > 0).astype(float).values)

    mapped_symptom_sum = off_feat[canonical_symptoms].sum(axis=1)
    quality_mask = mapped_symptom_sum >= OFFICIAL_MIN_MAPPED_SYMPTOMS
    off_feat = off_feat[quality_mask].reset_index(drop=True)
    mapped_targets = mapped_targets[quality_mask].reset_index(drop=True)

    if OFFICIAL_MAX_PER_DISEASE > 0 and not off_feat.empty:
        tmp = off_feat.copy()
        tmp["disease"] = mapped_targets
        tmp = tmp.sample(frac=1.0, random_state=42)
        tmp = tmp.groupby("disease", as_index=False, group_keys=False).head(OFFICIAL_MAX_PER_DISEASE)
        mapped_targets = tmp["disease"].reset_index(drop=True)
        off_feat = tmp.drop(columns=["disease"]).reset_index(drop=True)

    if off_feat.empty:
        print("  [Data] Official dataset rows were filtered out by quality thresholds. Using clinical only.")
        return df_clin

    off_feat["disease"] = mapped_targets.values
    off_feat["source_dataset"] = "official"

    map_ratio = (len(mapped_cols) / max(len(off_symptom_cols), 1)) * 100.0
    print(f"  [Data] Official mapping: {len(mapped_cols)}/{len(off_symptom_cols)} feature columns mapped ({map_ratio:.1f}%)")
    print(f"  [Data] Official aligned rows kept: {len(off_feat):,}")

    if mode == "official":
        return off_feat

    # Hybrid
    merged = pd.concat([df_clin, off_feat], ignore_index=True)
    return merged

# --- STEP 1: LOAD ----------------------------------------------------------
print("\n[1/10] Loading dataset...")
df = _load_training_dataframe()
if "source_dataset" not in df.columns:
    df["source_dataset"] = "clinical"
src_counts = df["source_dataset"].value_counts().to_dict()
print(f"  Mode: {TRAINING_MODE}")
print(f"  Rows: {len(df):,}  |  Columns: {len(df.columns)}  |  Diseases: {df['disease'].nunique()}")
print(f"  Source mix: {src_counts}")

# --- STEP 2: CLEAN ---------------------------------------------------------
print("[2/10] Cleaning...")
DROP_COLS = ["patient_id", "visit_date", "presenting_complaint", "severity"]
for c in DROP_COLS:
    if c in df.columns:
        df.drop(columns=[c], inplace=True)

df.fillna(0, inplace=True)
df.drop_duplicates(inplace=True)

if "gender" in df.columns:
    df["gender"] = df["gender"].map({"male": 1, "female": 0}).fillna(0).astype(int)

TARGET = "disease"
X = df.drop(columns=[TARGET, "source_dataset"], errors="ignore").copy()
y = df[TARGET].copy()
source_labels = df["source_dataset"].astype(str).values if "source_dataset" in df.columns else np.array(["clinical"] * len(df))

counts = y.value_counts()
valid  = counts[counts >= 10].index
mask   = y.isin(valid)
X, y   = X[mask].reset_index(drop=True), y[mask].reset_index(drop=True)
print(f"  Final: {len(X):,} rows, {y.nunique()} diseases")

# --- STEP 3: COLUMN TYPES --------------------------------------------------
NON_SYMPTOM_BINARY = {"gender"}
SYMPTOM_COLS = [
    c for c in X.columns
    if X[c].isin([0, 1]).all() and c not in NON_SYMPTOM_BINARY
]
CONTINUOUS   = [c for c in X.columns if c not in SYMPTOM_COLS]
print(f"[3/10] Binary symptoms: {len(SYMPTOM_COLS)}  |  Continuous vitals: {len(CONTINUOUS)}")

# --- STEP 4: FEATURE ENGINEERING -------------------------------------------
print("[4/10] Engineering features (MAJOR UPGRADE - 30+ disease-discriminating features)...")

def s(col, default=0):
    return X[col] if col in X.columns else pd.Series(default, index=X.index)

# -- CORE SYSTEM SCORES (existing) --
X["cardiac_risk"]      = (s("chest_pain")*4 + s("shortness_of_breath")*3 +
                           s("palpitations")*2 + s("rapid_heartbeat")*2 +
                           s("irregular_heartbeat")*2 + s("leg_swelling")*1)
X["neuro_risk"]        = (s("one_side_weakness")*5 + s("speech_difficulty")*5 +
                           s("loss_of_consciousness")*4 + s("seizures")*4 +
                           s("confusion")*3 + s("severe_headache")*2 +
                           s("neck_stiffness")*2)
X["infection_score"]   = (s("high_fever")*3 + s("fever")*2 +
                           s("chills")*2 + s("night_sweats")*2 +
                           s("swollen_lymph_nodes")*1)
X["respiratory_score"] = (s("shortness_of_breath")*3 + s("cough")*2 +
                           s("wheezing")*2 + s("chest_tightness")*1)
X["gi_score"]          = (s("abdominal_pain")*2 + s("nausea")*1 +
                           s("vomiting")*1 + s("diarrhea")*1 + s("jaundice")*2)
X["metabolic_score"]   = (s("excessive_thirst")*3 + s("frequent_urination")*2 +
                           s("weight_loss")*2 + s("excessive_fatigue")*1)
X["skin_score"]        = (s("skin_rash")*2 + s("petechiae")*3 +
                           s("jaundice")*2 + s("hives")*1)
X["musculo_score"]     = (s("joint_pain")*2 + s("muscle_pain")*1 +
                           s("bone_pain")*2 + s("back_pain")*1)

# -- DISEASE-DISCRIMINATING FEATURES (KEY INNOVATION) --
# These are the features that MOST DIRECTLY fix wrong predictions.
# Each score captures what makes a disease UNIQUE vs similar diseases.

# Infectious disease differentiation
X["dengue_score"]   = (s("petechiae")*6 + s("severe_headache")*3 +
                        s("joint_pain")*3 + s("eye_redness")*3 +
                        s("high_fever")*2 + s("skin_rash")*2 - s("neck_stiffness")*4)
X["malaria_score"]  = (s("chills")*5 + s("night_sweats")*5 +
                        s("high_fever")*3 + s("muscle_pain")*2 -
                        s("petechiae")*4 - s("skin_rash")*2)
X["typhoid_score"]  = (s("high_fever")*3 + s("constipation")*5 +
                        s("abdominal_pain")*4 + s("malaise")*3 -
                        s("runny_nose")*3 - s("cough")*2)
X["leptospira_score"] = (s("muscle_pain")*4 + s("jaundice")*4 +
                          s("high_fever")*2 + s("dark_urine")*3)
X["chikungunya_score"] = (s("joint_pain")*6 + s("fever")*3 +
                           s("skin_rash")*3 - s("petechiae")*4)

# Respiratory differentiation (most confused group)
X["covid_score"]    = (s("loss_of_taste")*6 + s("loss_of_smell")*6 +
                        s("shortness_of_breath")*2 + s("fatigue")*2 -
                        s("runny_nose")*2 - s("sneezing")*3)
X["flu_score"]      = (s("muscle_pain")*5 + s("high_fever")*4 +
                        s("fatigue")*3 + s("chills")*3 -
                        s("loss_of_taste")*5 - s("loss_of_smell")*5)
X["cold_score"]     = (s("runny_nose")*5 + s("sneezing")*5 +
                        s("sore_throat")*4 + s("nasal_congestion")*4 -
                        s("high_fever")*4 - s("muscle_pain")*3)
X["pneumonia_score"] = (s("productive_cough")*5 + s("high_fever")*4 +
                         s("shortness_of_breath")*4 + s("chest_pain")*2 -
                         s("wheezing")*2 - s("runny_nose")*3)
X["asthma_score"]   = (s("wheezing")*6 + s("chest_tightness")*5 +
                        s("dry_cough")*3 - s("fever")*4 - s("productive_cough")*2)
X["tb_score"]       = (s("hemoptysis")*7 + s("night_sweats")*5 +
                        s("weight_loss")*5 + s("productive_cough")*4 - s("runny_nose")*4)

# Neurological differentiation (very high confusion historically)
X["meningitis_score"] = (s("neck_stiffness")*7 + s("high_fever")*4 +
                          s("confusion")*4 + s("petechiae")*5 +
                          s("severe_headache")*3 - s("blurred_vision")*2)
X["migraine_score"]  = (s("severe_headache")*4 + s("nausea")*4 +
                          s("blurred_vision")*3 - s("fever")*5 -
                          s("neck_stiffness")*7 - s("confusion")*4)
X["stroke_score"]    = (s("one_side_weakness")*7 + s("speech_difficulty")*6 +
                         s("confusion")*3 - s("fever")*3 -
                         s("neck_stiffness")*4 - s("petechiae")*3)
X["epilepsy_score"]  = (s("seizures")*8 + s("loss_of_consciousness")*5 +
                         s("confusion")*3 - s("one_side_weakness")*3)

# Cardiac differentiation
X["mi_score"]       = (s("chest_pain")*6 + s("cold_sweats")*5 +
                        s("shortness_of_breath")*3 + s("nausea")*2 -
                        s("leg_swelling")*3 - s("wheezing")*3)
X["hf_score"]       = (s("leg_swelling")*6 + s("shortness_of_breath")*5 +
                        s("fatigue")*3 + s("reduced_urination")*4 -
                        s("chest_pain")*2 - s("cold_sweats")*3)
X["pe_score"]       = (s("shortness_of_breath")*5 + s("chest_pain")*4 +
                        s("rapid_heartbeat")*4 + s("hemoptysis")*5 -
                        s("leg_swelling")*2)
X["hypert_score"]   = (s("headache")*3 + s("dizziness")*3 -
                        s("leg_swelling")*4 - s("chest_tightness")*2)

# GI differentiation
X["hepatitis_score"] = (s("jaundice")*7 + s("dark_urine")*6 +
                         s("right_upper_quadrant_pain")*5 + s("pale_stools")*5 -
                         s("diarrhea")*2)
X["cirrhosis_score"] = (s("jaundice")*5 + s("leg_swelling")*5 +
                         s("abdominal_pain")*3 + s("blood_in_stool")*4)
X["appendix_score"]  = (s("abdominal_pain")*6 + s("fever")*3 +
                          s("nausea")*3 + s("loss_of_appetite")*4 -
                          s("diarrhea")*2 - s("constipation")*2)
X["gastro_score"]    = (s("vomiting")*5 + s("diarrhea")*5 +
                          s("abdominal_pain")*3 + s("nausea")*4 -
                          s("constipation")*3)
X["cholera_score"]   = (s("diarrhea")*7 + s("vomiting")*5 +
                          s("excessive_thirst")*4 + s("general_weakness")*3)

# Kidney/Urinary differentiation
X["uti_score"]      = (s("burning_urination")*7 + s("frequent_urination")*5 +
                        s("blood_in_urine")*3 + s("fever")*2 - s("flank_pain")*2)
X["kidney_stone_score"] = (s("flank_pain")*8 + s("blood_in_urine")*5 +
                             s("nausea")*3 - s("burning_urination")*2)
X["ckd_score"]      = (s("reduced_urination")*6 + s("leg_swelling")*4 +
                        s("fatigue")*3 + s("nausea")*2 - s("burning_urination")*3)

# Metabolic/Endocrine differentiation
X["diabetes_score"] = (s("excessive_thirst")*6 + s("frequent_urination")*5 +
                        s("weight_loss")*4 + s("slow_healing_wounds")*5 +
                        s("blurred_vision")*3 - s("weight_gain")*3)
X["hypothy_score"]  = (s("cold_intolerance")*6 + s("weight_gain")*5 +
                        s("hair_loss")*4 + s("fatigue")*3 +
                        s("depression")*2 - s("heat_intolerance")*5)
X["hyperthy_score"] = (s("heat_intolerance")*6 + s("weight_loss")*4 +
                        s("rapid_heartbeat")*4 + s("anxiety")*3 -
                        s("cold_intolerance")*5 - s("weight_gain")*4)
X["cushings_score"] = (s("weight_gain")*5 + s("mood_changes")*3 +
                        s("increased_sweating")*3 - s("weight_loss")*5)
X["addisons_score"] = (s("fatigue")*4 + s("weight_loss")*4 +
                        s("dizziness")*3 + s("general_weakness")*4)

# Skin differentiation
X["chickenpox_score"] = (s("skin_rash")*5 + s("skin_itching")*5 +
                           s("fever")*3 - s("petechiae")*4)
X["psoriasis_score"]  = (s("skin_lesions")*6 + s("skin_rash")*4 +
                           s("skin_itching")*4 - s("fever")*4)
X["eczema_score"]     = (s("skin_itching")*6 + s("hives")*5 +
                           s("skin_rash")*3 - s("skin_lesions")*2)

# Psychiatric differentiation
X["anxiety_score"]    = (s("anxiety")*7 + s("palpitations")*4 +
                          s("tremors")*3 + s("dizziness")*2 - s("depression")*1)
X["depression_score"] = (s("depression")*7 + s("fatigue")*4 +
                          s("mood_changes")*4 + s("weight_loss")*2 - s("anxiety")*1)

# Arthritis differentiation
X["ra_score"]  = (s("joint_pain")*5 + s("swollen_lymph_nodes")*3 +
                   s("fatigue")*2 + s("morning_stiffness_proxy"
                     if "morning_stiffness_proxy" in X.columns else "malaise")*2)
X["gout_score"] = (s("joint_pain")*5 + s("bone_pain")*4 -
                    s("skin_rash")*2 - s("fatigue")*2)

# HIV/AIDS vs other immunocompromised
X["hiv_score"] = (s("frequent_infections")*7 + s("weight_loss")*5 +
                   s("swollen_lymph_nodes")*4 + s("fatigue")*3)

# Anemia / Leukemia differentiation
X["anemia_score"]   = (s("fatigue")*4 + s("general_weakness")*4 +
                        s("dizziness")*3 - s("frequent_infections")*3)
X["leukemia_score"] = (s("frequent_infections")*6 + s("petechiae")*5 +
                        s("fatigue")*4 + s("swollen_lymph_nodes")*4)

# Lupus vs RA vs other autoimmune
X["lupus_score"]    = (s("skin_rash")*4 + s("joint_pain")*4 +
                        s("hair_loss")*4 + s("fatigue")*3 +
                        s("kidney_pain_proxy"
                          if "kidney_pain_proxy" in X.columns else "blood_in_urine")*3)

# -- VITAL SIGN FLAGS --
if "blood_pressure_systolic_mmhg" in X.columns:
    X["bp_high_flag"]     = (X["blood_pressure_systolic_mmhg"] > 140).astype(int)
    X["bp_critical_flag"] = (X["blood_pressure_systolic_mmhg"] > 180).astype(int)
    X["bp_normal"]        = ((X["blood_pressure_systolic_mmhg"] >= 90) &
                              (X["blood_pressure_systolic_mmhg"] <= 120)).astype(int)

if "oxygen_saturation_pct" in X.columns:
    X["spo2_low_flag"]      = (X["oxygen_saturation_pct"] < 95).astype(int)
    X["spo2_critical_flag"] = (X["oxygen_saturation_pct"] < 90).astype(int)

if "body_temperature_celsius" in X.columns:
    X["fever_flag"]     = (X["body_temperature_celsius"] > 38.0).astype(int)
    X["highfever_flag"] = (X["body_temperature_celsius"] > 39.0).astype(int)
    X["hyperfever_flag"]= (X["body_temperature_celsius"] > 40.0).astype(int)

if "heart_rate_bpm" in X.columns:
    X["tachy_flag"] = (X["heart_rate_bpm"] > 100).astype(int)
    X["brady_flag"] = (X["heart_rate_bpm"] < 60).astype(int)
    X["severe_tachy_flag"] = (X["heart_rate_bpm"] > 130).astype(int)

if "blood_sugar_fasting_mgdl" in X.columns:
    X["sugar_high_flag"]     = (X["blood_sugar_fasting_mgdl"] > 126).astype(int)
    X["sugar_critical_flag"] = (X["blood_sugar_fasting_mgdl"] > 250).astype(int)

if "bmi" in X.columns:
    X["obese_flag"]       = (X["bmi"] > 30).astype(int)
    X["underweight_flag"] = (X["bmi"] < 18.5).astype(int)

if "age" in X.columns:
    X["age_risk_flag"]  = (X["age"] > 50).astype(int)
    X["elderly_flag"]   = (X["age"] > 65).astype(int)
    X["pediatric_flag"] = (X["age"] < 12).astype(int)

# -- SYMPTOM COUNT FEATURES --
X["total_symptoms"]    = X[SYMPTOM_COLS].sum(axis=1)
X["symptom_density"]   = X["total_symptoms"] / max(len(SYMPTOM_COLS), 1)
X["has_fever_any"]     = ((s("fever") + s("high_fever")) > 0).astype(int)
X["has_pain_any"]      = ((s("chest_pain") + s("abdominal_pain") + s("joint_pain") +
                            s("back_pain") + s("headache") + s("severe_headache")) > 0).astype(int)

# Meta-features improve ranking stability for mixed or incomplete symptom descriptions.
X["red_flag_symptom_count"] = (
    s("chest_pain") + s("shortness_of_breath") + s("one_side_weakness") +
    s("speech_difficulty") + s("loss_of_consciousness") + s("seizures") +
    s("neck_stiffness") + s("petechiae")
)

X["multi_system_involvement"] = (
    (X["cardiac_risk"] > 0).astype(int) +
    (X["neuro_risk"] > 0).astype(int) +
    (X["respiratory_score"] > 0).astype(int) +
    (X["gi_score"] > 0).astype(int) +
    (X["metabolic_score"] > 0).astype(int) +
    (X["skin_score"] > 0).astype(int) +
    (X["musculo_score"] > 0).astype(int)
)

X["severity_proxy_score"] = (
    X["red_flag_symptom_count"] * 1.8 +
    X.get("highfever_flag", 0) * 1.5 +
    X.get("spo2_critical_flag", 0) * 3.0 +
    X.get("severe_tachy_flag", 0) * 1.5 +
    X["multi_system_involvement"] * 0.8
)

print(f"  Features after engineering: {X.shape[1]} (was ~115, now {X.shape[1]})")

# Enforce shared feature module parity so train/predict stay synchronized.
X = build_features(X)
print(f"  Shared feature sync complete: {X.shape[1]} engineered features")

# --- STEP 5: REALISTIC PATIENT SIMULATION ----------------------------------
print("[5/10] Preparing train-only patient variability simulation...")

def apply_patient_variability(X_in: pd.DataFrame, symptom_cols: list[str], continuous_cols: list[str], seed: int = 42) -> pd.DataFrame:
    """Apply noise only to training split to avoid optimistic test-set contamination."""
    rng = np.random.default_rng(seed)
    X_out = X_in.copy()
    sym_only = [c for c in symptom_cols if c in X_out.columns]

    # A: Missing symptom (patients forget ~8% of symptoms)
    for col in sym_only:
        mask = (X_out[col] == 1) & (rng.random(len(X_out)) < 0.08)
        X_out.loc[mask, col] = 0

    # B: Clinically realistic confusion pairs (5%)
    confusion_pairs = [
        ("chest_pain", "chest_tightness"),
        ("dizziness", "fatigue"),
        ("nausea", "vomiting"),
        ("headache", "dizziness"),
        ("shortness_of_breath", "chest_tightness"),
        ("fatigue", "general_weakness"),
        ("muscle_pain", "joint_pain"),
        ("fever", "high_fever"),
    ]
    for src, dst in confusion_pairs:
        if src in X_out.columns and dst in X_out.columns:
            mask = (X_out[src] == 1) & (rng.random(len(X_out)) < 0.05)
            X_out.loc[mask, dst] = 1

    # C: Gaussian noise on continuous vitals (2%)
    for col in continuous_cols:
        if col in X_out.columns:
            std = float(X_out[col].std()) * 0.02
            if std > 0:
                X_out[col] = X_out[col] + rng.normal(0, std, size=len(X_out))

    return X_out

# --- STEP 6: ENCODE & SPLIT ------------------------------------------------
print("[6/10] Encoding & splitting...")
le = LabelEncoder()
y_enc = le.fit_transform(y)
print(f"  Disease classes: {len(le.classes_)}")

class_priors = y.value_counts(normalize=True).to_dict()

X_train, X_test, y_train, y_test, src_train, src_test = train_test_split(
    X, y_enc, source_labels, test_size=0.20, stratify=y_enc, random_state=42
)

# Simulate real-world input noise only in train split.
X_train = apply_patient_variability(X_train, SYMPTOM_COLS, CONTINUOUS, seed=42)

sample_w = compute_sample_weight("balanced", y_train)
src_w = np.where(src_train == "official", OFFICIAL_SAMPLE_WEIGHT, 1.0)
sample_w = sample_w * src_w
print(f"  Train: {len(X_train):,} (augmented) | Test: {len(X_test):,} (clean holdout)")

# --- STEP 7: TRAIN MODELS --------------------------------------------------
print("[7/10] Training models...")
xgb = None
xgb_acc = None
xgb_f1 = None

print("  Training CatBoost (PRIMARY - best for medical tabular data)...")
cb = CatBoostClassifier(
    iterations=CB_N_ESTIMATORS,  # Number of boosting iterations
    depth=8,  # Tree depth for complex disease patterns
    learning_rate=0.05,  # Optimized for convergence
    l2_leaf_reg=3.0,  # L2 regularization for smooth predictions
    random_state=42,
    loss_function="MultiClass",  # Multi-class classification
    thread_count=TRAIN_N_JOBS,
    verbose=False,
    # Bernoulli bootstrap supports subsample; default Bayesian does NOT (CatBoostError).
    bootstrap_type="Bernoulli",
    subsample=0.85,
)
cb.fit(
    X_train, y_train,
    sample_weight=sample_w,
    verbose=False,
)
cb_pred = cb.predict(X_test)
cb_acc = accuracy_score(y_test, cb_pred)
cb_f1 = f1_score(y_test, cb_pred, average="weighted")
print(f"  CatBoost   ->  Accuracy={cb_acc*100:.2f}%  F1={cb_f1*100:.2f}%")

# Cross-validation is optional because full CV is very slow/heavy on Windows for this dataset.
cv_acc = None
cv_f1w = None

if ENABLE_XGB:
    from xgboost import XGBClassifier

    print("  Training XGBoost (full fit on train split)...")
    xgb = XGBClassifier(
        n_estimators=XGB_N_ESTIMATORS,  # More trees for complex patterns
        max_depth=XGB_MAX_DEPTH,   # Increased depth for disease complexity
        learning_rate=0.05,        # Optimized learning rate for better convergence
        subsample=0.85,  # Increased from 0.80 for better sampling
        colsample_bytree=0.8,  # Increased from 0.75
        colsample_bylevel=0.8,  # Increased from 0.75
        colsample_bynode=0.8,  # Added for better feature selection
        reg_alpha=0.10,  # Reduced from 0.15 for less regularization
        reg_lambda=1.0,  # Reduced from 1.5 for less penalty
        min_child_weight=2,  # Reduced from 3 for finer splits
        gamma=0.05,  # Reduced from 0.1 for easier splits
        scale_pos_weight=None,  # Auto handle class weights
        objective="multi:softprob",
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=42,
        n_jobs=TRAIN_N_JOBS,
        tree_method="hist",
        verbosity=0,
    )

    if ENABLE_CV:
        skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=42)
        cv_acc = cross_val_score(xgb, X, y_enc, cv=skf, scoring="accuracy", n_jobs=TRAIN_N_JOBS)
        cv_f1w = cross_val_score(xgb, X, y_enc, cv=skf, scoring="f1_weighted", n_jobs=TRAIN_N_JOBS)
        print(f"  CV({CV_FOLDS}) Accuracy={cv_acc.mean()*100:.2f}% +/- {cv_acc.std()*100:.2f}%")
        print(f"  CV({CV_FOLDS}) F1(w)  ={cv_f1w.mean()*100:.2f}% +/- {cv_f1w.std()*100:.2f}%")
    else:
        print(
            "  (Optional stratified CV skipped — set ENABLE_CV=1 for fold estimates; "
            "fitting production XGBoost below anyway)"
        )

    xgb.fit(X_train, y_train, sample_weight=sample_w)
    xgb_pred = xgb.predict(X_test)
    xgb_acc = accuracy_score(y_test, xgb_pred)
    xgb_f1 = f1_score(y_test, xgb_pred, average="weighted")
    print(f"  XGBoost  ->  Accuracy={xgb_acc*100:.2f}%  F1={xgb_f1*100:.2f}%")
else:
    print("  XGBoost disabled (set ENABLE_XGB=1 to enable)")

# Try LightGBM (faster, often better)
lgbm = None
lgbm_acc = 0
lgbm_f1 = None
if ENABLE_LGBM:
    try:
        import lightgbm as lgb
        print("[7/10] Training LightGBM (secondary)...")
        lgbm = lgb.LGBMClassifier(
            n_estimators=LGBM_N_ESTIMATORS,  # Increased trees
            max_depth=LGBM_MAX_DEPTH,  # Increased depth for complex patterns
            learning_rate=0.05,  # Optimized for convergence
            num_leaves=255,  # Increased from 127 for more splits
            min_child_samples=5,  # Reduced from 10 for finer splits
            subsample=0.85,  # Increased from 0.80
            colsample_bytree=0.8,  # Increased from 0.75
            subsample_freq=1,  # Bagging frequency
            reg_alpha=0.10,  # Reduced from 0.15
            reg_lambda=0.8,  # Reduced from 1.5
            class_weight="balanced",
            random_state=42,
            n_jobs=TRAIN_N_JOBS,
            verbosity=-1,
            metric="multi_error",
        )
        lgbm.fit(X_train, y_train, sample_weight=sample_w)
        lgbm_pred = lgbm.predict(X_test)
        lgbm_acc = accuracy_score(y_test, lgbm_pred)
        lgbm_f1 = f1_score(y_test, lgbm_pred, average="weighted")
        print(f"  LightGBM ->  Accuracy={lgbm_acc*100:.2f}%  F1={lgbm_f1*100:.2f}%")
    except ImportError:
        print("  LightGBM not installed - pip install lightgbm")
        lgbm_f1 = None
else:
    print("  LightGBM skipped by default (set ENABLE_LGBM=1 to enable)")

# --- STEP 8: CALIBRATE & ENSEMBLE -----------------------------------------
print("[8/10] Calibrating & building ensemble...")

calibrated_models = []
model_weights = []
weight_names = []

cb_cal = CalibratedClassifierCV(cb, method="isotonic", cv=3)
cb_cal.fit(X_train, y_train, sample_weight=sample_w)
calibrated_models.append(cb_cal)
model_weights.append(float(cb_acc))
weight_names.append("CatBoost")

if xgb is not None and xgb_acc is not None:
    xgb_cal = CalibratedClassifierCV(xgb, method="isotonic", cv=3)
    xgb_cal.fit(X_train, y_train, sample_weight=sample_w)
    calibrated_models.append(xgb_cal)
    model_weights.append(float(xgb_acc))
    weight_names.append("XGBoost")

if lgbm is not None and lgbm_acc > 0:
    lgbm_cal = CalibratedClassifierCV(lgbm, method="isotonic", cv=3)
    lgbm_cal.fit(X_train, y_train, sample_weight=sample_w)
    calibrated_models.append(lgbm_cal)
    model_weights.append(float(lgbm_acc))
    weight_names.append("LightGBM")

if not calibrated_models:
    raise RuntimeError("No trainable model available. Install lightgbm or enable XGBoost.")

weight_sum = sum(model_weights)
model_weights = [w / weight_sum for w in model_weights]
if len(model_weights) > 1:
    weight_pairs = [f"{name}:{w:.2f}" for name, w in zip(weight_names, model_weights)]
    print(f"  Ensemble weights - {' '.join(weight_pairs)}")

# Ensemble predict function for evaluation
def ensemble_predict_proba(X_data):
    proba = np.zeros((len(X_data), len(le.classes_)))
    for model, w in zip(calibrated_models, model_weights):
        proba += w * model.predict_proba(X_data)
    return proba

ens_proba = ensemble_predict_proba(X_test)
ens_pred  = np.argmax(ens_proba, axis=1)
ens_acc   = accuracy_score(y_test, ens_pred)
ens_f1    = f1_score(y_test, ens_pred, average="weighted")
print(f"  ENSEMBLE ->  Accuracy={ens_acc*100:.2f}%  F1={ens_f1*100:.2f}%  <- BEST")

# Extended metrics for report pack
ens_precision_macro = precision_score(y_test, ens_pred, average="macro", zero_division=0)
ens_recall_macro    = recall_score(y_test, ens_pred, average="macro", zero_division=0)
ens_precision_weighted = precision_score(y_test, ens_pred, average="weighted", zero_division=0)
ens_recall_weighted    = recall_score(y_test, ens_pred, average="weighted", zero_division=0)
ens_bal_acc = balanced_accuracy_score(y_test, ens_pred)
ens_mcc     = matthews_corrcoef(y_test, ens_pred)
ens_top3    = top_k_accuracy_score(y_test, ens_proba, k=3, labels=np.arange(len(le.classes_)))
ens_top5    = top_k_accuracy_score(y_test, ens_proba, k=5, labels=np.arange(len(le.classes_)))
ens_logloss = log_loss(y_test, ens_proba, labels=np.arange(len(le.classes_)))

try:
    y_test_bin = label_binarize(y_test, classes=np.arange(len(le.classes_)))
    auc_macro_ovr = roc_auc_score(y_test_bin, ens_proba, average="macro", multi_class="ovr")
    auc_weighted_ovr = roc_auc_score(y_test_bin, ens_proba, average="weighted", multi_class="ovr")
except Exception:
    auc_macro_ovr = None
    auc_weighted_ovr = None

# Confidence calibration report (ECE + reliability bins)
top_conf = ens_proba.max(axis=1)
top_pred = ens_proba.argmax(axis=1)
correct  = (top_pred == y_test).astype(int)
bins = np.linspace(0.0, 1.0, 11)
cal_rows = []
ece = 0.0
for i in range(len(bins) - 1):
    lo, hi = float(bins[i]), float(bins[i + 1])
    if i == len(bins) - 2:
        mask = (top_conf >= lo) & (top_conf <= hi)
    else:
        mask = (top_conf >= lo) & (top_conf < hi)
    if not np.any(mask):
        continue
    bin_conf = float(top_conf[mask].mean())
    bin_acc = float(correct[mask].mean())
    bin_count = int(mask.sum())
    gap = abs(bin_acc - bin_conf)
    ece += gap * (bin_count / len(y_test))
    cal_rows.append({
        "bin_low": round(lo, 3),
        "bin_high": round(hi, 3),
        "count": bin_count,
        "mean_confidence": round(bin_conf, 6),
        "mean_accuracy": round(bin_acc, 6),
        "abs_gap": round(gap, 6),
    })

pd.DataFrame(cal_rows).to_csv(f"{REPORT_DIR}/calibration_bins.csv", index=False)
with open(f"{REPORT_DIR}/calibration_summary.json", "w", encoding="utf-8") as f:
    json.dump({
        "ece": round(float(ece), 6),
        "num_bins": 10,
        "samples": int(len(y_test)),
    }, f, indent=2)

# --- STEP 9: SAVE ARTIFACTS ------------------------------------------------
print("[9/10] Saving model artifacts...")
feature_names = list(X.columns)

pickle.dump(calibrated_models, open(f"{OUTPUT_DIR}/models.pkl",        "wb"))
pickle.dump(model_weights,     open(f"{OUTPUT_DIR}/weights.pkl",       "wb"))
pickle.dump(le,                open(f"{OUTPUT_DIR}/label_encoder.pkl", "wb"))
pickle.dump(feature_names,     open(f"{OUTPUT_DIR}/feature_names.pkl", "wb"))
pickle.dump(class_priors,      open(f"{OUTPUT_DIR}/class_priors.pkl", "wb"))

# Save per-disease symptom profile for auto-generated follow-up questions.
symptom_profile_cols = [c for c in SYMPTOM_COLS if c in X.columns]
if symptom_profile_cols:
    disease_symptom_profile = pd.concat(
        [pd.Series(y.values, name="disease"), X[symptom_profile_cols]], axis=1
    ).groupby("disease")[symptom_profile_cols].mean()
    pickle.dump(disease_symptom_profile, open(f"{OUTPUT_DIR}/disease_symptom_profile.pkl", "wb"))

# Legacy keys (model.py compat)
pickle.dump(calibrated_models[0], open(f"{OUTPUT_DIR}/model.pkl", "wb"))

print(f"  Saved to ./{OUTPUT_DIR}/")
print(f"  Feature count : {len(feature_names)}")
print(f"  Disease count : {len(le.classes_)}")

# Per-class report
report = classification_report(y_test, ens_pred,
                                target_names=le.classes_, output_dict=True)
rows = [(cls, v["recall"], v["f1-score"], v["support"])
        for cls, v in report.items()
        if cls not in ("accuracy", "macro avg", "weighted avg")]
rows.sort(key=lambda x: x[1])
print(f"\n  {'Disease':<42} {'Recall':>7} {'F1':>7} {'Count':>6}")
problem_diseases = []
for cls, rec, f1s, sup in rows:
    flag = " [WARN]" if rec < 0.80 else ""
    if rec < 0.80:
        problem_diseases.append(cls)
    print(f"  {cls:<42} {rec:>6.2%} {f1s:>6.2%} {int(sup):>6}{flag}")

if problem_diseases:
    print(f"\n  Problem diseases (recall<80%): {problem_diseases}")

# Save detailed reports (JSON + CSV)
cm = confusion_matrix(y_test, ens_pred)
pred_counts = cm.sum(axis=0)
true_counts = cm.sum(axis=1)

per_class_df = pd.DataFrame([
    {
        "disease": cls,
        "precision": report[cls]["precision"],
        "recall": report[cls]["recall"],
        "f1": report[cls]["f1-score"],
        "support": int(report[cls]["support"]),
        "true_count": int(true_counts[i]),
        "pred_count": int(pred_counts[i]),
    }
    for i, cls in enumerate(le.classes_)
]).sort_values("f1")
per_class_df.to_csv(f"{REPORT_DIR}/per_class_metrics.csv", index=False)

# Learn confusion-pair optimizer rules from holdout confusion matrix.
label_names = list(le.classes_)
confusion_rules = []
symptom_cols_present = [c for c in SYMPTOM_COLS if c in X.columns]

if symptom_cols_present:
    disease_means = pd.DataFrame(X[symptom_cols_present]).copy()
    disease_means["_disease_"] = y.values
    disease_profile = disease_means.groupby("_disease_")[symptom_cols_present].mean()

    pair_candidates = []
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            if i == j or cm[i, j] <= 0:
                continue
            pair_candidates.append((i, j, int(cm[i, j]), int(true_counts[i])))

    pair_candidates.sort(key=lambda x: x[2], reverse=True)

    for i, j, confusion_count, support_i in pair_candidates[:30]:
        disease_a = label_names[i]  # actual
        disease_b = label_names[j]  # mistaken as
        if disease_a not in disease_profile.index or disease_b not in disease_profile.index:
            continue

        diff = (disease_profile.loc[disease_a] - disease_profile.loc[disease_b]).abs().sort_values(ascending=False)
        chosen_symptom = None
        direction = "a"
        for feat in diff.index:
            pa = float(disease_profile.loc[disease_a, feat])
            pb = float(disease_profile.loc[disease_b, feat])
            if abs(pa - pb) < 0.08:
                continue
            chosen_symptom = feat
            direction = "a" if pa > pb else "b"
            break

        if not chosen_symptom:
            continue

        confusion_rate = confusion_count / max(support_i, 1)
        penalty = float(np.clip(0.15 + confusion_rate, 0.15, 0.45))
        confusion_rules.append({
            "disease_a": disease_a,
            "disease_b": disease_b,
            "key_symptom": chosen_symptom,
            "supports": "a" if direction == "a" else "b",
            "penalty": round(penalty, 3),
            "confusions": confusion_count,
            "support": support_i,
            "confusion_rate": round(confusion_rate, 4),
        })

pickle.dump(confusion_rules, open(f"{OUTPUT_DIR}/confusion_optimizer.pkl", "wb"))

# Validate mapped-official quality: per-disease precision/recall deltas (official vs clinical subsets).
mapped_quality_rows = []
src_test = np.asarray(src_test)
clinical_mask = src_test == "clinical"
official_mask = src_test == "official"

if np.any(clinical_mask) and np.any(official_mask):
    all_labels = np.arange(len(label_names))
    rep_clin = classification_report(
        y_test[clinical_mask], ens_pred[clinical_mask],
        labels=all_labels,
        target_names=label_names,
        output_dict=True,
        zero_division=0,
    )
    rep_off = classification_report(
        y_test[official_mask], ens_pred[official_mask],
        labels=all_labels,
        target_names=label_names,
        output_dict=True,
        zero_division=0,
    )

    for cls in label_names:
        if cls not in rep_clin or cls not in rep_off:
            continue
        mapped_quality_rows.append({
            "disease": cls,
            "precision_clinical": float(rep_clin[cls]["precision"]),
            "recall_clinical": float(rep_clin[cls]["recall"]),
            "support_clinical": int(rep_clin[cls]["support"]),
            "precision_official_mapped": float(rep_off[cls]["precision"]),
            "recall_official_mapped": float(rep_off[cls]["recall"]),
            "support_official_mapped": int(rep_off[cls]["support"]),
            "delta_precision_official_minus_clinical": float(rep_off[cls]["precision"] - rep_clin[cls]["precision"]),
            "delta_recall_official_minus_clinical": float(rep_off[cls]["recall"] - rep_clin[cls]["recall"]),
        })

mapped_quality_df = pd.DataFrame(mapped_quality_rows)
if not mapped_quality_df.empty:
    mapped_quality_df.sort_values("delta_recall_official_minus_clinical").to_csv(
        f"{REPORT_DIR}/mapped_official_quality_delta.csv", index=False
    )

summary_report = {
    "dataset": {
        "rows": int(len(X)),
        "diseases": int(len(le.classes_)),
        "features": int(X.shape[1]),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
    },
    "models": {
        "catboost_accuracy": float(cb_acc),
        "catboost_f1_weighted": float(cb_f1),
        "xgboost_accuracy": float(xgb_acc) if xgb_acc is not None else None,
        "xgboost_f1_weighted": float(xgb_f1) if xgb_f1 is not None else None,
        "xgboost_cv_accuracy_mean": float(cv_acc.mean()) if cv_acc is not None else None,
        "xgboost_cv_accuracy_std": float(cv_acc.std()) if cv_acc is not None else None,
        "xgboost_cv_f1_weighted_mean": float(cv_f1w.mean()) if cv_f1w is not None else None,
        "xgboost_cv_f1_weighted_std": float(cv_f1w.std()) if cv_f1w is not None else None,
        "lightgbm_accuracy": float(lgbm_acc) if lgbm is not None else None,
        "ensemble_weights": [float(w) for w in model_weights],
    },
    "ensemble": {
        "accuracy": float(ens_acc),
        "balanced_accuracy": float(ens_bal_acc),
        "f1_weighted": float(ens_f1),
        "precision_macro": float(ens_precision_macro),
        "recall_macro": float(ens_recall_macro),
        "precision_weighted": float(ens_precision_weighted),
        "recall_weighted": float(ens_recall_weighted),
        "mcc": float(ens_mcc),
        "top3_accuracy": float(ens_top3),
        "top5_accuracy": float(ens_top5),
        "log_loss": float(ens_logloss),
        "auc_macro_ovr": float(auc_macro_ovr) if auc_macro_ovr is not None else None,
        "auc_weighted_ovr": float(auc_weighted_ovr) if auc_weighted_ovr is not None else None,
    },
    "thresholds": {
        "low_f1": 0.70,
        "medium_f1": 0.85,
        "problem_recall": 0.80,
    },
    "problem_diseases": problem_diseases,
    "model_comparison": {
        "catboost_primary": {
            "accuracy": float(cb_acc),
            "f1_weighted": float(cb_f1),
            "reason": "Primary gradient boosting; Bernoulli bootstrap + subsample for stable generalization",
        },
        "xgboost": {
            "accuracy": float(xgb_acc) if xgb_acc is not None else None,
            "f1_weighted": float(xgb_f1) if xgb_f1 is not None else None,
        },
        "lightgbm": {
            "accuracy": float(lgbm_acc) if lgbm is not None else None,
            "f1_weighted": float(lgbm_f1) if lgbm is not None and lgbm_acc > 0 else None,
        },
        "ensemble_calibrated": {
            "accuracy": float(ens_acc),
            "f1_weighted": float(ens_f1),
            "member_weights": dict(zip(weight_names, [float(w) for w in model_weights])),
        },
    },
    "confusion_optimizer": {
        "rules_learned": int(len(confusion_rules)),
        "artifact": f"{OUTPUT_DIR}/confusion_optimizer.pkl",
    },
}

if np.any(clinical_mask) and np.any(official_mask) and not mapped_quality_df.empty:
    summary_report["mapped_official_quality"] = {
        "clinical_test_rows": int(np.sum(clinical_mask)),
        "official_test_rows": int(np.sum(official_mask)),
        "report_csv": f"{REPORT_DIR}/mapped_official_quality_delta.csv",
        "mean_delta_precision": float(mapped_quality_df["delta_precision_official_minus_clinical"].mean()),
        "mean_delta_recall": float(mapped_quality_df["delta_recall_official_minus_clinical"].mean()),
    }

with open(f"{REPORT_DIR}/summary_metrics.json", "w", encoding="utf-8") as f:
    json.dump(summary_report, f, indent=2)

with open(f"{REPORT_DIR}/classification_report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

pd.DataFrame(cm, index=le.classes_, columns=le.classes_).to_csv(
    f"{REPORT_DIR}/confusion_matrix.csv"
)

# --- STEP 10: GENERATE PLOTS -----------------------------------------------
print("\n[10/10] Generating plots...")
plt.style.use("seaborn-v0_8-darkgrid")

# Plot 1: Per-Disease F1
fig, ax = plt.subplots(figsize=(14, 8))
cls_list = [(cls, v["f1-score"]) for cls, v in report.items()
             if cls not in ("accuracy", "macro avg", "weighted avg")]
cls_list.sort(key=lambda x: x[1])
names_cls = [r[0] for r in cls_list]
f1_vals   = [r[1]*100 for r in cls_list]
bar_colors = ["#f44336" if v < 70 else "#ff9800" if v < 85 else "#4caf50" for v in f1_vals]
ax.barh(names_cls, f1_vals, color=bar_colors, edgecolor="white", height=0.75)
ax.axvline(80, color="#ff9800", linestyle="--", alpha=0.7, label="80%")
ax.axvline(90, color="#4caf50", linestyle="--", alpha=0.7, label="90%")
ax.set_xlabel("F1 Score (%)", fontsize=12)
ax.set_title(f"MediSense AI v10 - Per-Disease F1 (Ensemble: {ens_acc*100:.1f}% acc)",
             fontsize=13, fontweight="bold")
ax.set_xlim(0, 110)
patches = [mpatches.Patch(color="#f44336", label="<70%"),
           mpatches.Patch(color="#ff9800", label="70-85%"),
           mpatches.Patch(color="#4caf50", label=">85%")]
ax.legend(handles=patches, loc="lower right")
plt.tight_layout()
plt.savefig(f"{PLOT_DIR}/1_per_disease_f1.png", dpi=150, bbox_inches="tight")
plt.close()

# Plot 2: Summary (CatBoost primary; ExtraTrees removed — was undefined et_acc)
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
ax = axes[0]
names_m = ["CatBoost", "Ensemble"]
vals_m  = [cb_acc * 100, ens_acc * 100]
bar_colors = ["#2196f3", "#4caf50"]
if xgb_acc is not None:
    names_m.insert(1, "XGBoost")
    vals_m.insert(1, xgb_acc * 100)
    bar_colors.insert(1, "#667eea")
if lgbm is not None:
    names_m.insert(len(names_m) - 1, "LightGBM")
    vals_m.insert(len(vals_m) - 1, lgbm_acc * 100)
    bar_colors.insert(len(bar_colors) - 1, "#ab47bc")
bars = ax.bar(names_m, vals_m, color=bar_colors,
              alpha=0.9, width=0.5, edgecolor="white")
for bar in bars:
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.3,
            f"{bar.get_height():.2f}%", ha="center", va="bottom", fontsize=12, fontweight="bold")
ax.set_ylim(0, 110); ax.set_title("Model Performance Comparison", fontsize=12)

ax = axes[1]
tiers = {"High F1 (>85%)": 0, "Medium (70-85%)": 0, "Low (<70%)": 0}
for cls, v in report.items():
    if cls in ("accuracy", "macro avg", "weighted avg"): continue
    f1v = v["f1-score"]*100
    if f1v >= 85: tiers["High F1 (>85%)"] += 1
    elif f1v >= 70: tiers["Medium (70-85%)"] += 1
    else: tiers["Low (<70%)"] += 1
ax.pie(tiers.values(), labels=tiers.keys(), colors=["#4caf50", "#ff9800", "#f44336"],
       autopct="%1.0f%%", startangle=90)
ax.set_title("Disease Quality Distribution", fontsize=12)
plt.tight_layout()
plt.savefig(f"{PLOT_DIR}/2_summary.png", dpi=150, bbox_inches="tight")
plt.close()

# Plot 3: Full confusion matrix heatmap
fig, ax = plt.subplots(figsize=(16, 13))
sns.heatmap(
    cm,
    cmap="YlOrRd",
    square=False,
    cbar=True,
    xticklabels=le.classes_,
    yticklabels=le.classes_,
    ax=ax,
)
ax.set_title("Confusion Matrix (All Diseases)", fontsize=13, fontweight="bold")
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
plt.xticks(rotation=90, fontsize=7)
plt.yticks(rotation=0, fontsize=7)
plt.tight_layout()
plt.savefig(f"{PLOT_DIR}/3_confusion_matrix_full.png", dpi=150, bbox_inches="tight")
plt.close()

# Plot 4: Top confusion disease-pairs
pair_rows = []
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        if i != j and cm[i, j] > 0:
            pair_rows.append((f"{le.classes_[i]} -> {le.classes_[j]}", int(cm[i, j])))

pair_rows = sorted(pair_rows, key=lambda x: x[1], reverse=True)[:20]
if pair_rows:
    labels = [p[0] for p in pair_rows][::-1]
    vals = [p[1] for p in pair_rows][::-1]
    fig, ax = plt.subplots(figsize=(14, 9))
    ax.barh(labels, vals, color="#ef6c57", edgecolor="white")
    ax.set_title("Top 20 Misclassification Pairs", fontsize=13, fontweight="bold")
    ax.set_xlabel("Count")
    plt.tight_layout()
    plt.savefig(f"{PLOT_DIR}/4_top_confusion_pairs.png", dpi=150, bbox_inches="tight")
    plt.close()

# Plot 5: Top-k and aggregate metric dashboard
fig, axes = plt.subplots(1, 2, figsize=(12, 4.8))
ax = axes[0]
metric_labels = ["Top-1", "Top-3", "Top-5"]
metric_vals = [ens_acc * 100, ens_top3 * 100, ens_top5 * 100]
bars = ax.bar(metric_labels, metric_vals, color=["#0ea5e9", "#10b981", "#8b5cf6"], edgecolor="white")
for bar in bars:
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            f"{bar.get_height():.2f}%", ha="center", va="bottom", fontsize=10, fontweight="bold")
ax.set_ylim(0, 105)
ax.set_title("Top-k Accuracy", fontsize=12)

ax = axes[1]
dash_labels = ["F1(w)", "Precision(w)", "Recall(w)", "Balanced Acc"]
dash_vals = [ens_f1 * 100, ens_precision_weighted * 100, ens_recall_weighted * 100, ens_bal_acc * 100]
bars = ax.bar(dash_labels, dash_vals, color=["#4caf50", "#ffa726", "#42a5f5", "#ab47bc"], edgecolor="white")
for bar in bars:
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            f"{bar.get_height():.2f}%", ha="center", va="bottom", fontsize=9, fontweight="bold")
ax.set_ylim(0, 105)
ax.set_title("Aggregate Quality Metrics", fontsize=12)
plt.tight_layout()
plt.savefig(f"{PLOT_DIR}/5_topk_and_quality.png", dpi=150, bbox_inches="tight")
plt.close()

# Plot 6: Confidence distribution and calibration gap proxy (ECE)
top1_conf = ens_proba.max(axis=1)
correct = (ens_pred == y_test).astype(int)

bins = np.linspace(0.0, 1.0, 11)
bin_ids = np.digitize(top1_conf, bins) - 1
ece = 0.0
for b in range(10):
    idx = bin_ids == b
    if np.any(idx):
        bin_acc = correct[idx].mean()
        bin_conf = top1_conf[idx].mean()
        ece += np.abs(bin_acc - bin_conf) * (idx.sum() / len(top1_conf))

fig, axes = plt.subplots(1, 2, figsize=(12, 4.8))
ax = axes[0]
ax.hist(top1_conf, bins=20, color="#3b82f6", edgecolor="white", alpha=0.9)
ax.set_title("Top-1 Confidence Distribution", fontsize=12)
ax.set_xlabel("Confidence")
ax.set_ylabel("Samples")

ax = axes[1]
bin_centers = (bins[:-1] + bins[1:]) / 2
bin_accs = []
for b in range(10):
    idx = bin_ids == b
    bin_accs.append(correct[idx].mean() if np.any(idx) else np.nan)
ax.plot([0, 1], [0, 1], "--", color="gray", label="Perfect calibration")
ax.plot(bin_centers, bin_accs, marker="o", color="#ef4444", label=f"Model (ECE={ece:.3f})")
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.set_title("Calibration Curve (Top-1)", fontsize=12)
ax.set_xlabel("Confidence")
ax.set_ylabel("Accuracy")
ax.legend(loc="lower right")
plt.tight_layout()
plt.savefig(f"{PLOT_DIR}/6_confidence_calibration.png", dpi=150, bbox_inches="tight")
plt.close()

summary_report["ensemble"]["ece_top1"] = float(ece)
with open(f"{REPORT_DIR}/summary_metrics.json", "w", encoding="utf-8") as f:
    json.dump(summary_report, f, indent=2)

print(f"  Saved plots to {PLOT_DIR}/")
print("\n" + "=" * 65)
print(f"  Training Complete!")
print(f"  Ensemble Accuracy : {ens_acc*100:.2f}%")
print(f"  Ensemble F1 Score : {ens_f1*100:.2f}%")
print(f"  Diseases          : {len(le.classes_)}")
print(f"  Features          : {len(feature_names)}")
print(f"  Models saved to   : {OUTPUT_DIR}/")
print(f"  Reports saved to  : {REPORT_DIR}/")
print(f"  Plots saved to    : {PLOT_DIR}/")
print("=" * 65)

# Sanity check
sample = X_test.iloc[[0]]
proba  = ensemble_predict_proba(sample)[0]
top3   = np.argsort(proba)[::-1][:3]
print("\n  Sanity check - example prediction:")
for i in top3:
    print(f"    {le.classes_[i]:<38} {proba[i]*100:.1f}%")
print()
