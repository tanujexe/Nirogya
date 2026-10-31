"""
MediSense AI — Specialist & Doctor Matching
===========================================
Maps predicted diseases and clinical conditions to specialist departments,
with doctor directory matching.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
from config.settings import DOCTORS_CSV_PATH

# Comprehensive Disease & Lab Findings Specialist Map
SPECIALIST_MAP: Dict[str, str] = {
    # 1. Anemias and Hematology
    "Iron Deficiency Anemia": "Hematologist",
    "Vitamin B12 Deficiency": "General Physician",
    "Folate Deficiency": "General Physician",
    "Hemolytic Anemia": "Hematologist",
    "Aplastic Anemia": "Hematologist",
    "Thalassemia Pattern": "Hematologist",
    "Sickle Cell Disease": "Hematologist",
    "Polycythemia": "Hematologist",
    "Anemia (Iron Deficiency)": "Hematologist",
    "Leukemia": "Oncologist",

    # 2. Infection-related cases
    "Dengue Fever": "General Physician",
    "Malaria": "General Physician",
    "Typhoid Fever": "General Physician",
    "Tuberculosis": "Pulmonologist",
    "Urinary Tract Infection": "Urologist",
    "Sepsis": "Emergency / Critical Care Team",
    "Leukocytosis": "General Physician",
    "Infectious Mononucleosis": "General Physician",
    "Infection / Inflammation": "General Physician",
    "COVID-19": "Pulmonologist",
    "Pneumonia": "Pulmonologist",
    "Common Cold": "General Physician",
    "Influenza (Flu)": "General Physician",
    "HIV/AIDS": "Infectious Disease Specialist",
    "Leptospirosis": "General Physician",
    "Chikungunya": "General Physician",

    # 3. Kidney and urinary cases
    "Acute Kidney Injury": "Nephrologist",
    "Chronic Kidney Disease": "Nephrologist",
    "Kidney Stones": "Urologist",
    "Nephrotic Syndrome": "Nephrologist",
    "Glomerulonephritis": "Nephrologist",
    "Pyelonephritis": "Urologist",
    "Dehydration": "General Physician",
    "Urinary Protein Loss": "Nephrologist",

    # 4. Liver and digestive cases
    "Fatty Liver Disease": "Gastroenterologist",
    "Hepatitis A": "Gastroenterologist",
    "Hepatitis B": "Gastroenterologist",
    "Hepatitis C": "Gastroenterologist",
    "Hepatitis / Liver Inflammation": "Gastroenterologist",
    "Liver Disease / Malnutrition": "Gastroenterologist",
    "Liver Cirrhosis": "Gastroenterologist",
    "Cholestasis": "Gastroenterologist",
    "Acute Pancreatitis": "Gastroenterologist",
    "Celiac Disease": "Gastroenterologist",
    "Gastrointestinal Bleeding": "Gastroenterologist",
    "Peptic Ulcer Disease": "Gastroenterologist",
    "Irritable Bowel Syndrome": "Gastroenterologist",
    "Appendicitis": "General Surgeon",
    "Colorectal Cancer": "Gastroenterologist",
    "Cholera": "General Physician",

    # 5. Diabetes and metabolic cases
    "Type 2 Diabetes": "Endocrinologist",
    "Type 1 Diabetes": "Endocrinologist",
    "Prediabetes": "General Physician",
    "Diabetic Ketoacidosis": "Emergency / Critical Care Team",
    "Hypoglycemia": "General Physician",
    "Dyslipidemia": "Cardiologist",
    "Hyperuricemia": "General Physician",
    "Gout": "Rheumatologist",
    "Metabolic Syndrome": "General Physician",

    # 6. Thyroid, hormones and calcium cases
    "Hypothyroidism": "Endocrinologist",
    "Hyperthyroidism": "Endocrinologist",
    "Hashimoto Thyroiditis": "Endocrinologist",
    "Graves' Disease": "Endocrinologist",
    "Primary Hyperparathyroidism": "Endocrinologist",
    "Hypocalcemia": "Endocrinologist",
    "Hypercalcemia": "Endocrinologist",
    "Calcium Deficiency": "General Physician",
    "Calcium Disorder": "Endocrinologist",
    "Adrenal Insufficiency": "Endocrinologist",
    "Addison's Disease": "Endocrinologist",
    "Cushing's Syndrome": "Endocrinologist",

    # 7. Heart, clotting and inflammation cases
    "Myocardial Infarction": "Cardiologist",
    "Coronary Artery Disease": "Cardiologist",
    "Heart Failure": "Cardiologist",
    "Hypertension": "Cardiologist",
    "Pulmonary Embolism": "Cardiologist",
    "Elevated Inflammation Markers": "General Physician",
    "Rheumatoid Arthritis": "Rheumatologist",
    "Systemic Lupus Erythematosus": "Rheumatologist",
    "Disseminated Intravascular Coagulation": "Emergency / Critical Care Team",
    "Venous Thromboembolism": "Emergency / Critical Care Team",

    # 8. Vitamin and nutritional cases
    "Vitamin D Deficiency": "General Physician",
    "Protein-Energy Malnutrition": "General Physician",
    "Copper Deficiency": "Hematologist",
    "Electrolyte Imbalance": "General Physician",

    # Neurological / Others
    "Stroke": "Neurologist",
    "Meningitis": "Neurologist",
    "Epilepsy": "Neurologist",
    "Migraine": "Neurologist",
    "Multiple Sclerosis": "Neurologist",
    "Parkinson's Disease": "Neurologist",
    "Alzheimer's Disease": "Neurologist",
    "Lung Cancer": "Oncologist",
    "Breast Cancer": "Oncologist",
    "Osteoarthritis": "Orthopedic",
    "Osteoporosis": "Orthopedic",
    "Eczema (Atopic Dermatitis)": "Dermatologist",
    "Psoriasis": "Dermatologist",
    "Chickenpox": "Dermatologist",
    "Anxiety Disorder": "Psychiatrist",
    "Major Depressive Disorder": "Psychiatrist",
    "Conjunctivitis": "Ophthalmologist",

    # Additional Differential & Diagnostic Patterns
    "Possible Enteric Fever": "General Physician",
    "Hepatitis B infection marker": "Gastroenterologist",
    "Hepatitis C screening marker": "Gastroenterologist",
    "Possible Celiac Disease": "Gastroenterologist",
    "Possible Autoimmune Thyroid Disease": "Endocrinologist",
    "Possible Graves' Disease": "Endocrinologist",
    "Myocardial Injury": "Cardiologist",
    "Possible Rheumatoid Arthritis": "Rheumatologist",
    "Possible Connective Tissue Autoimmune Disease": "Rheumatologist",
    "Microcytic Anemia — cause undetermined": "Hematologist",
    "Megaloblastic Anemia Pattern": "Hematologist",
    "Inflammation-Associated Ferritin Elevation": "General Physician",
    "Reduced Kidney Filtration — needs chronicity assessment": "Nephrologist",
    "Possible Diabetes-Related Kidney Disease": "Nephrologist",
    "Hyperkalemia": "Nephrologist",
    "Hypokalemia": "General Physician",
    "Hyponatremia": "General Physician",
    "Hypernatremia": "General Physician",
    "Liver Injury Pattern": "Gastroenterologist",
    "Abnormal Liver-Related Markers": "Gastroenterologist",
    "Isolated ALP Elevation": "Gastroenterologist",
    "Possible Subclinical Hypothyroidism": "Endocrinologist",
    "Possible Subclinical Hyperthyroidism": "Endocrinologist",
    "Hyperglycemia with Ketones — urgent clinical review": "Emergency / Critical Care Team",
    "Severe Hypertriglyceridemia": "Cardiologist",
    "Prolonged Coagulation Test": "Hematologist",
    "Elevated D-Dimer — nonspecific": "Emergency / Critical Care Team",
    "Vitamin B12 Deficiency Pattern": "General Physician",
    "Possible Iron Restriction with Inflammation": "Hematologist",
    "Jaundice — cause needs evaluation": "Gastroenterologist",
    "Possible Urinary Tract Infection": "Urologist",
    "Possible Acute Cardiac Event — emergency assessment": "Emergency / Critical Care Team",
    "Possible Gastrointestinal Bleeding — urgent review": "Gastroenterologist",

    # Extended Comprehensive Clinical Cases
    "Severe Neutropenia / Agranulocytosis": "Hematologist",
    "Eosinophilia Pattern": "General Physician",
    "Immune Thrombocytopenia Pattern": "Hematologist",
    "Iron Overload / Hemochromatosis Pattern": "Hepatologist",
    "Reticulocytosis / Hemolytic Compensation": "Hematologist",
    "Possible HIV Infection Marker": "Infectious Disease Specialist",
    "Possible Syphilis / Treponemal Seropositivity": "Dermatologist",
    "H. pylori Infection Pattern": "Gastroenterologist",
    "Possible Chikungunya Viral Infection": "General Physician",
    "Possible Leptospirosis Infection": "General Physician",
    "Streptococcal Infection / Elevated ASO": "General Physician",
    "Ankylosing Spondylitis Pattern": "Rheumatologist",
    "Systemic Sclerosis Pattern": "Rheumatologist",
    "Sjögren's Syndrome Pattern": "Rheumatologist",
    "ANCA-Associated Vasculitis Pattern": "Nephrologist",
    "Prerenal Azotemia Pattern": "General Physician",
    "Hypomagnesemia": "General Physician",
    "Hyperphosphatemia": "Nephrologist",
    "Hypophosphatemia": "General Physician",
    "Metabolic Acidosis Pattern": "Emergency / Critical Care Team",
    "Metabolic Alkalosis Pattern": "General Physician",
    "Obstructive Jaundice / Direct Hyperbilirubinemia": "Gastroenterologist",
    "Hepatic Cirrhosis / Decompensation Pattern": "Gastroenterologist",
    "Alcohol-Related Liver Injury Pattern": "Gastroenterologist",
    "Severe Acute Liver Injury": "Gastroenterologist",
    "Intrinsic Coagulation Pathway Abnormality": "Hematologist",
    "Elevated PSA — Prostatic Evaluation Recommended": "Urologist",
    "Elevated CA-125 — Gynecologic Evaluation Recommended": "Gynecologist",
    "Elevated Gastrointestinal Tumor Marker (CEA/CA19-9)": "Gastroenterologist",
    "Positive Beta-hCG / Pregnancy Marker": "Gynecologist",
}

SPECIALIST_ALIAS: Dict[str, str] = {
    "Pulmonologist": "General Physician",
    "Oncologist": "General Physician",
    "Endocrinologist": "General Physician",
    "Gastroenterologist": "General Physician",
    "Hepatologist": "General Physician",
    "General Surgeon": "General Physician",
    "Nephrologist": "Urologist",
    "Rheumatologist": "Orthopedic",
    "Infectious Disease Specialist": "General Physician",
    "Hematologist": "General Physician",
    "Psychiatrist": "Neurologist",
    "Ophthalmologist": "General Physician",
    "Gynecologic Oncologist": "Gynecologist",
    "Emergency / Critical Care Team": "General Physician",
    "Emergency / Specialist Team": "General Physician",
}

_doctors_df: Optional[pd.DataFrame] = None


def get_specialist(disease: str) -> str:
    """Return recommended specialist for a disease or lab finding."""
    return SPECIALIST_MAP.get(disease, "General Physician")


def load_doctors_df() -> pd.DataFrame:
    """Load doctors reference dataframe."""
    global _doctors_df
    if _doctors_df is None:
        try:
            if DOCTORS_CSV_PATH.exists():
                _doctors_df = pd.read_csv(DOCTORS_CSV_PATH)
                if "Specialization" in _doctors_df.columns:
                    _doctors_df["Specialization"] = _doctors_df["Specialization"].str.strip()
            else:
                _doctors_df = pd.DataFrame()
        except Exception:
            _doctors_df = pd.DataFrame()
    return _doctors_df


def _norm_spec(spec: str, available: set) -> str:
    if spec in available:
        return spec
    mapped = SPECIALIST_ALIAS.get(spec, spec)
    return mapped if mapped in available else "General Physician"


def get_doctors_for_specialist(specialist: str, top_n: int = 3) -> List[Dict[str, Any]]:
    """Retrieve top rated doctors for a given specialty."""
    df = load_doctors_df()
    if df.empty or "Specialization" not in df.columns:
        return []
    available = set(df["Specialization"].unique())
    use_spec = _norm_spec(specialist, available)
    matched = df[df["Specialization"] == use_spec]
    if matched.empty:
        return []

    return [
        {
            "name": str(r.get("Doctor Name", "")).strip(),
            "specialization": str(r.get("Specialization", "")),
            "experience_years": int(r.get("Experience (Years)", 0)),
            "rating": float(r.get("Rating", 0)),
            "reviews": int(r.get("Reviews", 0)),
            "fees_inr": int(r.get("Fees (₹)", 0)),
            "location": str(r.get("Location", "")),
            "hospital": str(r.get("Hospital Name", "")),
            "availability": str(r.get("Availability", "")),
        }
        for _, r in matched.sort_values("Rating", ascending=False).head(top_n).iterrows()
    ]


def get_doctor_recommendations(predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Build specialist and doctor recommendation blocks for prediction items."""
    seen = set()
    items = []
    for pred in predictions:
        spec = pred.get("doctor", "General Physician")
        if spec not in seen:
            seen.add(spec)
            docs = get_doctors_for_specialist(spec)
            if docs:
                items.append({
                    "specialist": spec,
                    "for_diseases": [p["disease"] for p in predictions if p.get("doctor") == spec],
                    "doctors": docs,
                })
    return {"city": "Gwalior", "items": items}
