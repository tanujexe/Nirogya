"""
MediSense AI — Laboratory Values & Findings Parser (Clinical Edition)
=====================================================================
Extracts biochemical parameters, evaluates against biological reference ranges,
and infers candidate clinical conditions with specialty routing.

Covers all 8 major diagnostic categories:
  1. Anemias and Hematology
  2. Infection-related cases (Enforcing: Dengue, Malaria, Typhoid, TB require
     specific antigen/molecular tests or clinical symptom context, NOT CBC alone)
  3. Kidney and urinary cases
  4. Liver and digestive cases
  5. Diabetes and metabolic cases
  6. Thyroid, hormones, and calcium cases
  7. Heart, clotting, and inflammation cases
  8. Vitamin and nutritional cases
"""

import json
import re
from typing import Dict, List, Any, Optional, Union
from config.settings import BASE_DIR
from src.ocr.tesseract_engine import clean_ocr_text
from src.core.specialist_matcher import get_specialist
from src.core.reference_range_engine import (
    validate_and_calculate_demographics,
    select_reference_range,
    evaluate_analyte_value,
)

# Load Reference Ranges from JSON
_REF_RANGES_FILE = BASE_DIR / "config" / "reference_ranges.json"
NORMAL_RANGES: Dict[str, Any] = {}
if _REF_RANGES_FILE.exists():
    try:
        with open(_REF_RANGES_FILE, "r", encoding="utf-8") as f:
            NORMAL_RANGES = json.load(f)
    except Exception:
        pass

LAB_PATTERNS = [
    # CBC / Hematology
    (r"(?:hemoglobin|hb|hgb)\s*[:\s=]+\s*(\d+\.?\d*)", "hemoglobin"),
    (r"(?:wbc|white blood|leucocyte)\s*[:\s=]+\s*(\d+\.?\d*)", "wbc"),
    (r"(?:platelet|plt)\s*[:\s=]+\s*(\d+\.?\d*)", "platelets"),
    (r"(?:rbc|red blood)\s*[:\s=]+\s*(\d+\.?\d*)", "rbc"),
    (r"(?:mcv)\s*[:\s=]+\s*(\d+\.?\d*)", "mcv"),
    (r"(?:mch)\s*[:\s=]+\s*(\d+\.?\d*)", "mch"),
    (r"(?:mchc)\s*[:\s=]+\s*(\d+\.?\d*)", "mchc"),
    (r"(?:rdw[-_ ]?sd)\s*[:\s=]+\s*((?:\d+\.?\d*|\.\d+))", "rdw_sd"),
    (r"(?:rdw[-_ ]?cv)\s*[:\s=]+\s*((?:\d+\.?\d*|\.\d+))", "rdw_cv"),
    (r"(?:rdw)\s*[:\s=]+\s*((?:\d+\.?\d*|\.\d+))", "rdw_cv"),
    (r"(?:pcv|hematocrit|hct)\s*[:\s=]+\s*(\d+\.?\d*)", "pcv"),
    (r"(?:esr)\s*[:\s=]+\s*(\d+\.?\d*)", "esr"),
    (r"(?:neutrophils|neutrophil)\s*[:\s=]+\s*(\d+\.?\d*)", "neutrophils"),
    (r"(?:lymphocytes|lymphocyte)\s*[:\s=]+\s*(\d+\.?\d*)", "lymphocytes"),
    (r"(?:eosinophils|eosinophil)\s*[:\s=]+\s*(\d+\.?\d*)", "eosinophils"),
    (r"(?:monocytes|monocyte)\s*[:\s=]+\s*(\d+\.?\d*)", "monocytes"),
    (r"(?:basophils|basophil)\s*[:\s=]+\s*(\d+\.?\d*)", "basophils"),

    # Metabolic & Glucose
    (r"(?:blood sugar|fasting glucose|glucose|fbs|rbs|bsl)\s*[:\s=]+\s*(\d+\.?\d*)", "blood_sugar"),
    (r"(?:hba1c|a1c|hb1ac)\s*[:\s=]+\s*(\d+\.?\d*)", "hba1c"),

    # Lipids
    (r"(?:cholesterol|total cholesterol)\s*[:\s=]+\s*(\d+\.?\d*)", "cholesterol"),
    (r"(?:triglycerides|triglyceride|tg)\s*[:\s=]+\s*(\d+\.?\d*)", "triglycerides"),
    (r"(?:hdl)\s*[:\s=]+\s*(\d+\.?\d*)", "hdl"),
    (r"(?:ldl)\s*[:\s=]+\s*(\d+\.?\d*)", "ldl"),
    (r"(?:vldl)\s*[:\s=]+\s*(\d+\.?\d*)", "vldl"),

    # Renal & Electrolytes
    (r"(?:creatinine|creat)\s*[:\s=]+\s*(\d+\.?\d*)", "creatinine"),
    (r"(?:urea|bun)\s*[:\s=]+\s*(\d+\.?\d*)", "urea"),
    (r"(?:uric acid)\s*[:\s=]+\s*(\d+\.?\d*)", "uric_acid"),
    (r"(?:egfr)\s*[:\s=]+\s*(\d+\.?\d*)", "egfr"),
    (r"(?:uacr|urine albumin creatinine ratio)\s*[:\s=]+\s*(\d+\.?\d*)", "uacr"),
    (r"\b(?:sodium|serum sodium)\b\s*[:\s=]+\s*(\d+\.?\d*)", "sodium"),
    (r"\b(?:potassium|serum potassium)\b\s*[:\s=]+\s*(\d+\.?\d*)", "potassium"),
    (r"\b(?:chloride|serum chloride)\b\s*[:\s=]+\s*(\d+\.?\d*)", "chloride"),
    (r"(?:calcium)\s*[:\s=]+\s*(\d+\.?\d*)", "calcium"),

    # Liver & Pancreas
    (r"(?:bilirubin|total bilirubin)\s*[:\s=]+\s*(\d+\.?\d*)", "bilirubin"),
    (r"(?:protein|total protein)\s*[:\s=]+\s*(\d+\.?\d*)", "protein"),
    (r"(?:albumin)\s*[:\s=]+\s*(\d+\.?\d*)", "albumin"),
    (r"(?:globulin)\s*[:\s=]+\s*(\d+\.?\d*)", "globulin"),
    (r"(?:sgot|ast)\s*[:\s=]+\s*(\d+\.?\d*)", "sgot"),
    (r"(?:sgpt|alt)\s*[:\s=]+\s*(\d+\.?\d*)", "sgpt"),
    (r"(?:alkaline phosphatase|alp)\s*[:\s=]+\s*(\d+\.?\d*)", "alkaline_phosphatase"),
    (r"(?:ggt|gamma gt)\s*[:\s=]+\s*(\d+\.?\d*)", "ggt"),
    (r"(?:lipase)\s*[:\s=]+\s*(\d+\.?\d*)", "lipase"),
    (r"(?:amylase)\s*[:\s=]+\s*(\d+\.?\d*)", "amylase"),

    # Thyroid & Endocrine
    (r"(?:tsh)\s*[:\s=]+\s*(\d+\.?\d*)", "tsh"),
    (r"(?:t3)\s*[:\s=]+\s*(\d+\.?\d*)", "t3"),
    (r"(?:t4)\s*[:\s=]+\s*(\d+\.?\d*)", "t4"),
    (r"(?:ft3)\s*[:\s=]+\s*(\d+\.?\d*)", "ft3"),
    (r"(?:ft4)\s*[:\s=]+\s*(\d+\.?\d*)", "ft4"),
    (r"(?:pth|parathyroid hormone)\s*[:\s=]+\s*(\d+\.?\d*)", "pth"),
    (r"(?:cortisol)\s*[:\s=]+\s*(\d+\.?\d*)", "cortisol"),

    # Cardiac, Coagulation & Inflammation
    (r"(?:troponin i|trop i)\s*[:\s=]+\s*(\d+\.?\d*)", "troponin_i"),
    (r"(?:troponin t|trop t)\s*[:\s=]+\s*(\d+\.?\d*)", "troponin_t"),
    (r"(?:bnp)\s*[:\s=]+\s*(\d+\.?\d*)", "bnp"),
    (r"(?:nt-probnp|nt probnp)\s*[:\s=]+\s*(\d+\.?\d*)", "nt_probnp"),
    (r"(?:d-dimer|d dimer)\s*[:\s=]+\s*(\d+\.?\d*)", "d_dimer"),
    (r"(?:inr)\s*[:\s=]+\s*(\d+\.?\d*)", "inr"),
    (r"\b(?:pt|prothrombin time)\b\s*[:\s=]+\s*(\d+\.?\d*)", "pt"),
    (r"(?:aptt|activated partial thromboplastin time|ptt)\s*[:\s=]+\s*(\d+\.?\d*)", "aptt"),
    (r"(?:fibrinogen|plasma fibrinogen)\s*[:\s=]+\s*(\d+\.?\d*)", "fibrinogen"),
    (r"(?:crp|c-reactive protein)\s*[:\s=]+\s*(\d+\.?\d*)", "crp"),
    (r"(?:lactate|lactic acid)\s*[:\s=]+\s*(\d+\.?\d*)", "lactate"),
    (r"(?:procalcitonin|pct)\s*[:\s=]+\s*(\d+\.?\d*)", "procalcitonin"),

    # Extended Hematology & Cell Indices
    (r"(?:mpv|mean platelet volume)\s*[:\s=]+\s*(\d+\.?\d*)", "mpv"),
    (r"(?:reticulocyte|retic count|reticulocytes)\s*[:\s=]+\s*(\d+\.?\d*)", "reticulocyte_count"),
    (r"(?:anc|absolute neutrophil count|absolute neutrophils)\s*[:\s=]+\s*(\d+\.?\d*)", "absolute_neutrophils"),
    (r"(?:alc|absolute lymphocyte count|absolute lymphocytes)\s*[:\s=]+\s*(\d+\.?\d*)", "absolute_lymphocytes"),
    (r"(?:absolute monocyte count|absolute monocytes)\s*[:\s=]+\s*(\d+\.?\d*)", "absolute_monocytes"),
    (r"(?:aec|absolute eosinophil count|absolute eosinophils)\s*[:\s=]+\s*(\d+\.?\d*)", "absolute_eosinophils"),
    (r"(?:absolute basophil count|absolute basophils)\s*[:\s=]+\s*(\d+\.?\d*)", "absolute_basophils"),

    # Vitamins, Minerals & Iron Indices
    (r"(?:iron|serum iron)\s*[:\s=]+\s*(\d+\.?\d*)", "iron"),
    (r"(?:ferritin|serum ferritin)\s*[:\s=]+\s*(\d+\.?\d*)", "ferritin"),
    (r"(?:tibc|total iron binding capacity)\s*[:\s=]+\s*(\d+\.?\d*)", "tibc"),
    (r"(?:transferrin saturation|iron saturation|tsat)\s*[:\s=]+\s*(\d+\.?\d*)", "transferrin_saturation"),
    (r"(?:transferrin)\s*[:\s=]+\s*(\d+\.?\d*)", "transferrin"),
    (r"(?:vitamin d|25-oh vitamin d|vit d)\s*[:\s=]+\s*(\d+\.?\d*)", "vitamin_d"),
    (r"(?:vitamin b12|b12)\s*[:\s=]+\s*(\d+\.?\d*)", "vitamin_b12"),
    (r"(?:folate|folic acid|serum folate)\s*[:\s=]+\s*(\d+\.?\d*)", "folate"),
    (r"(?:copper|serum copper)\s*[:\s=]+\s*(\d+\.?\d*)", "copper"),
    (r"(?:ldh|lactate dehydrogenase)\s*[:\s=]+\s*(\d+\.?\d*)", "ldh"),

    # Extended Renal, Electrolytes & Arterial Blood Gas (ABG)
    (r"(?:bun|blood urea nitrogen)\s*[:\s=]+\s*(\d+\.?\d*)", "bun"),
    (r"(?:magnesium|serum magnesium)\s*[:\s=]+\s*(\d+\.?\d*)", "magnesium"),
    (r"(?:phosphorus|phosphate|serum phosphate|po4)\s*[:\s=]+\s*(\d+\.?\d*)", "phosphorus"),
    (r"(?:bicarbonate|hco3|total co2)\s*[:\s=]+\s*(\d+\.?\d*)", "bicarbonate"),
    (r"(?:serum osmolality|osmolality)\s*[:\s=]+\s*(\d+\.?\d*)", "serum_osmolality"),
    (r"(?:arterial ph|blood ph|abg ph)\s*[:\s=]+\s*(\d+\.?\d*)", "arterial_ph"),
    (r"(?:pco2|abg pco2)\s*[:\s=]+\s*(\d+\.?\d*)", "arterial_pco2"),
    (r"(?:po2|abg po2)\s*[:\s=]+\s*(\d+\.?\d*)", "arterial_po2"),
    (r"(?:base excess)\s*[:\s=]+\s*([+-]?\d+\.?\d*)", "base_excess"),

    # Extended Hepatic
    (r"(?:direct bilirubin|conjugated bilirubin)\s*[:\s=]+\s*(\d+\.?\d*)", "direct_bilirubin"),

    # Tumor Markers
    (r"(?:psa|total psa|prostate specific antigen)\s*[:\s=]+\s*(\d+\.?\d*)", "psa"),
    (r"(?:ca[- ]?125|cancer antigen 125)\s*[:\s=]+\s*(\d+\.?\d*)", "ca125"),
    (r"(?:cea|carcinoembryonic antigen)\s*[:\s=]+\s*(\d+\.?\d*)", "cea"),
    (r"(?:ca[- ]?19[- ]?9|cancer antigen 19[- ]?9)\s*[:\s=]+\s*(\d+\.?\d*)", "ca19_9"),
    (r"(?:afp|alpha[- ]?fetoprotein)\s*[:\s=]+\s*(\d+\.?\d*)", "afp"),

    # Urinalysis
    (r"(?:specific gravity|sg)\s*[:\s=]+\s*(1\.?\d{3})", "specific_gravity"),
    (r"(?:p\.?h\.?|urine ph)\s*[:\s=]+\s*(\d+\.?\d*)", "ph"),
    (r"(?:pus cells|wbc in urine|urine wbc)\s*[:\s=]+\s*(\d+\.?\d*)", "pus_cells"),
    (r"(?:rbc in urine|urine rbc|urine blood cells)\s*[:\s=]+\s*(\d+\.?\d*)", "rbc_urine"),
]

