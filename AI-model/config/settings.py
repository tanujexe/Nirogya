"""
MediSense AI — Central Settings and Configuration
=================================================
Manages all paths, environment variables, model directories, and service settings.
"""

import os
from pathlib import Path

# Base directory of the AI-model project
BASE_DIR = Path(__file__).resolve().parent.parent

# Server configuration
PORT = int(os.environ.get("PORT", "5002"))
HOST = os.environ.get("HOST", "0.0.0.0")
DEBUG = os.environ.get("DEBUG", "False").strip().lower() in ("true", "1")

# Uploads directory for lab report analysis
UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Data paths with backwards compatibility fallback
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
REF_DATA_DIR = BASE_DIR / "data" / "reference"

DOCTORS_CSV_CANDIDATES = [
    REF_DATA_DIR / "gwalior_doctors_dataset.csv",
    BASE_DIR / "gwalior_doctors_dataset.csv",
]
DOCTORS_CSV_PATH = next((p for p in DOCTORS_CSV_CANDIDATES if p.exists()), DOCTORS_CSV_CANDIDATES[0])

# Artifacts paths with fallback to model_artifacts
MODELS_DIR_CANDIDATES = [
    BASE_DIR / "artifacts" / "models",
    BASE_DIR / "model_artifacts",
]
ARTIFACTS_DIR = next((p for p in MODELS_DIR_CANDIDATES if (p / "label_encoder.pkl").exists()), MODELS_DIR_CANDIDATES[1])

REPORTS_DIR = BASE_DIR / "artifacts" / "reports"
if not REPORTS_DIR.exists() and (BASE_DIR / "model_artifacts" / "reports").exists():
    REPORTS_DIR = BASE_DIR / "model_artifacts" / "reports"

# External API Keys
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()

# OCR / Tesseract Config
TESSERACT_CMD = os.environ.get("TESSERACT_CMD", "").strip()

# Max content size for Flask uploads (32 MB)
MAX_CONTENT_LENGTH = 32 * 1024 * 1024
