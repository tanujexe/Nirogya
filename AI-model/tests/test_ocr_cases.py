"""
Test Suite: OCR Laboratory Diagnostic Cases & Clinical Rules
============================================================
Validates the 8 diagnostic categories added to MediSense AI OCR engine:
  1. Anemias and Hematology
  2. Infection-related cases (Enforcing Dengue/Malaria/Typhoid/TB CBC safeguards)
  3. Kidney and urinary cases
  4. Liver and digestive cases
  5. Diabetes and metabolic cases
  6. Thyroid, hormones and calcium cases
  7. Heart, clotting and inflammation cases
  8. Vitamin and nutritional cases
"""

from src.ocr.lab_parser import analyze_lab_findings, predict_conditions_from_findings


class TestOCRCases:
    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 1: Anemias & Hematology
    # ──────────────────────────────────────────────────────────────────────────
    def test_iron_deficiency_anemia(self):
        findings = analyze_lab_findings({"hemoglobin": 8.5, "mcv": 68.0, "iron": 30.0, "ferritin": 8.0}, gender="female")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Iron Deficiency Anemia" in disease_names
        top_match = next(p for p in preds if p["disease"] == "Iron Deficiency Anemia")
        assert top_match["doctor"] in ("Hematologist", "General Physician")

    def test_aplastic_anemia_pancytopenia(self):
        findings = analyze_lab_findings({"hemoglobin": 7.0, "wbc": 2100, "platelets": 42000, "rbc": 2.2}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Aplastic Anemia" in disease_names
        top_match = next(p for p in preds if p["disease"] == "Aplastic Anemia")
        assert top_match["doctor"] == "Hematologist"

    def test_thalassemia_pattern(self):
        findings = analyze_lab_findings({"hemoglobin": 10.2, "mcv": 65.0, "mch": 20.0, "rbc": 5.8}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Thalassemia Pattern" in disease_names

    def test_hemolytic_anemia(self):
        findings = analyze_lab_findings({"hemoglobin": 8.1, "bilirubin": 3.8, "ldh": 650.0}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Hemolytic Anemia" in disease_names

    def test_polycythemia(self):
        findings = analyze_lab_findings({"hemoglobin": 19.5, "pcv": 58.0, "rbc": 6.8}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Polycythemia" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 2: Infection Safeguards & Rules
    # ──────────────────────────────────────────────────────────────────────────
    def test_dengue_safeguard_low_platelets_alone_does_not_diagnose_dengue(self):
        """CRITICAL: Isolated thrombocytopenia without NS1/symptoms must NOT be called Dengue."""
        findings = analyze_lab_findings({"platelets": 45000}, gender="male")
        preds = predict_conditions_from_findings(findings, patient_symptoms="", raw_text="Routine CBC checkup")
        disease_names = [p["disease"] for p in preds]
        assert "Dengue Fever" not in disease_names

    def test_dengue_diagnosed_when_ns1_or_symptoms_present(self):
        findings = analyze_lab_findings({"platelets": 45000}, gender="male")
        preds = predict_conditions_from_findings(
            findings,
            patient_symptoms="High fever and severe retro-orbital eye pain with petechiae",
            raw_text="Dengue NS1 Antigen: Positive"
        )
        disease_names = [p["disease"] for p in preds]
        assert "Dengue Fever" in disease_names

    def test_malaria_safeguard_and_diagnosis(self):
        # Low Hb alone without smear/rigors is not Malaria
        findings_isolated = analyze_lab_findings({"hemoglobin": 9.0}, gender="male")
        preds_isolated = predict_conditions_from_findings(findings_isolated, raw_text="Hb: 9.0")
        assert "Malaria" not in [p["disease"] for p in preds_isolated]

        # Positive smear or rigors confirms Malaria
        preds_confirmed = predict_conditions_from_findings(
            findings_isolated,
            patient_symptoms="High fever with shaking chills and rigors",
            raw_text="Peripheral blood smear: Plasmodium vivax trophozoites seen"
        )
        assert "Malaria" in [p["disease"] for p in preds_confirmed]

    def test_typhoid_safeguard_and_diagnosis(self):
        findings = analyze_lab_findings({"wbc": 4500}, gender="male")
        # Normal WBC alone is not Typhoid
        preds_isolated = predict_conditions_from_findings(findings, raw_text="WBC: 4500")
        assert "Typhoid Fever" not in [p["disease"] for p in preds_isolated]

        # Confirmed via Widal or enteric presentation
        preds_confirmed = predict_conditions_from_findings(
            findings,
            patient_symptoms="Prolonged fever and abdominal pain",
            raw_text="Widal Test: S. Typhi O titer 1:160, S. Typhi H titer 1:320 positive"
        )
        assert "Typhoid Fever" in [p["disease"] for p in preds_confirmed]

    def test_tuberculosis_safeguard_and_diagnosis(self):
        findings = analyze_lab_findings({"esr": 65}, gender="male")
        preds_isolated = predict_conditions_from_findings(findings, raw_text="ESR: 65 mm/hr")
        assert "Tuberculosis" not in [p["disease"] for p in preds_isolated]

        preds_confirmed = predict_conditions_from_findings(
            findings,
            patient_symptoms="Chronic cough, night sweats, and weight loss",
            raw_text="Sputum GeneXpert / AFB: Mycobacterium tuberculosis detected"
        )
        assert "Tuberculosis" in [p["disease"] for p in preds_confirmed]

    def test_sepsis_critical_markers(self):
        findings = analyze_lab_findings({"lactate": 4.5, "procalcitonin": 6.2, "wbc": 18500}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Sepsis" in disease_names
        sepsis_match = next(p for p in preds if p["disease"] == "Sepsis")
        assert "Emergency" in sepsis_match["doctor"]

    def test_isolated_leukocytosis(self):
        findings = analyze_lab_findings({"wbc": 16000}, gender="male")
        preds = predict_conditions_from_findings(findings, raw_text="WBC: 16000")
        disease_names = [p["disease"] for p in preds]
        assert "Leukocytosis" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 3: Kidney & Urinary Cases
    # ──────────────────────────────────────────────────────────────────────────
    def test_acute_kidney_injury(self):
        findings = analyze_lab_findings({"creatinine": 3.4, "urea": 95.0}, gender="male")
        preds = predict_conditions_from_findings(findings, patient_symptoms="sudden reduced urine output")
        disease_names = [p["disease"] for p in preds]
        assert "Acute Kidney Injury" in disease_names

    def test_chronic_kidney_disease(self):
        findings = analyze_lab_findings({"creatinine": 2.8, "egfr": 28.0, "uacr": 350.0}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Chronic Kidney Disease" in disease_names

    def test_nephrotic_syndrome(self):
        findings = analyze_lab_findings({"protein_urine": 300.0, "albumin": 2.1}, gender="female")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Nephrotic Syndrome" in disease_names

    def test_pyelonephritis(self):
        findings = analyze_lab_findings({"pus_cells": 35.0, "wbc": 14000}, gender="female")
        preds = predict_conditions_from_findings(
            findings,
            patient_symptoms="High fever, chills, painful urination and severe right flank pain"
        )
        disease_names = [p["disease"] for p in preds]
        assert "Pyelonephritis" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 4: Liver & Digestive Cases
    # ──────────────────────────────────────────────────────────────────────────
    def test_acute_pancreatitis(self):
        findings = analyze_lab_findings({"lipase": 320.0, "amylase": 280.0}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Acute Pancreatitis" in disease_names
        top_match = next(p for p in preds if p["disease"] == "Acute Pancreatitis")
        assert top_match["doctor"] == "Gastroenterologist"

    def test_cholestasis(self):
        findings = analyze_lab_findings({"alkaline_phosphatase": 380.0, "ggt": 140.0, "bilirubin": 3.5}, gender="female")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Cholestasis" in disease_names

    def test_hepatitis_viral_serology(self):
        findings = analyze_lab_findings({"sgpt": 240.0, "sgot": 190.0}, gender="male")
        preds = predict_conditions_from_findings(findings, raw_text="HBsAg: Reactive / Positive for Hepatitis B surface antigen")
        disease_names = [p["disease"] for p in preds]
        assert "Hepatitis B" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 5: Diabetes & Metabolic Cases
    # ──────────────────────────────────────────────────────────────────────────
    def test_diabetic_ketoacidosis(self):
        findings = analyze_lab_findings({"blood_sugar": 360.0, "ketones_urine": 3.0}, gender="male")
        preds = predict_conditions_from_findings(findings, raw_text="Urine Ketones: Large (+++)")
        disease_names = [p["disease"] for p in preds]
        assert "Diabetic Ketoacidosis" in disease_names

    def test_diabetes_vs_prediabetes(self):
        # Type 2 Diabetes criteria: fasting glucose >= 126 or HbA1c >= 6.5
        findings_dm = analyze_lab_findings({"blood_sugar": 145.0, "hba1c": 7.4}, gender="male")
        preds_dm = predict_conditions_from_findings(findings_dm)
        assert "Type 2 Diabetes" in [p["disease"] for p in preds_dm]

        # Prediabetes criteria: fasting glucose 100-125 or HbA1c 5.7-6.4
        findings_pre = analyze_lab_findings({"blood_sugar": 112.0, "hba1c": 6.0}, gender="female")
        preds_pre = predict_conditions_from_findings(findings_pre)
        assert "Prediabetes" in [p["disease"] for p in preds_pre]

    def test_gout_vs_hyperuricemia(self):
        findings = analyze_lab_findings({"uric_acid": 9.4}, gender="male")
        # Asymptomatic -> Hyperuricemia
        preds_asymptomatic = predict_conditions_from_findings(findings, patient_symptoms="")
        assert "Hyperuricemia" in [p["disease"] for p in preds_asymptomatic]

        # Acute podagra / joint pain -> Gout
        preds_gout = predict_conditions_from_findings(findings, patient_symptoms="Sudden severe big toe joint pain and redness")
        assert "Gout" in [p["disease"] for p in preds_gout]

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 6: Thyroid, Hormones & Calcium
    # ──────────────────────────────────────────────────────────────────────────
    def test_primary_hyperparathyroidism(self):
        findings = analyze_lab_findings({"calcium": 12.2, "pth": 140.0}, gender="female")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Primary Hyperparathyroidism" in disease_names

    def test_hashimoto_thyroiditis(self):
        findings = analyze_lab_findings({"tsh": 14.5, "ft4": 0.5}, gender="female")
        preds = predict_conditions_from_findings(findings, raw_text="Anti-TPO antibodies: 250 IU/mL (Strongly Positive)")
        disease_names = [p["disease"] for p in preds]
        assert "Hashimoto Thyroiditis" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 7: Heart, Clotting & Inflammation
    # ──────────────────────────────────────────────────────────────────────────
    def test_myocardial_infarction_troponin(self):
        findings = analyze_lab_findings({"troponin_i": 1.8}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Myocardial Infarction" in disease_names
        top_match = next(p for p in preds if p["disease"] == "Myocardial Infarction")
        assert top_match["doctor"] == "Cardiologist"

    def test_heart_failure_bnp(self):
        findings = analyze_lab_findings({"bnp": 450.0}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Heart Failure" in disease_names

    def test_disseminated_intravascular_coagulation(self):
        findings = analyze_lab_findings({"platelets": 48000, "d_dimer": 4.8, "inr": 2.6}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Disseminated Intravascular Coagulation" in disease_names

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 8: Vitamin & Nutritional Deficiencies
    # ──────────────────────────────────────────────────────────────────────────
    def test_vitamin_d_and_b12(self):
        findings = analyze_lab_findings({"vitamin_d": 14.0, "vitamin_b12": 110.0}, gender="female")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Vitamin D Deficiency" in disease_names
        assert "Vitamin B12 Deficiency" in disease_names

    def test_protein_energy_malnutrition(self):
        findings = analyze_lab_findings({"protein": 4.8, "albumin": 2.2}, gender="male")
        preds = predict_conditions_from_findings(findings)
        disease_names = [p["disease"] for p in preds]
        assert "Protein-Energy Malnutrition" in disease_names