LAB_ALIASES = {
    "hemoglobin": [r"hemoglobin", r"hb", r"hgb", r"haemoglobin"],
    "wbc": [r"wbc", r"white blood", r"total wbc", r"leucocyte", r"leukocyte", r"tc\s*count"],
    "platelets": [r"platelet", r"plt", r"plateletcount", r"platelet\s*count"],
    "rbc": [r"rbc", r"total rbc", r"red blood", r"rbc\s*count"],
    "mcv": [r"mcv", r"mean corpuscular volume"],
    "mch": [r"mch", r"mean corpuscular hemoglobin"],
    "mchc": [r"mchc", r"mean corpuscular hemoglobin concentration"],
    "rdw_sd": [r"rdw[-_ ]?sd", r"red\s+cell\s+distrib[\w\s]*sd"],
    "rdw_cv": [r"rdw[-_ ]?cv", r"red\s+cell\s+distrib[\w\s]*cv"],
    "rdw": [r"rdw\b", r"red\s+cell\s+distribution\s+width"],
    "pcv": [r"pcv", r"hematocrit", r"hct", r"packed cell volume"],
    "esr": [r"esr"],
    "neutrophils": [r"neutrophils", r"neutrophil"],
    "lymphocytes": [r"lymphocytes", r"lymphocyte"],
    "eosinophils": [r"eosinophils", r"eosinophil"],
    "monocytes": [r"monocytes", r"monocyte"],
    "basophils": [r"basophils", r"basophil"],
    "blood_sugar": [r"blood sugar", r"glucose", r"fasting glucose", r"fbs", r"rbs", r"bsl", r"sugar"],
    "hba1c": [r"hba1c", r"a1c", r"hb1ac"],
    "cholesterol": [r"cholesterol", r"total cholesterol"],
    "triglycerides": [r"triglycerides", r"triglyceride", r"tg"],
    "hdl": [r"hdl"],
    "ldl": [r"ldl"],
    "vldl": [r"vldl"],
    "creatinine": [r"creatinine", r"creat"],
    "bilirubin": [r"bilirubin", r"total bilirubin"],
    "sgot": [r"sgot", r"ast"],
    "sgpt": [r"sgpt", r"alt"],
    "alkaline_phosphatase": [r"alkaline phosphatase", r"alp"],
    "ggt": [r"ggt", r"gamma gt"],
    "lipase": [r"lipase", r"serum lipase"],
    "amylase": [r"amylase", r"serum amylase"],
    "tsh": [r"tsh"],
    "t3": [r"t3", r"triiodothyronine"],
    "t4": [r"t4", r"thyroxine"],
    "ft3": [r"ft3", r"free t3"],
    "ft4": [r"ft4", r"free t4"],
    "pth": [r"pth", r"parathyroid hormone"],
    "cortisol": [r"cortisol", r"morning cortisol"],
    "troponin_i": [r"troponin i", r"trop i", r"cardiac troponin i"],
    "troponin_t": [r"troponin t", r"trop t"],
    "bnp": [r"bnp", r"brain natriuretic peptide"],
    "nt_probnp": [r"nt-probnp", r"nt probnp"],
    "d_dimer": [r"d-dimer", r"d dimer"],
    "inr": [r"inr"],
    "pt": [r"prothrombin time", r"\bpt\b"],
    "aptt": [r"aptt", r"activated partial thromboplastin time", r"\bptt\b"],
    "fibrinogen": [r"fibrinogen", r"plasma fibrinogen"],
    "crp": [r"crp", r"c-reactive protein"],
    "lactate": [r"lactate", r"lactic acid"],
    "procalcitonin": [r"procalcitonin", r"pct"],
    "sodium": [r"sodium", r"serum sodium"],
    "potassium": [r"potassium", r"serum potassium"],
    "chloride": [r"chloride", r"serum chloride"],
    "urea": [r"urea", r"\burea\b"],
    "bun": [r"blood urea nitrogen", r"\bbun\b"],
    "uric_acid": [r"uric acid"],
    "calcium": [r"calcium"],
    "magnesium": [r"magnesium", r"serum magnesium"],
    "phosphorus": [r"phosphorus", r"phosphate", r"serum phosphate", r"\bpo4\b"],
    "bicarbonate": [r"bicarbonate", r"\bhco3\b", r"total co2", r"serum bicarbonate"],
    "serum_osmolality": [r"serum osmolality", r"osmolality"],
    "direct_bilirubin": [r"direct bilirubin", r"conjugated bilirubin", r"bilirubin direct"],
    "iron": [r"iron", r"serum iron"],
    "ferritin": [r"ferritin", r"serum ferritin"],
    "tibc": [r"tibc", r"total iron binding capacity"],
    "transferrin": [r"transferrin"],
    "transferrin_saturation": [r"transferrin saturation", r"iron saturation", r"\btsat\b"],
    "vitamin_d": [r"vitamin d", r"25-oh vitamin d", r"vit d"],
    "vitamin_b12": [r"vitamin b12", r"b12"],
    "folate": [r"folate", r"folic acid"],
    "copper": [r"copper", r"serum copper"],
    "ldh": [r"ldh", r"lactate dehydrogenase"],
    "mpv": [r"\bmpv\b", r"mean platelet volume"],
    "reticulocyte_count": [r"reticulocyte count", r"reticulocytes", r"retic count", r"\bretics\b"],
    "absolute_neutrophils": [r"absolute neutrophil count", r"\banc\b", r"absolute neutrophils"],
    "absolute_lymphocytes": [r"absolute lymphocyte count", r"\balc\b", r"absolute lymphocytes"],
    "absolute_monocytes": [r"absolute monocyte count", r"absolute monocytes"],
    "absolute_eosinophils": [r"absolute eosinophil count", r"\baec\b", r"absolute eosinophils"],
    "absolute_basophils": [r"absolute basophil count", r"absolute basophils"],
    "arterial_ph": [r"arterial ph", r"abg ph"],
    "arterial_pco2": [r"arterial pco2", r"\bpco2\b", r"abg pco2"],
    "arterial_po2": [r"arterial po2", r"\bpo2\b", r"abg po2"],
    "psa": [r"prostate specific antigen", r"\bpsa\b", r"total psa"],
    "ca125": [r"ca[- ]?125", r"cancer antigen 125"],
    "cea": [r"\bcea\b", r"carcinoembryonic antigen"],
    "ca19_9": [r"ca[- ]?19[- ]?9", r"cancer antigen 19[- ]?9"],
    "afp": [r"\bafp\b", r"alpha[- ]?fetoprotein"],
    "egfr": [r"egfr"],
    "uacr": [r"uacr"],
    "specific_gravity": [r"specific gravity", r"sg"],
    "ph": [r"\bp\.?h\.?\b", r"urine ph"],
    "pus_cells": [r"pus cells", r"wbc in urine", r"urine wbc"],
    "rbc_urine": [r"rbc in urine", r"urine rbc", r"urine blood cells"],
}

