"""
Phase 2 Test Suite: Demographic-Aware Reference Ranges & Safety Rules
=====================================================================
Validates CLSI EP28-A3c compliant reference interval selection, age calculation,
missing demographic handling, unit mismatch safeguards, and report precedence.

Test Cases:
  1. Adult patient with matching interval
  2. Child with age-specific interval (e.g. child ALP, child WBC)
  3. Patient near age-group boundary (17.99 yrs vs 18.0 yrs)
  4. Missing age for age-dependent analyte (requires review, does not assume adult)
  5. Missing sex for sex-dependent analyte (requires review, does not assume male)
  6. Analyte with no approved reference interval (unreviewed, no silent normal)
  7. Valid laboratory-provided interval takes precedence over config
  8. Invalid / inverted laboratory-provided interval (flags review)
  9. Unit mismatch protection (e.g. RDW-SD in %, RDW-CV in fL)
 10. Conflicting laboratory and configured intervals
 11. Backward compatibility with existing API contract and findings schema
 12. Date of birth calculation, boundary conditions, future dates & invalid inputs
"""

from datetime import date, datetime
from typing import Dict, Any

from src.core.reference_range_engine import (
    calculate_age_from_dob,
    validate_and_calculate_demographics,
    select_reference_range,
    evaluate_analyte_value,
    get_age_group,
)
from src.ocr.lab_parser import analyze_lab_findings, NORMAL_RANGES


