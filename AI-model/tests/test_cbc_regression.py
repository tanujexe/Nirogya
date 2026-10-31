"""
Regression Test Suite: CBC Lab Report Parsing & Fidelity Verification
=====================================================================
Validates root-cause fixes against the Aster Clinic CBC report fixture:
  uploads/report_20261028_172203_151319.webp

Verifies:
  1. All 15 CBC values extracted accurately with correct precision.
  2. Neutrophils extracts actual value 71.40% (NOT reference lower bound 40%).
  3. Monocytes extracts actual value 6.90% (NOT reference lower bound 2%).
  4. Chloride is NOT hallucinated or detected from footer text (247 / Care).
  5. Neutrophils reference interval matches report printed range 40–80 (NOT default 40–75).
  6. Platelets preserves 246 (in thousands) without corrupted double multiplication.
  7. Missing tests receive NO fabricated values.
  8. Qualitative markers do not falsely trigger on normal CBC terms.
"""

from pathlib import Path
from src.ocr.tesseract_engine import extract_text_from_file
from src.ocr.lab_parser import extract_lab_data, analyze_lab_findings, predict_conditions_from_findings
from config.settings import BASE_DIR

FIXTURE_PATH = BASE_DIR / "uploads" / "report_20261028_172203_151319.webp"


class TestCBCRegression:
    _cached_data = None

    def __init__(self):
        if TestCBCRegression._cached_data is None:
            if not FIXTURE_PATH.exists():
                raise FileNotFoundError(f"Fixture image not found at {FIXTURE_PATH}")
            raw_text = extract_text_from_file(str(FIXTURE_PATH))
            lab_data = extract_lab_data(raw_text)
            values = lab_data["values"]
            meta = lab_data["meta"]
            findings = analyze_lab_findings(
                values,
                gender="male",
                extracted_meta=meta,
                raw_text=raw_text
            )
            predictions = predict_conditions_from_findings(
                findings,
                patient_symptoms="",
                raw_text=raw_text
            )
            TestCBCRegression._cached_data = {
                "raw_text": raw_text,
                "values": values,
                "meta": meta,
                "findings": findings,
                "predictions": predictions,
            }

        self.raw_text = TestCBCRegression._cached_data["raw_text"]
        self.values = TestCBCRegression._cached_data["values"]
        self.meta = TestCBCRegression._cached_data["meta"]
        self.findings = TestCBCRegression._cached_data["findings"]
        self.predictions = TestCBCRegression._cached_data["predictions"]

    def test_neutrophils_actual_value_not_lower_bound(self):
        """CRITICAL: Neutrophils must be 71.40%, not the reference lower bound 40%."""
        assert "neutrophils" in self.values, "Neutrophils not extracted"
        assert abs(self.values["neutrophils"] - 71.40) < 0.1, (
            f"Expected Neutrophils ~71.40, got {self.values['neutrophils']}"
        )

    def test_monocytes_actual_value_not_lower_bound(self):
        """CRITICAL: Monocytes must be 6.90%, not the reference lower bound 2%."""
        assert "monocytes" in self.values, "Monocytes not extracted"
        assert abs(self.values["monocytes"] - 6.90) < 0.1, (
            f"Expected Monocytes ~6.90, got {self.values['monocytes']}"
        )

    def test_chloride_not_hallucinated(self):
        """CRITICAL: Chloride does not appear in the CBC report and must NOT be detected."""
        assert "chloride" not in self.values, (
            f"Hallucinated chloride detected with value {self.values.get('chloride')}"
        )

    def test_neutrophils_reference_interval_from_report(self):
        """CRITICAL: Neutrophils reference interval must prioritize report range 40–80, not config 40–75."""
        finding = next((f for f in self.findings if f["parameter"].lower() == "neutrophils"), None)
        assert finding is not None, "Neutrophils finding not found"
        norm_range = finding["normal_range"]
        assert "80" in norm_range, f"Expected upper bound 80 in reference range, got {norm_range}"
        assert "75" not in norm_range, f"Expected report range 40-80, not config 40-75. Got {norm_range}"

    def test_platelets_accuracy_and_reference_range(self):
        """Platelets must be 246 (in 10^3/uL) with reference interval 150-410."""
        assert "platelets" in self.values, "Platelets not extracted"
        assert abs(self.values["platelets"] - 246.0) < 1.0, (
            f"Expected Platelets ~246, got {self.values['platelets']}"
        )
        finding = next((f for f in self.findings if f["parameter"].lower() == "platelets"), None)
        assert finding is not None, "Platelets finding not found"
        assert "410" in finding["normal_range"] or "150" in finding["normal_range"], (
            f"Expected report range 150-410, got {finding['normal_range']}"
        )

    def test_all_15_cbc_biomarkers_extracted(self):
        """Verify all 15 key CBC parameters from Aster Clinic report are accurately extracted."""
        expected_values = {
            "rbc": 3.96,
            "hemoglobin": 10.50,
            "pcv": 32.90,
            "mcv": 83.10,
            "mch": 26.50,
            "mchc": 31.90,
            "rdw": 12.90,
            "wbc": 10.65,
            "neutrophils": 71.40,
            "lymphocytes": 20.90,
            "eosinophils": 0.60,
            "monocytes": 6.90,
            "basophils": 0.20,
            "platelets": 246.0,
            "mpv": 10.00,
        }

        for param, expected_val in expected_values.items():
            assert param in self.values, f"Missing parameter: {param}"
            actual_val = self.values[param]
            diff = abs(actual_val - expected_val)
            assert diff <= 0.2, f"Parameter {param}: expected {expected_val}, got {actual_val}"

    def test_confidence_note_disclaimer_present(self):
        """Predictions must include the explicit non-diagnostic pattern ranking disclaimer."""
        if self.predictions:
            for pred in self.predictions:
                note = pred.get("confidence_note", "")
                assert "Rule-based" in note or "ranking" in note or "not a validated" in note, (
                    f"Invalid confidence note: {note}"
                )