LAB_HINTS = {
    "hemoglobin": {"low": {"hint": "Low Hb — anemia pattern", "disease": "Iron Deficiency Anemia"}},
    "platelets": {"low": {"hint": "Thrombocytopenia — low platelet count", "disease": "Thrombocytopenia"}},
    "wbc": {"low": {"hint": "Leukopenia — low white cell count", "disease": "Aplastic Anemia"},
            "high": {"hint": "Leukocytosis — elevated white blood count", "disease": "Leukocytosis"}},
    "mcv": {"low": {"hint": "Low MCV — microcytic red blood cells", "disease": "Iron Deficiency Anemia"},
            "high": {"hint": "High MCV — macrocytic red blood cells", "disease": "Vitamin B12 Deficiency"}},
    "blood_sugar": {"high": {"hint": "Elevated blood glucose", "disease": "Type 2 Diabetes"},
                    "low": {"hint": "Low blood glucose", "disease": "Hypoglycemia"}},
    "hba1c": {"high": {"hint": "High HbA1c — poor glycemic control", "disease": "Type 2 Diabetes"}},
    "cholesterol": {"high": {"hint": "High cholesterol — dyslipidemia", "disease": "Dyslipidemia"}},
    "triglycerides": {"high": {"hint": "High triglycerides — dyslipidemia", "disease": "Dyslipidemia"}},
    "bilirubin": {"high": {"hint": "Elevated bilirubin — jaundice pattern", "disease": "Hepatitis A"}},
    "sgpt": {"high": {"hint": "Elevated ALT — liver cellular injury", "disease": "Fatty Liver Disease"}},
    "sgot": {"high": {"hint": "Elevated AST — liver cellular injury", "disease": "Fatty Liver Disease"}},
    "alkaline_phosphatase": {"high": {"hint": "High ALP — biliary/bone pattern", "disease": "Cholestasis"}},
    "ggt": {"high": {"hint": "High GGT — biliary/liver enzyme induction", "disease": "Cholestasis"}},
    "lipase": {"high": {"hint": "High Lipase — pancreatic inflammation", "disease": "Acute Pancreatitis"}},
    "amylase": {"high": {"hint": "High Amylase — pancreatic inflammation", "disease": "Acute Pancreatitis"}},
    "tsh": {"high": {"hint": "Elevated TSH — primary hypothyroidism", "disease": "Hypothyroidism"},
            "low": {"hint": "Suppressed TSH — hyperthyroid pattern", "disease": "Hyperthyroidism"}},
    "ft4": {"low": {"hint": "Low FT4 — hypothyroid pattern", "disease": "Hypothyroidism"},
            "high": {"hint": "Elevated FT4 — hyperthyroid pattern", "disease": "Hyperthyroidism"}},
    "creatinine": {"high": {"hint": "Elevated creatinine — impaired renal filtration", "disease": "Chronic Kidney Disease"}},
    "urea": {"high": {"hint": "High urea — impaired clearance or dehydration", "disease": "Dehydration"}},
    "bun": {"high": {"hint": "Elevated BUN — azotemia or hypovolemia", "disease": "Prerenal Azotemia Pattern"}},
    "uric_acid": {"high": {"hint": "Elevated uric acid", "disease": "Hyperuricemia"}},
    "calcium": {"low": {"hint": "Hypocalcemia — low serum calcium", "disease": "Hypocalcemia"},
                "high": {"hint": "Hypercalcemia — elevated serum calcium", "disease": "Hypercalcemia"}},
    "magnesium": {"low": {"hint": "Hypomagnesemia — electrolyte deficit", "disease": "Hypomagnesemia"}},
    "phosphorus": {"high": {"hint": "Hyperphosphatemia — renal retention / cell lysis", "disease": "Hyperphosphatemia"},
                   "low": {"hint": "Hypophosphatemia — refeeding or renal wasting", "disease": "Hypophosphatemia"}},
    "bicarbonate": {"low": {"hint": "Low bicarbonate — metabolic acidosis", "disease": "Metabolic Acidosis Pattern"},
                    "high": {"hint": "High bicarbonate — metabolic alkalosis", "disease": "Metabolic Alkalosis Pattern"}},
    "arterial_ph": {"low": {"hint": "Arterial acidemia (pH < 7.35)", "disease": "Metabolic Acidosis Pattern"},
                    "high": {"hint": "Arterial alkalemia (pH > 7.45)", "disease": "Metabolic Alkalosis Pattern"}},
    "direct_bilirubin": {"high": {"hint": "Elevated direct bilirubin — biliary obstruction/cholestasis", "disease": "Obstructive Jaundice / Direct Hyperbilirubinemia"}},
    "pth": {"high": {"hint": "Elevated parathyroid hormone", "disease": "Primary Hyperparathyroidism"}},
    "troponin_i": {"high": {"hint": "Elevated cardiac troponin — myocardial injury", "disease": "Myocardial Infarction"}},
    "troponin_t": {"high": {"hint": "Elevated cardiac troponin — myocardial injury", "disease": "Myocardial Infarction"}},
    "bnp": {"high": {"hint": "Elevated natriuretic peptide — ventricular stretch", "disease": "Heart Failure"}},
    "nt_probnp": {"high": {"hint": "Elevated NT-proBNP — ventricular stretch", "disease": "Heart Failure"}},
    "d_dimer": {"high": {"hint": "Elevated D-Dimer — fibrin degradation active", "disease": "Venous Thromboembolism"}},
    "inr": {"high": {"hint": "Prolonged INR — extrinsic pathway or anticoagulant effect", "disease": "Prolonged Coagulation Test"}},
    "pt": {"high": {"hint": "Prolonged PT — coagulation deficiency or warfarin", "disease": "Prolonged Coagulation Test"}},
    "aptt": {"high": {"hint": "Prolonged aPTT — intrinsic pathway coagulopathy", "disease": "Intrinsic Coagulation Pathway Abnormality"}},
    "fibrinogen": {"low": {"hint": "Hypofibrinogenemia — consumption or synthetic failure", "disease": "Disseminated Intravascular Coagulation"},
                   "high": {"hint": "Hyperfibrinogenemia — acute-phase reaction", "disease": "Elevated Inflammation Markers"}},
    "crp": {"high": {"hint": "Elevated CRP — active systemic inflammation", "disease": "Elevated Inflammation Markers"}},
    "esr": {"high": {"hint": "Elevated ESR — active systemic inflammation", "disease": "Elevated Inflammation Markers"}},
    "lactate": {"high": {"hint": "High lactate — hypoperfusion / anaerobic metabolism", "disease": "Sepsis"}},
    "procalcitonin": {"high": {"hint": "High procalcitonin — systemic bacterial response", "disease": "Sepsis"}},
    "iron": {"low": {"hint": "Low serum iron", "disease": "Iron Deficiency Anemia"}},
    "ferritin": {"low": {"hint": "Depleted iron stores", "disease": "Iron Deficiency Anemia"},
                 "high": {"hint": "Elevated ferritin — inflammation or iron overload", "disease": "Iron Overload / Hemochromatosis Pattern"}},
    "tibc": {"high": {"hint": "Elevated TIBC — iron deficiency state", "disease": "Iron Deficiency Anemia"}},
    "transferrin_saturation": {"low": {"hint": "Low transferrin saturation (<20%) — iron deficiency", "disease": "Iron Deficiency Anemia"},
                               "high": {"hint": "High transferrin saturation (>50%) — iron overload", "disease": "Iron Overload / Hemochromatosis Pattern"}},
    "reticulocyte_count": {"high": {"hint": "Reticulocytosis — marrow response to hemolysis/bleeding", "disease": "Reticulocytosis / Hemolytic Compensation"}},
    "mpv": {"high": {"hint": "Elevated MPV — increased platelet turnover / large platelets", "disease": "Immune Thrombocytopenia Pattern"}},
    "absolute_neutrophils": {"low": {"hint": "Severe neutropenia (ANC < 1500) — high infection vulnerability", "disease": "Severe Neutropenia / Agranulocytosis"}},
    "absolute_eosinophils": {"high": {"hint": "Eosinophilia (AEC > 500) — allergic/atopic/parasitic response", "disease": "Eosinophilia Pattern"}},
    "folate": {"low": {"hint": "Low folate level", "disease": "Folate Deficiency"}},
    "vitamin_b12": {"low": {"hint": "Low Vitamin B12", "disease": "Vitamin B12 Deficiency"}},
    "vitamin_d": {"low": {"hint": "Low 25-OH Vitamin D", "disease": "Vitamin D Deficiency"}},
    "copper": {"low": {"hint": "Low serum copper", "disease": "Copper Deficiency"}},
    "psa": {"high": {"hint": "Elevated PSA (>4.0 ng/mL) — prostatic condition", "disease": "Elevated PSA — Prostatic Evaluation Recommended"}},
    "ca125": {"high": {"hint": "Elevated CA-125 (>35 U/mL) — ovarian/gynecologic marker", "disease": "Elevated CA-125 — Gynecologic Evaluation Recommended"}},
    "cea": {"high": {"hint": "Elevated CEA — gastrointestinal tumor marker", "disease": "Elevated Gastrointestinal Tumor Marker (CEA/CA19-9)"}},
    "ca19_9": {"high": {"hint": "Elevated CA 19-9 — pancreaticobiliary marker", "disease": "Elevated Gastrointestinal Tumor Marker (CEA/CA19-9)"}},
    "afp": {"high": {"hint": "Elevated Alpha-fetoprotein", "disease": "Liver Disease / Malnutrition"}},
    "pus_cells": {"high": {"hint": "Urine pyuria — urinary tract inflammation", "disease": "Urinary Tract Infection"}},
    "rbc_urine": {"high": {"hint": "Urine hematuria — blood cells in urine", "disease": "Kidney Stones"}},
}


def match_lab_test_key(label: str) -> Optional[str]:
    """Resolve an extracted OCR label to its canonical biomarker key."""
    l = label.lower().strip()
    l = re.sub(r"^[^a-zA-Z]+", "", l)
    if not l:
        return None

    # Check compounds and specific indices first
    if re.search(r"\bmean\s+platelet\s+vol|\bmpv\b", l):
        return "mpv"
    if re.search(r"\bpct\b|\bplateletcrit\b", l):
        return "pct"
    if re.search(r"\bmchc\b", l):
        return "mchc"
    if re.search(r"\bmch\b", l):
        return "mch"
    if re.search(r"\bmcv\b", l):
        return "mcv"
    if re.search(r"\brdw[-_ ]?sd\b", l):
        return "rdw_sd"
    if re.search(r"\brdw[-_ ]?cv\b", l):
        return "rdw_cv"
    if re.search(r"\brdw\b|red\s+cell\s+distrib", l):
        return "rdw_cv"
    if re.search(r"\bhematocrit\b|\bpcv\b|\bhct\b|packed\s+cell", l):
        return "pcv"
    if re.search(r"\bhaemoglobin\b|\bhemoglobin\b|\bhgb\b|\bhb\b", l):
        return "hemoglobin"
    if re.search(r"\brbc\b|red\s+blood\s+cell|\btotal\s+rbc", l):
        return "rbc"
    if re.search(r"\btotal\s+wbc|\bwbc\b|\bleucocyte\b|\bleukocyte\b|white\s+blood", l):
        return "wbc"
    if re.search(r"\btotal\s+protein", l):
        return "protein"
    if re.search(r"\balbumin\b", l):
        return "albumin"
    if re.search(r"\bglobulin\b", l):
        return "globulin"
    if re.search(r"\bneut(?:rophil)?s?\b|\bneut\s*%", l):
        return "neutrophils"
    if re.search(r"\blymph(?:ocyte)?s?\b|\blymph\s*%", l):
        return "lymphocytes"
    if re.search(r"\beos(?:inophil)?s?\b|\beos\s*%", l):
        return "eosinophils"
    if re.search(r"\bmono(?:cyte)?s?\b|\bmono\s*%", l):
        return "monocytes"
    if re.search(r"\bbaso(?:phil)?s?\b|\bbaso\s*%", l):
        return "basophils"
    if re.search(r"\bplatelet|\bplt\b", l):
        return "platelets"
    if re.search(r"\bblood\s+sugar\b|\bglucose\b|\bfbs\b|\brbs\b", l):
        return "blood_sugar"
    if re.search(r"\bhba1c\b|\ba1c\b", l):
        return "hba1c"
    if re.search(r"\bcreatinine\b|\bcreat\b", l):
        return "creatinine"
    if re.search(r"\burea\b|\bbun\b", l):
        return "urea"
    if re.search(r"\buric\s+acid\b", l):
        return "uric_acid"
    if re.search(r"\btotal\s+bilirubin\b|\bbilirubin\b", l):
        return "bilirubin"
    if re.search(r"\bsgot\b|\bast\b", l):
        return "sgot"
    if re.search(r"\bsgpt\b|\balt\b", l):
        return "sgpt"
    if re.search(r"\balkaline\s+phosphatase\b|\balp\b", l):
        return "alkaline_phosphatase"
    if re.search(r"\bggt\b|\bgamma\s+gt\b", l):
        return "ggt"
    if re.search(r"\btsh\b", l):
        return "tsh"
    if re.search(r"\b(?:serum\s+)?sodium\b", l):
        return "sodium"
    if re.search(r"\b(?:serum\s+)?potassium\b", l):
        return "potassium"
    if re.search(r"\b(?:serum\s+)?chloride\b|\bcl\s*-\b", l):
        return "chloride"
    if re.search(r"\bcalcium\b", l):
        return "calcium"
    if re.search(r"\bcrp\b|\bc-reactive\b", l):
        return "crp"
    if re.search(r"\besr\b", l):
        return "esr"
    return None