class TestDemographicReferenceRanges:
    """Automated verification of demographic-aware clinical reference ranges."""

    # ──────────────────────────────────────────────────────────────────────────
    # 1. Adult patient with matching interval
    # ──────────────────────────────────────────────────────────────────────────
    def test_adult_patient_matching_interval(self):
        """Adult male (35y) hemoglobin of 14.5 g/dL must match adult male range [13.5, 17.5] -> normal."""
        findings = analyze_lab_findings(
            lab={"hemoglobin": 14.5},
            patient_age=35,
            patient_sex="male"
        )
        assert len(findings) == 1
        f = findings[0]
        assert f["status"] == "normal"
        assert f["interpretation"] == "within reference interval"
        assert f["ref_lo"] == 13.5
        assert f["ref_hi"] == 17.5
        assert f["demographic_matched"] is True
        assert f["is_fallback_range"] is True
        assert f["range_source"] == "standard_reference"

    # ──────────────────────────────────────────────────────────────────────────
    # 2. Child with age-specific interval
    # ──────────────────────────────────────────────────────────────────────────
    def test_child_age_specific_intervals(self):
        """
        Child (5y) with:
          - WBC 12,000 /μL: normal for child [4500, 13500], but would be high under adult [4000, 10000].
          - ALP 220 U/L: normal for child [100, 350], but would be high under adult [44, 147].
        """
        findings = analyze_lab_findings(
            lab={"wbc": 12000, "alkaline_phosphatase": 220},
            patient_age=5,
            patient_sex="female"
        )
        wbc = next(f for f in findings if f["parameter"] == "Wbc")
        alp = next(f for f in findings if f["parameter"] == "Alkaline Phosphatase")

        # WBC: Child 2-11y is 4500-13500
        assert wbc["status"] == "normal", f"Child WBC 12000 should be normal in child range, got {wbc['status']}"
        assert wbc["ref_lo"] == 4500
        assert wbc["ref_hi"] == 13500
        assert wbc["demographic_matched"] is True

        # ALP: Child 1-11y is 100-350
        assert alp["status"] == "normal", f"Child ALP 220 should be normal in child range, got {alp['status']}"
        assert alp["ref_lo"] == 100
        assert alp["ref_hi"] == 350
        assert alp["demographic_matched"] is True

    # ──────────────────────────────────────────────────────────────────────────
    # 3. Patient near age-group boundary
    # ──────────────────────────────────────────────────────────────────────────
    def test_age_boundary_conditions(self):
        """
        At the 18.0 age boundary:
          - Patient aged 17.99 yr falls strictly into adolescent [12, 18).
          - Patient aged 18.0 yr falls strictly into adult [18, 65).
        Adolescent male hemoglobin range: [13.0, 16.0].
        Adult male hemoglobin range: [13.5, 17.5].
        Hemoglobin of 13.2 g/dL:
          - At 17.99y (adolescent): within [13.0, 16.0] -> normal.
          - At 18.0y (adult): below [13.5, 17.5] -> LOW.
        """
        adolescent_findings = analyze_lab_findings(
            lab={"hemoglobin": 13.2},
            patient_age=17.99,
            patient_sex="male"
        )
        adult_findings = analyze_lab_findings(
            lab={"hemoglobin": 13.2},
            patient_age=18.0,
            patient_sex="male"
        )

        adol_hgb = adolescent_findings[0]
        adult_hgb = adult_findings[0]

        assert adol_hgb["status"] == "normal", f"17.99y Hgb 13.2 should be normal (13.0-16.0), got {adol_hgb['status']}"
        assert adol_hgb["ref_lo"] == 13.0
        assert adol_hgb["ref_hi"] == 16.0

        assert adult_hgb["status"] == "LOW", f"18.0y Hgb 13.2 should be LOW (13.5-17.5), got {adult_hgb['status']}"
        assert adult_hgb["ref_lo"] == 13.5
        assert adult_hgb["ref_hi"] == 17.5

    # ──────────────────────────────────────────────────────────────────────────
    # 4. Missing age for age-dependent analyte
    # ──────────────────────────────────────────────────────────────────────────
    def test_missing_age_for_age_dependent_analyte(self):
        """
        When age is missing and analyte is strongly age-dependent (e.g. ALP or WBC),
        system must NOT arbitrarily assume an adult interval.
        Must flag missing age and mark as unreviewed.
        """
        findings = analyze_lab_findings(
            lab={"alkaline_phosphatase": 200},
            patient_age=None,
            patient_dob=None,
            patient_sex="male"
        )
        assert len(findings) == 1
        alp = findings[0]
        assert alp["status"] == "unreviewed"
        assert alp["interpretation"] == "unable to determine"
        assert alp["demographic_matched"] is False
        assert "missing_age_for_age_dependent_analyte" in alp["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 5. Missing or unknown sex where interval requires it
    # ──────────────────────────────────────────────────────────────────────────
    def test_missing_sex_for_sex_dependent_analyte(self):
        """
        When sex is missing for a sex-dependent analyte (e.g. Hemoglobin or Uric Acid),
        system must NOT silently default to male.
        Must flag missing sex and mark as unreviewed.
        """
        findings = analyze_lab_findings(
            lab={"hemoglobin": 13.0},
            patient_age=30,
            patient_sex=None,
            gender=None
        )
        assert len(findings) == 1
        hgb = findings[0]
        assert hgb["status"] == "unreviewed"
        assert hgb["interpretation"] == "unable to determine"
        assert hgb["demographic_matched"] is False
        assert "missing_sex_for_sex_dependent_analyte" in hgb["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 6. Analyte with no approved reference interval
    # ──────────────────────────────────────────────────────────────────────────
    def test_analyte_with_no_approved_reference_interval(self):
        """An unknown or unapproved analyte must NOT produce a false normal."""
        findings = analyze_lab_findings(
            lab={"unapproved_novel_biomarker": 55.4},
            patient_age=40,
            patient_sex="female"
        )
        assert len(findings) == 1
        f = findings[0]
        assert f["status"] == "unreviewed"
        assert f["interpretation"] == "unable to determine"
        assert f["range_source"] == "none"
        assert "no_approved_reference_range" in f["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 7. Valid laboratory-provided interval takes precedence
    # ──────────────────────────────────────────────────────────────────────────
    def test_valid_laboratory_provided_interval_precedence(self):
        """
        When the report prints a laboratory-specific range (e.g. Neutrophils 40–80%),
        it takes Priority 1 over config ranges (40–75%).
        """
        report_meta = {
            "neutrophils": {
                "ref_lo": 40.0,
                "ref_hi": 80.0,
                "reported_range": "40–80",
                "unit": "%"
            }
        }
        findings = analyze_lab_findings(
            lab={"neutrophils": 78.0},
            extracted_meta=report_meta,
            patient_age=30,
            patient_sex="male"
        )
        assert len(findings) == 1
        f = findings[0]
        # 78% is normal in [40, 80], but would be HIGH in [40, 75]
        assert f["status"] == "normal"
        assert f["interpretation"] == "within reference interval"
        assert f["range_source"] == "report"
        assert f["is_fallback_range"] is False
        assert f["ref_hi"] == 80.0

    # ──────────────────────────────────────────────────────────────────────────
    # 8. Invalid or ambiguous laboratory-provided interval
    # ──────────────────────────────────────────────────────────────────────────
    def test_invalid_inverted_laboratory_interval(self):
        """An inverted laboratory interval (e.g. 50–40) must flag for review."""
        report_meta = {
            "potassium": {
                "ref_lo": 5.0,
                "ref_hi": 3.5,  # Inverted!
                "reported_range": "5.0–3.5",
                "unit": "mEq/L"
            }
        }
        findings = analyze_lab_findings(
            lab={"potassium": 4.2},
            extracted_meta=report_meta,
            patient_age=45,
            patient_sex="male"
        )
        assert len(findings) == 1
        f = findings[0]
        assert f["status"] == "review"
        assert f["interpretation"] == "requires review"
        assert "inverted_report_range" in f["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 9. Unit mismatch protection
    # ──────────────────────────────────────────────────────────────────────────
    def test_unit_mismatch_protection(self):
        """RDW-SD reported with '%' or RDW-CV reported with 'fL' must trigger review."""
        # Case A: RDW-SD in %
        sd_meta = {"rdw_sd": {"ref_lo": None, "ref_hi": None, "unit": "%"}}
        findings_sd = analyze_lab_findings(
            lab={"rdw_sd": 42.0},
            extracted_meta=sd_meta,
            patient_age=30,
            patient_sex="male"
        )
        assert findings_sd[0]["status"] == "review"
        assert "unit_mismatch_rdw_sd_percent" in findings_sd[0]["review_flags"]

        # Case B: RDW-CV in fL
        cv_meta = {"rdw_cv": {"ref_lo": None, "ref_hi": None, "unit": "fL"}}
        findings_cv = analyze_lab_findings(
            lab={"rdw_cv": 13.0},
            extracted_meta=cv_meta,
            patient_age=30,
            patient_sex="male"
        )
        assert findings_cv[0]["status"] == "review"
        assert "unit_mismatch_rdw_cv_fl" in findings_cv[0]["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 10. Conflicting laboratory and configured ranges
    # ──────────────────────────────────────────────────────────────────────────
    def test_conflicting_laboratory_and_configured_intervals(self):
        """
        When report provides a range that differs wildly from standard physiological limits,
        an advisory warning must be recorded in review_flags.
        """
        conflicting_meta = {
            "potassium": {
                "ref_lo": 1.0,
                "ref_hi": 25.0,  # Extreme: standard is ~3.5-5.0
                "reported_range": "1.0–25.0",
                "unit": "mEq/L"
            }
        }
        findings = analyze_lab_findings(
            lab={"potassium": 4.5},
            extracted_meta=conflicting_meta,
            patient_age=50,
            patient_sex="male"
        )
        assert len(findings) == 1
        f = findings[0]
        assert "conflicting_lab_standard_range" in f["review_flags"]

    # ──────────────────────────────────────────────────────────────────────────
    # 11. Backward compatibility with existing API response schema
    # ──────────────────────────────────────────────────────────────────────────
    def test_backward_compatibility_schema(self):
        """All legacy finding fields must remain intact alongside new fields."""
        findings = analyze_lab_findings(
            lab={"creatinine": 1.0},
            patient_age=30,
            patient_sex="male"
        )
        f = findings[0]

        # Legacy fields
        expected_legacy_keys = [
            "parameter", "value", "unit", "normal_range",
            "status", "range_source", "is_fallback_range",
            "hint", "disease_hint", "reported_range"
        ]
        for k in expected_legacy_keys:
            assert k in f, f"Missing legacy key: {k}"

        # Phase 2 fields
        expected_new_keys = [
            "extracted_value", "normalized_value", "ref_lo", "ref_hi",
            "interpretation", "demographic_matched", "review_flags",
            "review_reasons", "reference_metadata"
        ]
        for k in expected_new_keys:
            assert k in f, f"Missing Phase 2 key: {k}"

    # ──────────────────────────────────────────────────────────────────────────
    # 12. Date of birth calculation validation
    # ──────────────────────────────────────────────────────────────────────────
    def test_date_of_birth_calculation_and_validation(self):
        """Validates DOB calculation, future dates, invalid calendar dates, and boundaries."""
        ref = date(2026, 10, 29)

        # A. Normal DOB
        exact_age, full_years, errs = calculate_age_from_dob("1996-10-29", reference_date=ref)
        assert len(errs) == 0
        assert full_years == 30
        assert abs(exact_age - 30.0) < 0.1

        # B. Day before birthday (should be 29, not 30)
        exact_age, full_years, errs = calculate_age_from_dob("1996-10-30", reference_date=ref)
        assert len(errs) == 0
        assert full_years == 29

        # C. Future DOB (rejected)
        _, _, errs_fut = calculate_age_from_dob("2030-01-01", reference_date=ref)
        assert len(errs_fut) > 0
        assert "future" in errs_fut[0].lower()

        # D. Impossible calendar date (Feb 31)
        _, _, errs_inv = calculate_age_from_dob("1995-02-31", reference_date=ref)
        assert len(errs_inv) > 0

        # E. Full demographic pipeline with DOB
        demog = validate_and_calculate_demographics(
            dob="2020-05-15",
            sex="Female",
            reference_date=ref
        )
        assert demog["valid"] is True
        assert demog["age_years"] == 6
        assert demog["age_group"] == "child"
        assert demog["sex"] == "female"
        assert demog["is_complete"] is True