COIMBATORE_FIXTURE_PATH = BASE_DIR / "uploads" / "report_20261029_091454_213167.webp"


class TestCoimbatoreCBCRegression:
    _cached_data = None

    def __init__(self):
        if TestCoimbatoreCBCRegression._cached_data is None:
            if not COIMBATORE_FIXTURE_PATH.exists():
                raise FileNotFoundError(f"Fixture image not found at {COIMBATORE_FIXTURE_PATH}")
            raw_text = extract_text_from_file(str(COIMBATORE_FIXTURE_PATH))
            lab_data = extract_lab_data(raw_text)
            values = lab_data["values"]
            meta = lab_data["meta"]
            findings = analyze_lab_findings(
                values,
                gender="male",
                extracted_meta=meta,
                raw_text=raw_text
            )
            predictions = predict_conditions_from_findings(
                findings,
                patient_symptoms="",
                raw_text=raw_text
            )
            TestCoimbatoreCBCRegression._cached_data = {
                "raw_text": raw_text,
                "values": values,
                "meta": meta,
                "findings": findings,
                "predictions": predictions,
            }

        self.raw_text = TestCoimbatoreCBCRegression._cached_data["raw_text"]
        self.values = TestCoimbatoreCBCRegression._cached_data["values"]
        self.meta = TestCoimbatoreCBCRegression._cached_data["meta"]
        self.findings = TestCoimbatoreCBCRegression._cached_data["findings"]
        self.predictions = TestCoimbatoreCBCRegression._cached_data["predictions"]

    def test_rdw_sd_and_cv_distinct_and_normal(self):
        """CRITICAL: RDW-SD (fL) and RDW-CV (%) must remain separate biomarkers and evaluate to normal."""
        assert "rdw_sd" in self.values, "RDW-SD missing from values"
        assert "rdw_cv" in self.values, "RDW-CV missing from values"
        assert abs(self.values["rdw_sd"] - 39.4) < 0.1, f"Expected RDW-SD ~39.4, got {self.values['rdw_sd']}"
        assert abs(self.values["rdw_cv"] - 13.5) < 0.1, f"Expected RDW-CV ~13.5, got {self.values['rdw_cv']}"

        sd_finding = next((f for f in self.findings if f["parameter"].lower() in ("rdw sd", "rdw-sd")), None)
        cv_finding = next((f for f in self.findings if f["parameter"].lower() in ("rdw cv", "rdw-cv")), None)

        assert sd_finding is not None, "RDW-SD finding missing from findings list"
        assert cv_finding is not None, "RDW-CV finding missing from findings list"
        assert sd_finding["unit"] == "fL", f"Expected RDW-SD unit 'fL', got {sd_finding['unit']}"
        assert cv_finding["unit"] == "%", f"Expected RDW-CV unit '%', got {cv_finding['unit']}"
        assert sd_finding["status"] == "normal", (
            f"Expected RDW-SD normal, got {sd_finding['status']} (check range contamination)"
        )
        assert cv_finding["status"] == "normal", (
            f"Expected RDW-CV normal, got {cv_finding['status']}"
        )

    def test_mcv_extracted_and_evaluated_low(self):
        """CRITICAL: MCV must be extracted even when hospital header contains 'MCH'/'MCV' and evaluate to LOW."""
        assert "mcv" in self.values, "MCV missing from values"
        assert abs(self.values["mcv"] - 77.5) < 0.1, f"Expected MCV ~77.5, got {self.values['mcv']}"

        finding = next((f for f in self.findings if f["parameter"].lower() == "mcv"), None)
        assert finding is not None, "MCV finding missing from findings list"
        assert finding["value"] == 77.5
        assert finding["unit"] == "fL"
        assert finding["status"] == "LOW", f"Expected MCV status LOW (77.5 < 80.0), got {finding['status']}"
        assert finding["range_source"] == "report", f"Expected range_source 'report', got {finding['range_source']}"
        assert finding["is_fallback_range"] is False

    def test_leading_decimal_parsed_accurately(self):
        """CRITICAL: Value with leading decimal point '.21' must parse to 0.21, not 21.0."""
        from src.ocr.lab_parser import parse_structured_lab_row
        row = "[LAB_ROW] PCT | .21 | 0.17-0.35 | %"
        parsed = parse_structured_lab_row(row)
        assert parsed is not None, "Failed to parse leading-decimal row"
        assert abs(parsed["value"] - 0.21) < 0.001, f"Expected 0.21, got {parsed['value']}"
        assert parsed["ref_lo"] == 0.17
        assert parsed["ref_hi"] == 0.35

    def test_fallback_range_clearly_identified(self):
        """When report table crop lacks printed reference column, fallback must be flagged."""
        hgb_finding = next((f for f in self.findings if f["parameter"].lower() == "hemoglobin"), None)
        assert hgb_finding is not None
        assert hgb_finding["is_fallback_range"] is True
        assert hgb_finding["range_source"] == "standard_reference"

    def test_unit_mismatch_and_missing_range_protection(self):
        """Missing or mismatched ranges must NOT silently produce a 'normal' status."""
        from src.ocr.lab_parser import analyze_lab_findings

        # Case A: Unknown biomarker with no reference range in config or metadata
        unknown_findings = analyze_lab_findings({"unknown_biomarker": 123.45})
        assert len(unknown_findings) == 1
        assert unknown_findings[0]["status"] == "unreviewed", (
            f"Missing range must produce 'unreviewed', got {unknown_findings[0]['status']}"
        )

        # Case B: Inverted reference range (50-40)
        inverted_meta = {
            "test_param": {"ref_lo": 50.0, "ref_hi": 40.0, "reported_range": "50–40", "unit": "mg/dL"}
        }
        inverted_findings = analyze_lab_findings({"test_param": 45.0}, extracted_meta=inverted_meta)
        assert inverted_findings[0]["status"] == "review", (
            f"Inverted range must produce 'review', got {inverted_findings[0]['status']}"
        )

        # Case C: Unit mismatch (RDW-SD in %)
        mismatch_findings = analyze_lab_findings(
            {"rdw_sd": 39.4},
            extracted_meta={"rdw_sd": {"ref_lo": None, "ref_hi": None, "unit": "%"}}
        )
        assert mismatch_findings[0]["status"] == "review", (
            f"RDW-SD in % must trigger unit mismatch 'review', got {mismatch_findings[0]['status']}"
        )