def parse_structured_lab_row(line: str) -> Optional[Dict[str, Any]]:
    """Parse [LAB_ROW] entries generated by the table OCR engine."""
    line = line.strip()
    if not line.startswith("[LAB_ROW]"):
        return None
    raw_content = line[len("[LAB_ROW]"):].strip()
    parts = [p.strip() for p in raw_content.split("|")]
    if len(parts) < 2:
        return None

    raw_label = parts[0]
    raw_val = parts[1]
    raw_ref = parts[2] if len(parts) > 2 else ""
    raw_unit = parts[3] if len(parts) > 3 else ""

    test_key = match_lab_test_key(raw_label)
    if not test_key:
        return None

    # Parse numeric value from raw_val (e.g. '10.50L', '71.40', '10.65H', '246.00', '.21')
    val_m = re.search(r"((?:\d+\.?\d*|\.\d+))", raw_val)
    if not val_m:
        return None
    val = float(val_m.group(1))

    # Parse reference range from raw_ref (e.g. '40-80', '12-15', '11.6-14', '<2', '31.5-34.5', '.17-.35')
    ref_lo, ref_hi, reported_range = None, None, None
    rng_m = re.search(r"((?:\d+\.?\d*|\.\d+))\s*(?:-|–|to)\s*((?:\d+\.?\d*|\.\d+))", raw_ref)
    lt_m = re.search(r"<\s*((?:\d+\.?\d*|\.\d+))", raw_ref)
    gt_m = re.search(r">\s*((?:\d+\.?\d*|\.\d+))", raw_ref)
    if rng_m:
        ref_lo = float(rng_m.group(1))
        ref_hi = float(rng_m.group(2))
        reported_range = f"{ref_lo}–{ref_hi}"
    elif lt_m:
        ref_lo = 0.0
        ref_hi = float(lt_m.group(1))
        reported_range = f"<{ref_hi}"
    elif gt_m:
        ref_lo = float(gt_m.group(1))
        ref_hi = None
        reported_range = f">{ref_lo}"

    # Clean up unit
    unit = raw_unit.replace("20°6/", "10^6/").replace("20°3/", "10^3/").replace("20^6/", "10^6/").replace("20^3/", "10^3/").strip()
    valid_units = {"%", "g/dl", "fl", "pg", "mg/dl", "mmol/l", "meq/l", "10^3/ul", "10^6/ul", "/ul", "u/l", "iu/l", "miu/l", "ug/dl", "ng/ml", "ng/dl", "pg/ml", "mm/hr", "mosm/kg"}
    if unit.lower() not in valid_units:
        unit = ""
    if not unit:
        if test_key == "rdw_sd":
            unit = "fL"
        elif test_key == "rdw_cv":
            unit = "%"
        elif test_key in ("mcv", "mpv"):
            unit = "fL"
        elif test_key == "mch":
            unit = "pg"
        elif test_key == "mchc":
            unit = "g/dL"
        elif "%" in line:
            unit = "%"
        elif "g/dl" in line.lower() or "gidl" in line.lower():
            unit = "g/dL"
        elif "fl" in line.lower():
            unit = "fL"
        elif "pg" in line.lower():
            unit = "pg"

    return {
        "key": test_key,
        "value": val,
        "ref_lo": ref_lo,
        "ref_hi": ref_hi,
        "reported_range": reported_range,
        "unit": unit,
        "source_text": line,
        "extraction_status": "verified"
    }


def _extract_number_and_range_after_label(text: str, aliases: List[str], key: str = "") -> Optional[Dict[str, Any]]:
    """
    Safely extract a patient's numerical result following a test label.
    Iterates through all candidate matches (using finditer) to prevent hospital letterhead
    or doctor notes from prematurely aborting extraction of valid test rows.
    CRITICAL: Never substitutes a reference interval's lower bound for the patient's result.
    """
    for alias in aliases:
        # Strictly enforce word boundaries
        bounded = alias if (alias.startswith(r"\b") or not alias.isalnum()) else rf"\b{alias}\b"
        
        # Scan ALL occurrences of this alias in the text
        for m in re.finditer(rf"{bounded}", text, flags=re.I):
            # Restrict snippet to the current line to avoid bleeding into adjacent lab test rows
            line_end = text.find("\n", m.start())
            if line_end != -1 and line_end - m.start() > len(alias):
                snippet = text[m.start():line_end]
            else:
                snippet = text[m.start():m.start() + 100]

            # Check if reference range is present in snippet: e.g. "40-80" or "80-100" or ".17-.35"
            rng_m = re.search(r"((?:\d+\.?\d*|\.\d+))\s*(?:-|–|to)\s*((?:\d+\.?\d*|\.\d+))", snippet)
            ref_lo, ref_hi, reported_range = None, None, None
            range_start = len(snippet)

            if rng_m:
                ref_lo = float(rng_m.group(1))
                ref_hi = float(rng_m.group(2))
                reported_range = f"{ref_lo}–{ref_hi}"
                range_start = rng_m.start()

            # Extract number strictly before the reference range
            label_len = len(m.group(0))
            before_range = snippet[label_len:range_start]
            val_m = re.findall(r"(?:\b\d+\.?\d*|\.\d+)", before_range)
            if val_m:
                try:
                    val = float(val_m[-1])
                    if val > 0:
                        unit_m = re.search(r"(%|g/dl|gidl|fl|pg|mg/dl|mmol/l|meq/l|10\^?3/ul|10\^?6/ul|/ul|u/l)", snippet, re.I)
                        unit = unit_m.group(1).replace("gidl", "g/dL") if unit_m else ("%" if "%" in snippet else "")
                        if not unit:
                            if key in ("mcv", "mpv", "rdw_sd"):
                                unit = "fL"
                            elif key in ("rdw_cv", "pcv", "hematocrit"):
                                unit = "%"
                            elif key == "mch":
                                unit = "pg"
                            elif key in ("hemoglobin", "mchc"):
                                unit = "g/dL"
                        return {
                            "key": key,
                            "value": val,
                            "ref_lo": ref_lo,
                            "ref_hi": ref_hi,
                            "reported_range": reported_range,
                            "unit": unit,
                            "source_text": snippet.strip(),
                            "extraction_status": "verified"
                        }
                except Exception:
                    pass

            # If no range was found, check for single result number immediately after label
            if not rng_m:
                after_label = snippet[label_len:]
                single_m = re.search(r"[:\s=]+((?:\d+\.?\d*|\.\d+))", after_label)
                if single_m:
                    try:
                        val = float(single_m.group(1))
                        if val > 0:
                            unit_m = re.search(r"(%|g/dl|gidl|fl|pg|mg/dl|mmol/l|meq/l|10\^?3/ul|10\^?6/ul|/ul|u/l)", after_label, re.I)
                            unit = unit_m.group(1).replace("gidl", "g/dL") if unit_m else ""
                            if not unit:
                                if key in ("mcv", "mpv", "rdw_sd"):
                                    unit = "fL"
                                elif key in ("rdw_cv", "pcv", "hematocrit"):
                                    unit = "%"
                                elif key == "mch":
                                    unit = "pg"
                                elif key in ("hemoglobin", "mchc"):
                                    unit = "g/dL"
                            return {
                                "key": key,
                                "value": val,
                                "ref_lo": None,
                                "ref_hi": None,
                                "reported_range": None,
                                "unit": unit,
                                "source_text": snippet.strip(),
                                "extraction_status": "verified"
                            }
                    except Exception:
                        pass

    return None


def _extract_number_after_label(text: str, aliases: List[str]) -> Optional[float]:
    res = _extract_number_and_range_after_label(text, aliases)
    return res["value"] if res else None


