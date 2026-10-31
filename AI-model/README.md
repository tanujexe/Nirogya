# 🏥 MediSense AI v11.1 — Clinical Decision Support Engine

## 🌟 Overview
MediSense AI is a hybrid, production-grade Clinical Decision Support System (CDSS) providing:
- **Heuristic Safety Guardrails:** Immediate red-flag detection for emergencies (Acute Coronary Syndrome, Stroke FAST, Meningitis, Severe Hypoxia) before probabilistic ML execution.
- **Calibrated Ensemble Model:** Soft-voting ensemble of gradient-boosted decision trees (CatBoost, LightGBM, XGBoost) across 56 diseases with plausibility scoring and confusion disambiguation.
- **Hybrid NLP:** Deterministic regex + phonetic Devanagari transliteration + Hinglish normalization (<1ms) with optional Claude API fallback.
- **Laboratory Report OCR:** Multimodal lab value extraction (Images & PDFs) comparing results against physiological reference ranges with specialty doctor recommendations.
- **Multi-turn Differential Diagnostic Sessions:** Shannon entropy-based uncertainty quantification triggering targeted clarifying questions.

---

## 📁 Modular Project Structure

```text
AI-model/
├── config/                         # Centralized configuration & protocols
│   ├── settings.py                 # Paths, ports (5002), and environment settings
│   ├── reference_ranges.json       # Laboratory reference intervals
│   └── medical_protocols.json      # Curated clinical tests, diets, and expert questions
│
├── data/                           # (Git-ignored datasets)
│   ├── raw/                        # Clinical & official symptom training CSVs
│   └── reference/                  # gwalior_doctors_dataset.csv
│
├── artifacts/                      # (Git-ignored model outputs)
│   ├── models/                     # Trained weights (models.pkl, feature_names.pkl)
│   └── reports/                    # Calibration summaries, confusion matrices
│
├── src/                            # Modularized source code
│   ├── api/                        # HTTP / Web layer
│   │   ├── app.py                  # Flask application factory
│   │   └── routes/                 # Blueprints for prediction, lab report, & system routes
│   ├── core/                       # Clinical & ML Core Logic
│   │   ├── features.py             # CANONICAL 183-feature pipeline (Zero train-serve skew)
│   │   ├── predictor.py            # Soft-voting ensemble & differential inference
│   │   ├── emergency.py            # Safety-critical red flags & triage scoring
│   │   ├── specialist_matcher.py   # Doctor recommendations & specialty routing
│   │   └── session_manager.py      # Entropy & multi-turn interview manager
│   ├── nlp/                        # Language processing
│   │   ├── extractor.py            # Unified symptom & vitals extractor
│   │   ├── rule_parser.py          # Typo correction, negation, and unit parsing
│   │   ├── hinglish_lexicon.py     # Hinglish & Devanagari synonym dictionaries
│   │   └── llm_fallback.py         # Claude API client
│   ├── ocr/                        # Document Vision
│   │   ├── tesseract_engine.py     # Image preprocessing, Tesseract, WinRT OCR fallback
│   │   └── lab_parser.py           # Biochemical value extraction & status grading
│   └── storage/                    # Persistence
│       └── session_store.py        # In-Memory & Redis session backends
│
├── tests/                          # Automated Pytest / Unittest Suite
│   ├── runner.py                   # Automated test runner (python tests/runner.py)
│   ├── test_features.py            # Feature parity & schema alignment tests
│   ├── test_emergency.py           # Life-threatening emergency trigger tests
│   ├── test_nlp.py                 # English, Hinglish, & negation tests
│   └── test_api.py                 # Flask test client contract verification
│
├── scripts/                        # Maintenance & Diagnostic Tools
│   ├── check_tesseract.py          # Validates OCR environment & binaries
│   └── train_model.py              # Model training pipeline
│
├── app.py                          # Lean launcher (executes src.api.app on port 5002)
├── requirements.txt                # Project dependencies
└── .env.example                    # Environment variable template
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

*(Optional for OCR: Install Tesseract on Windows from https://github.com/UB-Mannheim/tesseract/wiki or verify with `python scripts/check_tesseract.py`)*

### Step 2: Run Verification Tests
```bash
python tests/runner.py
```
Expected output:
```text
=================================================================
  MediSense AI -- Running Automated Test Suite
=================================================================
[Suite] tests.test_features            --> 3 passed
[Suite] tests.test_emergency           --> 5 passed
[Suite] tests.test_nlp                 --> 5 passed
[Suite] tests.test_api                 --> 4 passed
[Suite] tests.test_ocr_cases           --> 29 passed
[Suite] tests.test_cbc_regression      --> 12 passed
[Suite] tests.test_demographic_ranges  --> 12 passed
-----------------------------------------------------------------
  Summary: Total=70 | Passed=70 | Failed=0
=================================================================
```

For complete clinical reference range rationale and schema details, see [`docs/demographic_reference_ranges.md`](docs/demographic_reference_ranges.md).

### Step 3: Start the Service
```bash
python app.py
```
Service will start on **`http://localhost:5002`**, ready to accept requests from the Node.js backend.

---

## 🔌 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `POST /predict` | `POST` | Primary symptom checker & triage evaluation. Accepts `text`, `age`, `gender`, `spo2`. |
| `POST /follow_up` | `POST` | Multi-turn interview reply. Accepts `session_id`, `answer`. |
| `POST /analyze-report` | `POST` | Multipart upload for lab report image/PDF. Extracts values, findings, & hints. |
| `POST /normalize-input` | `POST` | Normalizes Hindi/Hinglish text to standardized medical English tokens. |
| `GET /health` | `GET` | Service liveness and version check. |

---

## ⚠️ Medical Disclaimer
For educational and clinical decision-support research only. Not a replacement for professional clinical judgment, emergency medical services, or formal in-person physical examination.