def _extract_qualitative_markers(text: str) -> Dict[str, float]:
    """Detect qualitative serology, antigen, molecular, and urine test results."""
    out: Dict[str, float] = {}
    lower = re.sub(r"([a-z0-9])\s*[:=]\s*", r"\1 ", text.lower())

    def mark_pos(key, patterns):
        for pat in patterns:
            if re.search(pat, lower):
                out[key] = 1.0
                return

    # Urine dipstick markers
    mark_pos("protein_urine", [r"protein\s*(?:\+|trace|positive|pos)", r"albumin\s*(?:\+|trace|positive|pos)", r"proteinuria\b"])
    mark_pos("glucose_urine", [r"glucose\s*(?:\+|trace|positive|pos)", r"sugar\s*(?:\+|trace|positive|pos)"])
    mark_pos("ketones_urine", [r"ketones?\s*(?:\+|trace|positive|pos)", r"acetoacetate\s*(?:\+|trace|positive|pos)"])
    mark_pos("blood_urine", [r"blood\s*(?:\+|trace|positive|pos)", r"hematuria\b", r"erythrocytes\s*(?:\+|trace|positive|pos)"])
    mark_pos("nitrite", [r"nitrite\s*(?:\+|positive|pos)"])
    mark_pos("leukocyte_esterase", [r"leukocyte esterase\s*(?:\+|positive|pos)", r"leucocyte esterase\s*(?:\+|positive|pos)"])
    mark_pos("bilirubin_urine", [r"bilirubin\s*(?:\+|trace|positive|pos)"])

    # Specific Infectious Disease Testing (Enforcing: Dengue, Malaria, Typhoid, TB require these!)
    mark_pos("dengue_ns1_pos", [r"ns1\s*(?:ag|antigen)?\s*(?:positive|pos|reactive|\+)", r"dengue\s*ns1\s*(?:positive|pos|reactive|\+)"])
    mark_pos("dengue_serology_pos", [r"dengue\s*(?:igm|igg)\s*(?:positive|pos|reactive|\+)", r"dengue\s*(?:antibody|serology)\s*(?:positive|pos|reactive|\+)"])
    mark_pos("malaria_pos", [r"malaria\s*(?:antigen|p\.?f|p\.?v|rdt|smear|parasite)?\s*(?:positive|pos|reactive|detected|\+)", r"plasmodium\s*(?:vivax|falciparum)"])
    mark_pos("widal_pos", [r"widal\s*(?:test)?\s*(?:positive|pos|reactive|\+|1:160|1:320|1:640)", r"salmonella\s*(?:typhi)?\s*(?:positive|pos|reactive|detected|culture positive)"])
    mark_pos("tb_molecular_pos", [r"(?:afb|acid fast bacilli)\s*(?:positive|pos|seen|detected|\+)", r"genexpert\s*(?:mtb)?\s*(?:positive|detected)", r"mycobacterium\s*tuberculosis\s*(?:detected|positive)"])
    mark_pos("tb_screening_pos", [r"mantoux\s*(?:positive|pos|>10mm)", r"tuberculin skin test\s*(?:positive|pos)"])

    # Hepatitis Serology
    mark_pos("anti_hav_igm_pos", [r"anti[- ]?hav\s*igm\s*(?:positive|pos|reactive|\+)"])
    mark_pos("hbsag_pos", [r"hbsag\s*(?:positive|pos|reactive|\+)", r"hepatitis b surface\s*(?:antigen)?\s*(?:positive|pos|reactive|\+)"])
    mark_pos("anti_hcv_pos", [r"anti[- ]?hcv\s*(?:positive|pos|reactive|\+)", r"hcv\s*rna\s*(?:detected|positive)"])

    # Autoimmune & Gastrointestinal
    mark_pos("ttg_iga_pos", [r"ttg[- ]?iga[\s\w&/.:(),-]*?(?:positive|pos|reactive|>10|\+)", r"tissue transglutaminase[\s\w&/.:(),-]*?(?:positive|pos|reactive)"])
    mark_pos("fobt_pos", [r"(?:fobt|stool occult blood|occult blood in stool)[\s\w&/.:(),-]*?(?:positive|pos|\+)", r"fecal occult blood[\s\w&/.:(),-]*?(?:positive|pos)"])
    mark_pos("anti_tpo_pos", [r"anti[- ]?tpo[\s\w&/.:(),-]*?(?:positive|pos|reactive|>35|\+)", r"thyroid peroxidase[\s\w&/.:(),-]*?(?:antibody)?[\s\w&/.:(),-]*?(?:positive|pos)"])
    mark_pos("trab_pos", [r"trab[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)", r"tsh receptor antibody[\s\w&/.:(),-]*?(?:positive|pos)"])
    mark_pos("rf_pos", [r"rheumatoid factor[\s\w&/.:(),-]*?(?:positive|pos|reactive|>14|\+)", r"\brf\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("anti_ccp_pos", [r"anti[- ]?ccp[\s\w&/.:(),-]*?(?:positive|pos|reactive|>20|\+)", r"cyclic citrullinated peptide[\s\w&/.:(),-]*?(?:positive|pos)"])
    mark_pos("ana_pos", [r"\bana\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+|1:\d{2,})", r"antinuclear antibody[\s\w&/.:(),-]*?(?:positive|pos|reactive)"])
    mark_pos("anti_dsdna_pos", [r"anti[- ]?dsdna[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("hla_b27_pos", [r"hla[- ]?b27[\s\w&/.:(),-]*?(?:positive|pos|reactive|detected|\+)"])
    mark_pos("anca_pos", [r"(?:c[- ]?anca|p[- ]?anca|anca)[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("anti_scl70_pos", [r"(?:anti[- ]?scl[- ]?70|scl[- ]?70)[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("anti_ro_pos", [r"\b(?:anti[- ]?ssa|anti[- ]?ro|ssa|ro)\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("anti_la_pos", [r"\b(?:anti[- ]?ssb|anti[- ]?la|ssb|la)\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])

    # Extended Infectious & Serology Tests
    mark_pos("hiv_pos", [r"\bhiv\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)", r"anti[- ]?hiv[\s\w&/.:(),-]*?(?:positive|pos|reactive|\+)"])
    mark_pos("syphilis_pos", [r"\b(?:vdrl|rpr|tppa|treponema|syphilis)\b[\s\w&/.:(),-]*?(?:reactive|positive|pos|\+)"])
    mark_pos("h_pylori_pos", [r"\b(?:h\.?\s*pylori|helicobacter\s*pylori)\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|detected|\+)"])
    mark_pos("chikungunya_pos", [r"\bchikungunya\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|detected|\+)"])
    mark_pos("leptospira_pos", [r"\bleptospira\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|detected|\+)"])
    mark_pos("covid_pos", [r"\b(?:sars[- ]?cov[- ]?2|covid[- ]?19)\b[\s\w&/.:(),-]*?(?:positive|pos|detected|reactive|\+)"])
    mark_pos("aso_pos", [r"\b(?:aso|antistreptolysin\s*o)\b[\s\w&/.:(),-]*?(?:positive|pos|reactive|>200|\+)"])

    # Pregnancy / Hormonal Marker
    mark_pos("hcg_pos", [r"\b(?:urine\s*pregnancy\s*test|upt|beta[- ]?hcg|b[- ]?hcg|pregnancy\s*test)\b[\s\w&/.-]*?(?:positive|pos|reactive|\+)"])

    # Hematology Smear Features
    mark_pos("atypical_lymphocytes", [r"atypical lymphocytes\s*(?:seen|present|positive|>10%|\+)", r"monospot\s*(?:positive|pos)"])
    mark_pos("sickle_cells", [r"sickling\s*(?:test)?\s*(?:positive|pos|\+)", r"hb\s*s\s*(?:present|detected|positive|\+)", r"sickle cells\s*(?:seen|present)"])

    return out


def extract_patient_demographics_from_text(text: str) -> Dict[str, Any]:
    """
    Extracts potential patient demographic indicators (age, sex, DOB) from raw OCR text.
    Non-destructive; returns None for fields that cannot be reliably determined.
    """
    extracted_age: Optional[float] = None
    extracted_sex: Optional[str] = None
    extracted_dob: Optional[str] = None

    if not text:
        return {"age": None, "sex": None, "dob": None, "source": "none"}

    lines = text.splitlines()[:40]
    header_block = "\n".join(lines)

    # 1. Combined pattern: 'Age / Gender : 32 Y / Male' or 'Age/Sex: 45 / F'
    m_combo = re.search(
        r"age\s*[/|]\s*(?:gender|sex)\s*[:=\s-]+\s*(\d{1,3})\s*(?:y|yr|yrs|years)?\s*[/|]\s*([a-zA-Z]+)",
        header_block,
        re.IGNORECASE,
    )
    if m_combo:
        try:
            extracted_age = float(m_combo.group(1))
        except ValueError:
            pass
        s_raw = m_combo.group(2).lower()
        if s_raw in ("m", "male", "man", "boy"):
            extracted_sex = "male"
        elif s_raw in ("f", "female", "woman", "girl"):
            extracted_sex = "female"

    # 2. Standalone Age if not found: 'Age : 32 Years', 'Age: 25 Y', 'Age : 6 Months'
    if extracted_age is None:
        m_age = re.search(
            r"\b(?:age|patient\s+age)\s*[:=\s-]+\s*(\d{1,3}(?:\.\d+)?)\s*(y|yr|yrs|years|m|mo|months|d|days)?\b",
            header_block,
            re.IGNORECASE,
        )
        if m_age:
            try:
                val_num = float(m_age.group(1))
                unit_suffix = (m_age.group(2) or "y").lower()
                if unit_suffix in ("m", "mo", "months"):
                    extracted_age = round(val_num / 12.0, 4)
                elif unit_suffix in ("d", "days"):
                    extracted_age = round(val_num / 365.25, 4)
                else:
                    extracted_age = val_num
            except ValueError:
                pass

    # 3. Standalone Sex / Gender if not found
    if extracted_sex is None:
        m_sex = re.search(
            r"\b(?:gender|sex)\s*[:=\s-]+\s*(male|female|m|f)\b",
            header_block,
            re.IGNORECASE,
        )
        if m_sex:
            s_raw = m_sex.group(1).lower()
            if s_raw in ("m", "male"):
                extracted_sex = "male"
            elif s_raw in ("f", "female"):
                extracted_sex = "female"

    # 4. Date of Birth: 'DOB: 15/05/1990', 'Date of Birth: 1995-10-24'
    m_dob = re.search(
        r"\b(?:d\.?o\.?b\.?|date\s+of\s+birth|birth\s+date)\s*[:=\s-]+\s*(\d{1,4}[-/.][\w\d]{1,3}[-/.][\w\d]{1,4})\b",
        header_block,
        re.IGNORECASE,
    )
    if m_dob:
        extracted_dob = m_dob.group(1).strip()

    source = "report_header" if (extracted_age is not None or extracted_sex is not None or extracted_dob is not None) else "none"
    return {
        "age": extracted_age,
        "sex": extracted_sex,
        "dob": extracted_dob,
        "source": source,
    }


def extract_lab_data(text: str) -> Dict[str, Any]:
    """
    Extracts lab test values, metadata, and patient demographics from OCR text.
    Handles both structured [LAB_ROW] lines and unstructured text snippets.
    Returns:
        {
            "values": {key: float_val, ...},
            "meta": {key: {key, value, ref_lo, ref_hi, reported_range, unit, ...}, ...},
            "qualitative": {key: 1.0, ...},
            "demographics": {age, sex, dob, source}
        }
    """
    values: Dict[str, float] = {}
    meta: Dict[str, Any] = {}

    # 1. Parse structured table rows first
    for line in text.splitlines():
        if "[LAB_ROW]" in line:
            row_data = parse_structured_lab_row(line)
            if row_data:
                k = row_data["key"]
                if k not in values:
                    values[k] = row_data["value"]
                    meta[k] = row_data

    # 2. Extract remaining numeric values from unstructured text
    for key, aliases in LAB_ALIASES.items():
        if key in values:
            continue
        item_data = _extract_number_and_range_after_label(text, aliases, key=key)
        if item_data:
            values[key] = item_data["value"]
            meta[key] = item_data

    # 3. Extract qualitative markers
    qual = _extract_qualitative_markers(text)
    for qk, qv in qual.items():
        if qk not in values:
            values[qk] = qv

    # Backward compatibility: sync rdw and rdw_cv
    if "rdw_cv" in values and "rdw" not in values:
        values["rdw"] = values["rdw_cv"]
        if "rdw_cv" in meta:
            meta["rdw"] = meta["rdw_cv"]
    elif "rdw" in values and "rdw_cv" not in values:
        values["rdw_cv"] = values["rdw"]
        if "rdw" in meta:
            meta["rdw_cv"] = meta["rdw"]

    demographics = extract_patient_demographics_from_text(text)

    return {
        "values": values,
        "meta": meta,
        "qualitative": qual,
        "demographics": demographics,
    }


def extract_lab_values(text: str) -> Dict[str, float]:
    """Extract numeric lab values map (for backward compatibility)."""
    return extract_lab_data(text)["values"]


def analyze_lab_findings(
    lab: Dict[str, float],
    gender: Optional[str] = None,
    extracted_meta: Optional[Dict[str, Any]] = None,
    raw_text: str = "",
    patient_age: Optional[Union[float, int, str]] = None,
    patient_dob: Optional[Union[str, Any]] = None,
    patient_sex: Optional[str] = None,
    reference_date: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluate extracted values against physiological or report-specific reference ranges
    with demographic-aware selection (age, sex, units, and report provenance).

    Precedence:
      1. Valid laboratory-provided reference interval from report (range_source='report')
      2. Approved, configured interval matching patient demographics (range_source='standard_reference')
      3. Safe fallback requiring review when demographic data or reference range is missing/ambiguous
    """
    # 1. Extract demographics from document text if available
    report_demog = extract_patient_demographics_from_text(raw_text) if raw_text else {}

    # 2. Reconcile sex: explicit patient_sex > legacy gender > report_demog sex > None
    eff_sex: Optional[str] = None
    if patient_sex and str(patient_sex).strip():
        eff_sex = str(patient_sex).strip()
    elif gender and str(gender).strip() and str(gender).lower() not in ("unspecified", "unknown", "none"):
        eff_sex = str(gender).strip()
    elif report_demog.get("sex"):
        eff_sex = report_demog.get("sex")

    # 3. Reconcile age / DOB
    eff_age: Optional[Union[float, int, str]] = None
    if patient_age is not None and str(patient_age).strip() != "":
        eff_age = patient_age
    elif report_demog.get("age") is not None:
        eff_age = report_demog.get("age")

    eff_dob: Optional[Union[str, Any]] = None
    if patient_dob and str(patient_dob).strip():
        eff_dob = patient_dob
    elif report_demog.get("dob"):
        eff_dob = report_demog.get("dob")

    # 4. Validate and calculate demographics
    demographics = validate_and_calculate_demographics(
        age=eff_age,
        dob=eff_dob,
        sex=eff_sex,
        reference_date=reference_date,
    )

    findings: List[Dict[str, Any]] = []

    for key, val in lab.items():
        # Avoid duplicate row when both rdw_cv and rdw alias exist
        if key == "rdw" and ("rdw_cv" in lab or "rdw_sd" in lab):
            continue

        m_info = extracted_meta.get(key) if extracted_meta else None

        range_info = select_reference_range(
            analyte_key=key,
            patient_demographics=demographics,
            extracted_meta=extracted_meta,
            config_ranges=NORMAL_RANGES,
            value=val,
        )

        eval_res = evaluate_analyte_value(
            value=val,
            selected_range_info=range_info,
            analyte_key=key,
            extracted_unit=m_info.get("unit") if m_info else None,
        )

        # Outlier / misread protection
        ref_hi = range_info.get("ref_hi")
        cutoff = max((ref_hi or 100) * 100, 500000.0)
        if isinstance(val, (int, float)) and val > cutoff and key not in ("platelets", "wbc", "rbc"):
            continue

        status = eval_res["status"]
        hd = None
        if status == "LOW":
            hd = LAB_HINTS.get(key, {}).get("low")
        elif status == "HIGH":
            hd = LAB_HINTS.get(key, {}).get("high")

        findings.append({
            # Core fields (100% backward compatible)
            "parameter": key.replace("_", " ").title(),
            "value": round(val, 2) if isinstance(val, float) else val,
            "unit": range_info.get("unit", ""),
            "normal_range": range_info.get("normal_range", "N/A"),
            "status": status,
            "range_source": range_info.get("range_source", "none"),
            "is_fallback_range": range_info.get("is_fallback_range", False),
            "hint": hd.get("hint") if hd else None,
            "disease_hint": hd.get("disease") if hd else None,
            "reported_range": range_info.get("normal_range") if range_info.get("range_source") == "report" else None,

            # Phase 2 Demographic & Traceability Fields
            "extracted_value": val,
            "normalized_value": eval_res.get("normalized_value"),
            "ref_lo": range_info.get("ref_lo"),
            "ref_hi": range_info.get("ref_hi"),
            "interpretation": eval_res.get("interpretation", "unable to determine"),
            "demographic_matched": range_info.get("demographic_matched", False),
            "review_flags": eval_res.get("review_flags", []),
            "review_reasons": eval_res.get("review_reasons", []),
            "reference_metadata": range_info.get("metadata", {}),
        })

    return findings


def predict_conditions_from_findings(
    findings: List[Dict[str, Any]],
    patient_symptoms: str = "",
    raw_text: str = ""
) -> List[Dict[str, Any]]:
    """
    Generate differential diagnosis list across the 8 clinical categories.
    Strictly enforces: Dengue, Malaria, Typhoid, and Tuberculosis require
    disease-specific tests or distinct clinical symptoms, NOT just isolated CBC counts.
    """
    scored: Dict[str, int] = {}
    reasons: Dict[str, List[str]] = {}

    def add_case(disease: str, score: int, reason: str):
        scored[disease] = scored.get(disease, 0) + score
        reasons.setdefault(disease, []).append(reason)

    by_key = {f["parameter"].lower().replace(" ", "_"): f for f in findings}
    text_context = (f"{patient_symptoms} {raw_text}").lower()

    # Convenience accessors
    def val(param):
        f = by_key.get(param)
        return f["value"] if f else None

    def status(param):
        f = by_key.get(param)
        return f["status"] if f else "normal"

    # A text mention is not the same as a positive test. Keep both concepts separate.
    has_marker = lambda k: bool(re.search(rf"\b{re.escape(k)}\b", text_context))
    positive_markers = _extract_qualitative_markers(raw_text)

    def positive(*keys: str) -> bool:
        return any(bool(positive_markers.get(key)) or status(key) == "HIGH" for key in keys)

    def symptom(*terms: str) -> bool:
        return any(re.search(rf"\b{re.escape(term)}\b", text_context) for term in terms)

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 1: Anemias & Hematology Cases
    # ──────────────────────────────────────────────────────────────────────────
    hb_low = status("hemoglobin") == "LOW"
    mcv_low = status("mcv") == "LOW"
    mcv_high = status("mcv") == "HIGH"
    plt_low = status("platelets") == "LOW"
    wbc_low = status("wbc") == "LOW"
    rbc_low = status("rbc") == "LOW"

    # Pancytopenia -> Aplastic Anemia
    if hb_low and plt_low and wbc_low:
        add_case("Aplastic Anemia", 10, "Pancytopenia detected: low RBC/Hb, low WBC, and low platelets")

    # Iron Deficiency Anemia
    elif hb_low and (status("iron") == "LOW" or status("ferritin") == "LOW" or mcv_low):
        reasons_list = []
        if status("iron") == "LOW": reasons_list.append("low serum iron")
        if status("ferritin") == "LOW": reasons_list.append("low ferritin")
        if mcv_low: reasons_list.append(f"microcytic MCV ({val('mcv')})")
        add_case("Iron Deficiency Anemia", 9, f"Low Hemoglobin with {', '.join(reasons_list)}")

    # Thalassemia Pattern
    if mcv_low and status("mch") == "LOW" and (status("rbc") in ("normal", "HIGH") or (val("rbc") or 0) >= 4.5):
        add_case("Thalassemia Pattern", 8, "Microcytic hypochromic indices with preserved/high RBC count (Mentzer index pattern)")

    # Hemolytic Anemia
    if hb_low and (status("bilirubin") == "HIGH" or status("ldh") == "HIGH"):
        add_case("Hemolytic Anemia", 8, "Low Hb with elevated indirect bilirubin / LDH (hemolysis pattern)")

    # Sickle Cell Disease
    if has_marker("sickle") or has_marker("hb s") or has_marker("sickling"):
        add_case("Sickle Cell Disease", 9, "Abnormal hemoglobin analysis / sickle cell markers present")

    # Polycythemia
    if status("hemoglobin") == "HIGH" and (status("pcv") == "HIGH" or status("hematocrit") == "HIGH" or status("rbc") == "HIGH"):
        add_case("Polycythemia", 9, f"Elevated Hemoglobin ({val('hemoglobin')}), Hematocrit, and RBC count")

    # Severe Neutropenia / Agranulocytosis
    anc_val = val("absolute_neutrophils")
    neut_pct = val("neutrophils")
    if (anc_val is not None and anc_val < 1500) or (neut_pct is not None and neut_pct < 20 and wbc_low):
        add_case("Severe Neutropenia / Agranulocytosis", 10, f"Critical neutropenia (ANC {anc_val or neut_pct}) conferring severe infection susceptibility")

    # Eosinophilia Pattern
    aec_val = val("absolute_eosinophils")
    eos_pct = val("eosinophils")
    if (aec_val is not None and aec_val > 500) or (eos_pct is not None and eos_pct > 6.0) or status("absolute_eosinophils") == "HIGH" or status("eosinophils") == "HIGH":
        add_case("Eosinophilia Pattern", 7, f"Elevated eosinophils (AEC {aec_val or eos_pct}) — allergic, parasitic, or drug hypersensitivity pattern")

    # Immune Thrombocytopenia Pattern (ITP)
    if plt_low and not hb_low and not wbc_low and not positive("dengue_ns1_pos", "dengue_serology_pos", "malaria_pos"):
        add_case("Immune Thrombocytopenia Pattern", 8, f"Isolated thrombocytopenia ({val('platelets')}) with preserved red and white cell lineages")

    # Reticulocytosis / Hemolytic Compensation
    retic_val = val("reticulocyte_count")
    if status("reticulocyte_count") == "HIGH" or (retic_val is not None and retic_val > 2.5):
        add_case("Reticulocytosis / Hemolytic Compensation", 8, f"Elevated reticulocytes ({retic_val}%) reflecting accelerated bone marrow erythropoiesis")

    # Iron Overload / Hemochromatosis Pattern
    tsat_val = val("transferrin_saturation")
    if (tsat_val is not None and tsat_val > 50) or (status("ferritin") == "HIGH" and status("iron") == "HIGH"):
        add_case("Iron Overload / Hemochromatosis Pattern", 8, f"Elevated transferrin saturation ({tsat_val}%) and hyperferritinemia indicating iron overload")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 2: Infection-Related Cases
    # (RULE: Do NOT diagnose Dengue/Malaria/Typhoid/TB solely on CBC cytopenias)
    # ──────────────────────────────────────────────────────────────────────────
    has_dengue_specific = positive("dengue_ns1_pos", "dengue_serology_pos")
    dengue_symptoms = any(w in text_context for w in ["petechiae", "retro-orbital", "eye pain", "rash", "breakbone", "severe body ache"])
    if plt_low and (has_dengue_specific or dengue_symptoms):
        add_case("Dengue Fever", 10, f"Thrombocytopenia ({val('platelets')}) with dengue-specific test/symptom confirmation")

    has_malaria_specific = positive("malaria_pos")
    malaria_symptoms = any(w in text_context for w in ["chills", "rigor", "rigors", "night sweats", "cyclical fever"])
    if has_malaria_specific or (hb_low and malaria_symptoms):
        add_case("Malaria", 10, "Malaria antigen / smear positive or cyclical fever with rigors")

    has_typhoid_specific = positive("widal_pos")
    typhoid_symptoms = any(w in text_context for w in ["constipation", "prolonged fever", "step-ladder", "abdominal pain"])
    if has_typhoid_specific or (status("wbc") in ("LOW", "normal") and typhoid_symptoms and "fever" in text_context):
        add_case("Typhoid Fever", 10, "Positive Widal agglutination titer or step-ladder enteric fever pattern")

    has_tb_specific = positive("tb_molecular_pos")
    tb_symptoms = any(w in text_context for w in ["hemoptysis", "coughing blood", "night sweats", "persistent cough", "weight loss"])
    if has_tb_specific or (tb_symptoms and ("cough" in text_context and "sweats" in text_context)):
        add_case("Tuberculosis", 10, "AFB/GeneXpert molecular positivity or chronic cough with hemoptysis and night sweats")

    # Sepsis
    if status("lactate") == "HIGH" or status("procalcitonin") == "HIGH":
        add_case("Sepsis", 10, f"Critical metabolic/inflammatory markers: elevated lactate ({val('lactate')}) / procalcitonin")

    # Leukocytosis (isolated high WBC)
    if status("wbc") == "HIGH" and not (has_dengue_specific or has_malaria_specific or has_typhoid_specific):
        add_case("Leukocytosis", 6, f"Elevated WBC count ({val('wbc')}) indicating active inflammatory/infectious response")

    # Infectious Mononucleosis
    if positive("atypical_lymphocytes"):
        add_case("Infectious Mononucleosis", 8, "Atypical reactive lymphocytes or positive EBV serology")

    # Specific Serology & Extended Infectious Cases
    if positive("covid_pos"):
        add_case("COVID-19", 10, "SARS-CoV-2 antigen or RT-PCR reported positive")

    if positive("hiv_pos"):
        add_case("Possible HIV Infection Marker", 10, "HIV screening test reported reactive/positive; confirmatory Western Blot or PCR advised")

    if positive("syphilis_pos"):
        add_case("Possible Syphilis / Treponemal Seropositivity", 9, "VDRL/RPR or Treponemal antibody test reported reactive/positive")

    if positive("h_pylori_pos"):
        add_case("H. pylori Infection Pattern", 8, "Helicobacter pylori antigen/antibody reported positive")

    if positive("chikungunya_pos"):
        add_case("Possible Chikungunya Viral Infection", 9, "Chikungunya IgM serology/PCR reported positive")

    if positive("leptospira_pos"):
        add_case("Possible Leptospirosis Infection", 9, "Leptospira IgM / microscopic agglutination test reported positive")

    if positive("aso_pos"):
        add_case("Streptococcal Infection / Elevated ASO", 8, "Elevated antistreptolysin O (ASO) titer indicating recent streptococcal infection")

    # Urinary Tract Infection (Urine analysis)
    urine_infection = sum(1 for k in ["pus_cells", "nitrite", "leukocyte_esterase"] if status(k) == "HIGH" or has_marker(k))
    if urine_infection >= 2 or status("pus_cells") == "HIGH":
        add_case("Urinary Tract Infection", 9, "Pyuria with positive urine leukocyte esterase/nitrite")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 3: Kidney & Urinary Cases
    # ──────────────────────────────────────────────────────────────────────────
    creat_high = status("creatinine") == "HIGH"
    urea_high = status("urea") == "HIGH"

    # Acute Kidney Injury vs Chronic Kidney Disease
    if creat_high and (status("egfr") == "LOW" or val("egfr") and val("egfr") < 60):
        add_case("Chronic Kidney Disease", 9, f"Persistently reduced eGFR ({val('egfr')}) with elevated creatinine")
    elif creat_high and (urea_high or any(w in text_context for w in ["reduced urine", "acute", "oliguria"])):
        add_case("Acute Kidney Injury", 9, f"Acute elevation of serum creatinine ({val('creatinine')}) and urea")
    elif creat_high:
        add_case("Chronic Kidney Disease", 7, f"Elevated serum creatinine ({val('creatinine')})")

    # Nephrotic Syndrome
    if (status("protein_urine") == "HIGH" or has_marker("protein_urine")) and status("albumin") == "LOW":
        add_case("Nephrotic Syndrome", 9, f"Heavy proteinuria with hypoalbuminemia ({val('albumin')} g/dL)")

    # Kidney Stones
    if (status("rbc_urine") == "HIGH" or status("blood_urine") == "HIGH" or has_marker("hematuria")) and any(w in text_context for w in ["flank", "back pain", "stone", "renal"]):
        add_case("Kidney Stones", 9, "Urine hematuria with flank colic pain pattern")

    # Pyelonephritis
    has_pyuria = status("pus_cells") == "HIGH" or has_marker("pus") or has_marker("leukocyte") or has_marker("pyuria")
    if (has_pyuria or status("wbc") == "HIGH") and any(w in text_context for w in ["flank", "painful urination", "dysuria", "pyelonephritis"]) and any(w in text_context for w in ["fever", "chills", "high temp"]):
        add_case("Pyelonephritis", 9, "Urine pyuria/leukocytes with flank pain, painful urination, and systemic fever")

    # Glomerulonephritis
    if (status("rbc_urine") == "HIGH" or status("blood_urine") == "HIGH") and (status("protein_urine") == "HIGH" or creat_high):
        add_case("Glomerulonephritis", 8, "Concurrent hematuria and proteinuria with renal involvement")

    # Dehydration
    if (status("specific_gravity") == "HIGH" or urea_high) and not creat_high:
        add_case("Dehydration", 7, f"Concentrated urine (SG {val('specific_gravity')}) with elevated BUN/Urea")

    # Prerenal Azotemia Pattern
    bun_val = val("bun")
    creat_val = val("creatinine")
    if (bun_val and creat_val and creat_val > 0 and (bun_val / creat_val) >= 20) or (status("bun") == "HIGH" and not creat_high):
        add_case("Prerenal Azotemia Pattern", 8, f"Disproportionate BUN elevation relative to creatinine (BUN {bun_val}, Cr {creat_val}) indicating prerenal hypoperfusion")

    # Electrolyte & Mineral Imbalances
    if status("magnesium") == "LOW":
        add_case("Hypomagnesemia", 7, f"Serum magnesium low ({val('magnesium')} mg/dL) — risk of neuromuscular irritability and arrhythmias")

    if status("phosphorus") == "HIGH":
        add_case("Hyperphosphatemia", 7, f"Serum phosphorus elevated ({val('phosphorus')} mg/dL) — common with reduced renal clearance")
    elif status("phosphorus") == "LOW":
        add_case("Hypophosphatemia", 7, f"Serum phosphorus depleted ({val('phosphorus')} mg/dL)")

    # Acid-Base Disturbances
    bicarb_val = val("bicarbonate")
    art_ph = val("arterial_ph")
    if status("bicarbonate") == "LOW" or (art_ph is not None and art_ph < 7.35):
        add_case("Metabolic Acidosis Pattern", 8, f"Low serum bicarbonate ({bicarb_val} mmol/L) or acidemia (pH {art_ph})")
    elif status("bicarbonate") == "HIGH" or (art_ph is not None and art_ph > 7.45):
        add_case("Metabolic Alkalosis Pattern", 7, f"Elevated bicarbonate ({bicarb_val} mmol/L) or alkalemia (pH {art_ph})")

    # Urinary Protein Loss
    if status("protein_urine") == "HIGH" or status("uacr") == "HIGH" or status("microalbumin") == "HIGH":
        if "Nephrotic Syndrome" not in scored and "Glomerulonephritis" not in scored:
            add_case("Urinary Protein Loss", 7, "Elevated urine protein / microalbuminuria")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 4: Liver & Digestive Cases
    # ──────────────────────────────────────────────────────────────────────────
    alt_high = status("sgpt") == "HIGH"
    ast_high = status("sgot") == "HIGH"
    bili_high = status("bilirubin") == "HIGH"
    alp_high = status("alkaline_phosphatase") == "HIGH"
    ggt_high = status("ggt") == "HIGH"

    # Specific Hepatitis Viral Serology
    if positive("anti_hav_igm_pos"):
        add_case("Hepatitis A", 10, "Anti-HAV IgM is reported positive; confirm with the clinician and assay details.")
    if positive("hbsag_pos"):
        add_case("Hepatitis B", 10, "HBsAg reported reactive/positive for Hepatitis B surface antigen")
    if positive("anti_hcv_pos"):
        add_case("Hepatitis C", 9, "Anti-HCV or HCV RNA marker reported positive")

    # Obstructive Jaundice / Direct Hyperbilirubinemia
    dbili_val = val("direct_bilirubin")
    if (status("direct_bilirubin") == "HIGH" or (dbili_val and dbili_val > 0.4)) and bili_high:
        add_case("Obstructive Jaundice / Direct Hyperbilirubinemia", 9, f"Direct bilirubin elevated ({dbili_val} mg/dL) indicating cholestatic jaundice / biliary obstruction")

    # Cholestasis
    if alp_high and (ggt_high or bili_high):
        add_case("Cholestasis", 9, f"Biliary obstructive pattern: elevated ALP ({val('alkaline_phosphatase')}) and GGT")

    # Acute Pancreatitis
    if status("lipase") == "HIGH" or status("amylase") == "HIGH":
        add_case("Acute Pancreatitis", 10, f"Marked pancreatic enzyme elevation (Lipase {val('lipase')} / Amylase {val('amylase')})")

    # Severe Acute Liver Injury
    ast_val = val("sgot")
    alt_val = val("sgpt")
    if (ast_val and ast_val >= 1000) or (alt_val and alt_val >= 1000):
        add_case("Severe Acute Liver Injury", 10, f"Marked transaminase elevation (ALT {alt_val}, AST {ast_val} U/L) indicating massive acute hepatocellular necrosis")

    # Alcohol-Related Liver Injury Pattern
    elif ast_val and alt_val and ast_val > (2.0 * alt_val) and (ast_high or alt_high) and status("ggt") == "HIGH":
        add_case("Alcohol-Related Liver Injury Pattern", 8, f"AST:ALT ratio > 2:1 ({ast_val}:{alt_val}) with elevated GGT ({val('ggt')} U/L)")

    # Fatty Liver Disease
    elif (alt_high or ast_high) and not (bili_high or alp_high):
        add_case("Fatty Liver Disease", 7, f"Isolated transaminase elevation (ALT {val('sgpt')} / AST {val('sgot')})")

    # Hepatic Cirrhosis / Decompensation Pattern
    if status("albumin") == "LOW" and (status("inr") == "HIGH" or status("pt") == "HIGH") and (bili_high or alt_high or ast_high):
        add_case("Hepatic Cirrhosis / Decompensation Pattern", 9, f"Impaired hepatic synthetic function: low albumin ({val('albumin')} g/dL) and prolonged coagulation (INR {val('inr')})")

    # Celiac Disease
    if positive("ttg_iga_pos"):
        add_case("Possible Celiac Disease", 9, "Anti-tTG IgA is reported positive; interpretation depends on total IgA, diet, and confirmatory evaluation.")

    # GI Bleeding
    if hb_low and (has_marker("fobt") or has_marker("occult blood") or any(w in text_context for w in ["black stool", "melena", "rectal"])):
        add_case("Gastrointestinal Bleeding", 9, "Anemia with positive fecal occult blood / melena")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 5: Diabetes & Metabolic Cases
    # ──────────────────────────────────────────────────────────────────────────
    bs_val = val("blood_sugar")
    a1c_val = val("hba1c")

    # Diabetic Ketoacidosis
    if (bs_val and bs_val > 200 or status("blood_sugar") == "HIGH") and (status("ketones_urine") == "HIGH" or has_marker("ketone")):
        add_case("Diabetic Ketoacidosis", 10, "Hyperglycemia with positive urine/blood ketones")

    # Type 2 Diabetes vs Prediabetes
    elif (bs_val and bs_val >= 126) or (a1c_val and a1c_val >= 6.5):
        add_case("Type 2 Diabetes", 9, f"Fasting glucose {bs_val} mg/dL and HbA1c {a1c_val}% meeting diabetic criteria")
    elif (bs_val and 100 <= bs_val < 126) or (a1c_val and 5.7 <= a1c_val < 6.5):
        add_case("Prediabetes", 8, f"Impaired fasting glucose ({bs_val}) / HbA1c ({a1c_val}%) within prediabetic range")
    elif status("hba1c") == "HIGH" or status("blood_sugar") == "HIGH":
        add_case("Type 2 Diabetes", 7, "Elevated glucose / HbA1c")

    # Hypoglycemia
    if bs_val and bs_val < 70 or status("blood_sugar") == "LOW":
        add_case("Hypoglycemia", 9, f"Measured blood glucose low ({bs_val} mg/dL)")

    # Dyslipidemia & Metabolic Syndrome
    chol_high = status("cholesterol") == "HIGH"
    tg_high = status("triglycerides") == "HIGH"
    ldl_high = status("ldl") == "HIGH"
    hdl_low = status("hdl") == "LOW"

    if chol_high or tg_high or ldl_high or hdl_low:
        if tg_high and hdl_low and (bs_val and bs_val > 100):
            add_case("Metabolic Syndrome", 8, "Combined dyslipidemia (high TG, low HDL) with impaired fasting glucose")
        else:
            add_case("Dyslipidemia", 8, "Atherogenic lipid profile (elevated LDL/TG or low HDL)")

    # Hyperuricemia vs Gout
    if status("uric_acid") == "HIGH":
        if any(w in text_context for w in ["joint pain", "big toe", "podagra", "swelling", "gout"]):
            add_case("Gout", 9, f"Hyperuricemia ({val('uric_acid')} mg/dL) with acute joint inflammation symptoms")
        else:
            add_case("Hyperuricemia", 7, f"Elevated uric acid ({val('uric_acid')} mg/dL) without reported acute arthritis")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 6: Thyroid, Hormones & Calcium Cases
    # ──────────────────────────────────────────────────────────────────────────
    tsh_high = status("tsh") == "HIGH"
    tsh_low = status("tsh") == "LOW"
    ft4_high = status("ft4") == "HIGH" or status("t4") == "HIGH"
    ft4_low = status("ft4") == "LOW" or status("t4") == "LOW"

    # Hashimoto Thyroiditis vs Hypothyroidism
    if positive("anti_tpo_pos"):
        add_case("Hashimoto Thyroiditis", 10, "Anti-TPO antibodies positive with thyroid impairment profile")
    elif tsh_high:
        add_case("Hypothyroidism", 9, f"Elevated TSH ({val('tsh')}) with hypothyroid profile")

    # Graves' Disease vs Hyperthyroidism
    if positive("trab_pos"):
        add_case("Possible Graves' Disease", 9, "TSH-receptor antibody is reported positive; correlate with thyroid function tests.")
    elif tsh_low and (ft4_high or status("t3") == "HIGH"):
        add_case("Hyperthyroidism", 9, f"Suppressed TSH ({val('tsh')}) with elevated peripheral thyroid hormones")

    # Parathyroid & Calcium Disorders
    ca_high = status("calcium") == "HIGH"
    ca_low = status("calcium") == "LOW"

    if ca_high and status("pth") == "HIGH":
        add_case("Primary Hyperparathyroidism", 10, f"Hypercalcemia ({val('calcium')}) with inappropriately elevated PTH ({val('pth')})")
    elif ca_high:
        add_case("Hypercalcemia", 7, f"Elevated serum calcium ({val('calcium')} mg/dL)")
    elif ca_low:
        add_case("Hypocalcemia", 7, f"Low serum calcium ({val('calcium')} mg/dL)")

    # Adrenal Insufficiency
    if status("cortisol") == "LOW" and (status("sodium") == "LOW" or status("potassium") == "HIGH"):
        add_case("Adrenal Insufficiency", 9, f"Low serum cortisol ({val('cortisol')}) with electrolyte shifts")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 7: Heart, Clotting & Inflammation Cases
    # ──────────────────────────────────────────────────────────────────────────
    if status("troponin_i") == "HIGH" or status("troponin_t") == "HIGH":
        add_case("Myocardial Infarction", 10, "Elevated cardiac troponin indicating acute myocardial injury/infarction")

    if status("bnp") == "HIGH" or status("nt_probnp") == "HIGH":
        add_case("Heart Failure", 9, f"Elevated natriuretic peptide ({val('bnp') or val('nt_probnp')})")

    # DIC vs VTE vs Coagulation
    if plt_low and status("d_dimer") == "HIGH" and (status("inr") == "HIGH" or status("pt") == "HIGH" or status("fibrinogen") == "LOW"):
        add_case("Disseminated Intravascular Coagulation", 10, "Consumptive coagulopathy: low platelets, high D-Dimer, and prolonged PT/INR/hypofibrinogenemia")
    elif status("aptt") == "HIGH" and not (status("pt") == "HIGH" or status("inr") == "HIGH"):
        add_case("Intrinsic Coagulation Pathway Abnormality", 8, f"Isolated prolonged aPTT ({val('aptt')} s) with normal PT/INR — evaluate intrinsic factors (VIII, IX, XI, XII) or lupus anticoagulant")
    elif status("d_dimer") == "HIGH":
        add_case("Venous Thromboembolism", 8, f"Elevated D-Dimer ({val('d_dimer')} µg/mL)")

    # Autoimmune Rheumatic & Vasculitis
    if positive("anti_ccp_pos", "rf_pos"):
        add_case("Possible Rheumatoid Arthritis", 8, "Rheumatoid factor or anti-CCP is reported positive; antibodies alone do not establish the diagnosis.")

    if positive("anti_dsdna_pos", "ana_pos"):
        add_case("Possible Connective Tissue Autoimmune Disease", 8, "ANA or anti-dsDNA is reported positive; diagnosis requires clinical criteria and appropriate follow-up.")

    if positive("hla_b27_pos"):
        add_case("Ankylosing Spondylitis Pattern", 9, "HLA-B27 reported positive in evaluation of inflammatory axial spondyloarthritis")

    if positive("anti_scl70_pos"):
        add_case("Systemic Sclerosis Pattern", 9, "Anti-Scl-70 (anti-topoisomerase I) antibody reported positive")

    if positive("anti_ro_pos", "anti_la_pos"):
        add_case("Sjögren's Syndrome Pattern", 9, "Anti-Ro (SSA) / Anti-La (SSB) autoantibodies reported positive")

    if positive("anca_pos"):
        add_case("ANCA-Associated Vasculitis Pattern", 9, "ANCA serology reported positive in suspected systemic vasculitis")

    if (status("crp") == "HIGH" or status("esr") == "HIGH") and "Rheumatoid Arthritis" not in scored and "Sepsis" not in scored:
        add_case("Elevated Inflammation Markers", 6, f"Systemic acute-phase reactants elevated (CRP {val('crp')}, ESR {val('esr')})")

    # ──────────────────────────────────────────────────────────────────────────
    # CATEGORY 8: Vitamin & Nutritional Cases
    # ──────────────────────────────────────────────────────────────────────────
    if status("vitamin_d") == "LOW" or (val("vitamin_d") and val("vitamin_d") < 30):
        add_case("Vitamin D Deficiency", 8, f"Low 25-OH Vitamin D ({val('vitamin_d')} ng/mL)")

    if status("vitamin_b12") == "LOW" or (val("vitamin_b12") and val("vitamin_b12") < 200):
        add_case("Vitamin B12 Deficiency", 8, f"Serum B12 level reduced ({val('vitamin_b12')} pg/mL)")

    if status("folate") == "LOW" or (val("folate") and val("folate") < 3.0):
        add_case("Folate Deficiency", 8, f"Serum folate depleted ({val('folate')} ng/mL)")

    if status("protein") == "LOW" and status("albumin") == "LOW":
        if "Nephrotic Syndrome" not in scored:
            add_case("Protein-Energy Malnutrition", 7, f"Low total serum protein ({val('protein')}) and albumin ({val('albumin')})")

    if status("copper") == "LOW":
        add_case("Copper Deficiency", 8, f"Low serum copper concentration ({val('copper')} µg/dL)")

    # Tumor Markers & Reproductive Findings
    psa_val = val("psa")
    if status("psa") == "HIGH" or (psa_val and psa_val > 4.0):
        add_case("Elevated PSA — Prostatic Evaluation Recommended", 8, f"Total PSA elevated ({psa_val} ng/mL) — urological correlation (BPH, prostatitis, or prostatic neoplasia) indicated")

    ca125_val = val("ca125")
    if status("ca125") == "HIGH" or (ca125_val and ca125_val > 35.0):
        add_case("Elevated CA-125 — Gynecologic Evaluation Recommended", 8, f"CA-125 elevated ({ca125_val} U/mL) — gynecological correlation recommended")

    cea_val = val("cea")
    ca19_val = val("ca19_9")
    if (status("cea") == "HIGH" or (cea_val and cea_val > 5.0)) or (status("ca19_9") == "HIGH" or (ca19_val and ca19_val > 37.0)):
        add_case("Elevated Gastrointestinal Tumor Marker (CEA/CA19-9)", 8, f"Elevated tumor markers (CEA {cea_val}, CA 19-9 {ca19_val}) — gastrointestinal evaluation recommended")

    if positive("hcg_pos"):
        add_case("Positive Beta-hCG / Pregnancy Marker", 9, "Beta-hCG / urine pregnancy test positive — obstetric/gynecologic correlation indicated")

    # ──────────────────────────────────────────────────────────────────────────
    # ADDITIONAL DIFFERENTIALS — interpret as patterns, never as final diagnoses
    # ──────────────────────────────────────────────────────────────────────────

    # Microcytosis may be iron deficiency or a hemoglobinopathy; do not infer
    # iron deficiency from MCV alone.
    if hb_low and mcv_low and status("ferritin") != "LOW" and status("iron") != "LOW":
        add_case("Microcytic Anemia — cause undetermined", 6,
                 "Low hemoglobin with low MCV; iron studies, reticulocyte count and hemoglobin analysis may be needed.")

    if hb_low and mcv_high and (status("vitamin_b12") == "LOW" or status("folate") == "LOW"):
        add_case("Megaloblastic Anemia Pattern", 8,
                 "Anemia with macrocytosis and low B12/folate; clinician should assess cause and confirmatory tests.")

    if status("ferritin") == "HIGH" and (status("crp") == "HIGH" or status("esr") == "HIGH"):
        add_case("Inflammation-Associated Ferritin Elevation", 5,
                 "Ferritin can rise with inflammation and is not specific for iron overload.")

    # Kidney / urine
    if status("egfr") == "LOW" and val("egfr") is not None and val("egfr") < 60:
        add_case("Reduced Kidney Filtration — needs chronicity assessment", 7,
                 "eGFR below 60 can reflect kidney disease, but chronic kidney disease requires persistence or other evidence of kidney damage.")

    if (status("protein_urine") == "HIGH" or status("uacr") == "HIGH") and status("blood_sugar") == "HIGH":
        add_case("Possible Diabetes-Related Kidney Disease", 6,
                 "Hyperglycemia with urine protein/albumin may warrant repeat UACR/eGFR and diabetes assessment; this pattern alone does not establish cause.")

    if status("potassium") == "HIGH":
        add_case("Hyperkalemia", 7,
                 "Potassium is above the configured reference interval; promptly assess sample hemolysis, medications, kidney function and ECG when clinically indicated.")

    if status("potassium") == "LOW":
        add_case("Hypokalemia", 7,
                 "Potassium is below the configured reference interval; severity, symptoms and ECG findings determine urgency.")

    if status("sodium") == "LOW":
        add_case("Hyponatremia", 6,
                 "Low sodium has many causes and requires interpretation with symptoms, serum osmolality, volume status and medications.")

    if status("sodium") == "HIGH":
        add_case("Hypernatremia", 6,
                 "High sodium may reflect water deficit or other causes; assess hydration and clinical status.")

    if status("bilirubin") == "HIGH" and (status("sgpt") == "HIGH" or status("sgot") == "HIGH"):
        add_case("Liver Injury Pattern", 7,
                 "Elevated bilirubin with AST/ALT abnormalities needs assessment for liver, biliary, medication and hemolysis causes.")

    if status("albumin") == "LOW" and (status("bilirubin") == "HIGH" or status("sgpt") == "HIGH" or status("sgot") == "HIGH"):
        add_case("Abnormal Liver-Related Markers", 6,
                 "Low albumin with abnormal liver markers may reflect liver disease, inflammation, renal loss or nutrition; not specific to one cause.")

    if status("alkaline_phosphatase") == "HIGH" and not (status("ggt") == "HIGH" or status("bilirubin") == "HIGH"):
        add_case("Isolated ALP Elevation", 5,
                 "ALP may originate from bone or liver; correlate with GGT, age, pregnancy status and clinical context.")

    # Metabolic / endocrine
    if status("tsh") == "HIGH" and val("ft4") is not None and status("ft4") == "normal":
        add_case("Possible Subclinical Hypothyroidism", 5,
                 "Elevated TSH with measured FT4 in range may fit a subclinical pattern if confirmed; use the lab's range and repeat testing as appropriate.")

    if status("tsh") == "LOW" and val("ft4") is not None and val("t3") is not None and status("ft4") == "normal" and status("t3") == "normal":
        add_case("Possible Subclinical Hyperthyroidism", 5,
                 "Low TSH with measured thyroid hormones in range may fit a subclinical pattern if persistent and clinically confirmed.")

    if status("blood_sugar") == "HIGH" and (status("ketones_urine") == "HIGH" or positive("ketones_urine")):
        add_case("Hyperglycemia with Ketones — urgent clinical review", 8,
                 "Glucose elevation with ketones needs prompt assessment; DKA requires acid-base/electrolyte evaluation and cannot be diagnosed from urine ketones alone.")

    # Lipids: identify abnormalities without implying a specific cardiovascular event.
    if status("triglycerides") == "HIGH" and val("triglycerides") is not None and val("triglycerides") >= 500:
        add_case("Severe Hypertriglyceridemia", 8,
                 "Triglycerides at or above 500 mg/dL can increase pancreatitis risk; confirm units/fasting status and seek clinician guidance.")

    # Inflammation and coagulation
    if status("inr") == "HIGH" or status("pt") == "HIGH":
        add_case("Prolonged Coagulation Test", 6,
                 "PT/INR prolongation has multiple causes, including anticoagulants, liver dysfunction and vitamin K deficiency; interpret with medication history.")

    if status("d_dimer") == "HIGH":
        add_case("Elevated D-Dimer — nonspecific", 5,
                 "D-dimer can rise with thrombosis, infection, pregnancy, inflammation and age; it cannot diagnose a clot by itself.")

    # Vitamin/nutrition patterns
    if status("vitamin_b12") == "LOW" and mcv_high:
        add_case("Vitamin B12 Deficiency Pattern", 8,
                 "Low B12 with macrocytosis supports a deficiency pattern; assess symptoms and cause, including diet, absorption and medicines.")

    if status("iron") == "LOW" and status("ferritin") == "normal" and (status("crp") == "HIGH" or status("esr") == "HIGH"):
        add_case("Possible Iron Restriction with Inflammation", 5,
                 "Low serum iron with inflammation can occur in chronic disease; ferritin and transferrin saturation help distinguish causes.")

    # Symptom-supported possibilities. These are intentionally low-weight prompts
    # for clinical review, not diagnosis rules.
    if symptom("jaundice", "yellow eyes", "yellow skin") and status("bilirubin") == "HIGH":
        add_case("Jaundice — cause needs evaluation", 7,
                 "Reported jaundice with elevated bilirubin needs prompt assessment for hepatic, biliary and hemolytic causes.")

    if symptom("burning urination", "painful urination", "dysuria") and (
        status("nitrite") == "HIGH" or status("leukocyte_esterase") == "HIGH" or status("pus_cells") == "HIGH"
    ):
        add_case("Possible Urinary Tract Infection", 7,
                 "Urinary symptoms plus supportive urinalysis may warrant urine culture and clinician assessment.")

    if symptom("chest pain", "chest pressure", "shortness of breath") and (
        status("troponin_i") == "HIGH" or status("troponin_t") == "HIGH"
    ):
        add_case("Possible Acute Cardiac Event — emergency assessment", 10,
                 "Chest symptoms with elevated troponin require emergency assessment; troponin elevation is not specific to myocardial infarction.")

    if symptom("black stool", "melena", "vomiting blood") and hb_low:
        add_case("Possible Gastrointestinal Bleeding — urgent review", 8,
                 "Reported gastrointestinal bleeding symptoms with low hemoglobin require urgent medical evaluation.")

    # ──────────────────────────────────────────────────────────────────────────
    # Format and Rank Results
    # ──────────────────────────────────────────────────────────────────────────
    total = sum(scored.values())
    if not total:
        return []

    ranked = []
    for idx, (disease, score) in enumerate(sorted(scored.items(), key=lambda kv: kv[1], reverse=True)[:5], start=1):
        ranked.append({
            "rank": idx,
            "disease": disease,
            "doctor": get_specialist(disease),
            "confidence": round((score / total) * 100, 1),
            "confidence_note": "Rule-based pattern ranking only; not a validated clinical probability or confirmed diagnosis.",
            "why": reasons.get(disease, [])[:3],
        })
    return ranked
