"""
MediSense AI — Canonical Feature Engineering v11.1
===================================================
Single source of truth for both training and inference pipelines.
Encodes medical domain rules and disease-discriminating combinations.
"""

from typing import List, Union
import pandas as pd
import numpy as np

ALL_SYMPTOM_COLS: List[str] = [
    "fever", "high_fever", "chills", "night_sweats", "cold_sweats",
    "cough", "dry_cough", "productive_cough", "hemoptysis",
    "shortness_of_breath", "wheezing", "chest_tightness",
    "nasal_congestion", "runny_nose", "sneezing",
    "chest_pain", "palpitations", "rapid_heartbeat", "irregular_heartbeat", "leg_swelling",
    "headache", "severe_headache", "dizziness", "confusion", "seizures",
    "loss_of_consciousness", "tremors", "one_side_weakness", "speech_difficulty", "memory_problems",
    "nausea", "vomiting", "diarrhea", "constipation", "abdominal_pain", "bloating",
    "loss_of_appetite", "blood_in_stool", "rectal_bleeding", "difficulty_swallowing",
    "jaundice", "dark_urine", "pale_stools", "right_upper_quadrant_pain",
    "flank_pain", "blood_in_urine", "burning_urination", "frequent_urination", "reduced_urination",
    "excessive_thirst", "increased_appetite", "weight_loss", "weight_gain",
    "heat_intolerance", "cold_intolerance", "increased_sweating", "excessive_fatigue",
    "joint_pain", "muscle_pain", "back_pain", "neck_stiffness", "bone_pain",
    "skin_rash", "skin_itching", "hives", "petechiae", "skin_lesions", "hair_loss",
    "yellow_eyes", "blurred_vision", "eye_redness",
    "swollen_lymph_nodes", "sore_throat", "loss_of_smell", "loss_of_taste",
    "anxiety", "depression", "mood_changes",
    "fatigue", "general_weakness", "malaise", "slow_healing_wounds", "frequent_infections",
]


def _s(X: Union[pd.DataFrame, dict], col: str, default: float = 0.0):
    if isinstance(X, pd.DataFrame):
        return X[col] if col in X.columns else pd.Series(default, index=X.index, dtype=float)
    return X.get(col, default)


def build_features(X: pd.DataFrame) -> pd.DataFrame:
    """Build domain-engineered system, vital, and disease-discriminating features."""
    X = X.copy()

    # ── SYSTEM SCORES ─────────────────────────────────────────────────────────
    X["cardiac_risk"]      = _s(X,"chest_pain")*4+_s(X,"shortness_of_breath")*3+_s(X,"palpitations")*2+_s(X,"rapid_heartbeat")*2+_s(X,"irregular_heartbeat")*2+_s(X,"leg_swelling")
    X["neuro_risk"]        = _s(X,"one_side_weakness")*5+_s(X,"speech_difficulty")*5+_s(X,"loss_of_consciousness")*4+_s(X,"seizures")*4+_s(X,"confusion")*3+_s(X,"severe_headache")*2+_s(X,"neck_stiffness")*2
    X["infection_score"]   = _s(X,"high_fever")*3+_s(X,"fever")*2+_s(X,"chills")*2+_s(X,"night_sweats")*2+_s(X,"swollen_lymph_nodes")
    X["respiratory_score"] = _s(X,"shortness_of_breath")*3+_s(X,"cough")*2+_s(X,"wheezing")*2+_s(X,"chest_tightness")
    X["gi_score"]          = _s(X,"abdominal_pain")*2+_s(X,"nausea")+_s(X,"vomiting")+_s(X,"diarrhea")+_s(X,"jaundice")*2
    X["metabolic_score"]   = _s(X,"excessive_thirst")*3+_s(X,"frequent_urination")*2+_s(X,"weight_loss")*2+_s(X,"excessive_fatigue")
    X["skin_score"]        = _s(X,"skin_rash")*2+_s(X,"petechiae")*3+_s(X,"jaundice")*2+_s(X,"hives")
    X["musculo_score"]     = _s(X,"joint_pain")*2+_s(X,"muscle_pain")+_s(X,"bone_pain")*2+_s(X,"back_pain")

    # ── DISEASE-DISCRIMINATING SCORES ─────────────────────────────────────────
    X["dengue_score"] = (_s(X,"petechiae")*7+_s(X,"severe_headache")*3+_s(X,"joint_pain")*3+
                          _s(X,"eye_redness")*4+_s(X,"high_fever")*2+_s(X,"skin_rash")*2+
                          _s(X,"muscle_pain")*2-_s(X,"neck_stiffness")*6-_s(X,"chills")*4-_s(X,"productive_cough")*3)

    X["malaria_score"] = (_s(X,"chills")*6+_s(X,"night_sweats")*5+_s(X,"high_fever")*3+
                           _s(X,"muscle_pain")*2+_s(X,"malaise")*2-_s(X,"petechiae")*6-
                           _s(X,"skin_rash")*3-_s(X,"neck_stiffness")*5-_s(X,"productive_cough")*2)

    X["typhoid_score"] = (_s(X,"high_fever")*3+_s(X,"constipation")*5+_s(X,"abdominal_pain")*4+
                           _s(X,"malaise")*3+_s(X,"loss_of_appetite")*2-_s(X,"runny_nose")*4-
                           _s(X,"cough")*3-_s(X,"petechiae")*3-_s(X,"neck_stiffness")*4)

    X["leptospira_score"] = (_s(X,"muscle_pain")*5+_s(X,"jaundice")*4+_s(X,"high_fever")*3+
                              _s(X,"dark_urine")*3+_s(X,"eye_redness")*2-_s(X,"petechiae")*3-
                              _s(X,"neck_stiffness")*4)

    X["chikungunya_score"] = (_s(X,"joint_pain")*7+_s(X,"fever")*3+_s(X,"skin_rash")*3+
                               _s(X,"muscle_pain")*2-_s(X,"petechiae")*5-_s(X,"chills")*2-
                               _s(X,"night_sweats")*2)

    X["covid_score"] = (_s(X,"loss_of_taste")*7+_s(X,"loss_of_smell")*7+_s(X,"shortness_of_breath")*3+
                         _s(X,"fatigue")*2+_s(X,"fever")*1-_s(X,"runny_nose")*3-_s(X,"sneezing")*4-
                         _s(X,"muscle_pain")*2-_s(X,"chills")*3)

    X["flu_score"] = (_s(X,"muscle_pain")*5+_s(X,"high_fever")*4+_s(X,"fatigue")*3+
                       _s(X,"chills")*3+_s(X,"headache")*2-_s(X,"loss_of_taste")*6-
                       _s(X,"loss_of_smell")*6-_s(X,"runny_nose")*2)

    X["cold_score"] = (_s(X,"runny_nose")*6+_s(X,"sneezing")*5+_s(X,"sore_throat")*4+
                        _s(X,"nasal_congestion")*4-_s(X,"high_fever")*5-_s(X,"muscle_pain")*4-
                        _s(X,"loss_of_taste")*4-_s(X,"shortness_of_breath")*3)

    X["pneumonia_score"] = (_s(X,"productive_cough")*5+_s(X,"high_fever")*4+
                             _s(X,"shortness_of_breath")*4+_s(X,"chest_pain")*2-
                             _s(X,"wheezing")*3-_s(X,"runny_nose")*3-_s(X,"neck_stiffness")*4)

    X["asthma_score"] = (_s(X,"wheezing")*7+_s(X,"chest_tightness")*6+_s(X,"dry_cough")*4+
                          _s(X,"shortness_of_breath")*3-_s(X,"fever")*5-_s(X,"productive_cough")*3-
                          _s(X,"muscle_pain")*3-_s(X,"petechiae")*5)

    X["tb_score"] = (_s(X,"hemoptysis")*8+_s(X,"night_sweats")*5+_s(X,"weight_loss")*5+
                      _s(X,"productive_cough")*4+_s(X,"fatigue")*2-_s(X,"runny_nose")*5-
                      _s(X,"sneezing")*3-_s(X,"neck_stiffness")*3)

    X["meningitis_score"] = (_s(X,"neck_stiffness")*9+_s(X,"high_fever")*4+_s(X,"severe_headache")*4+
                              _s(X,"confusion")*4+_s(X,"petechiae")*4+_s(X,"vomiting")*2-
                              _s(X,"skin_itching")*5-_s(X,"hives")*6-_s(X,"one_side_weakness")*2-
                              _s(X,"skin_rash")*2)

    X["migraine_score"] = (_s(X,"severe_headache")*5+_s(X,"nausea")*4+_s(X,"blurred_vision")*3+
                            _s(X,"dizziness")*2-_s(X,"fever")*6-_s(X,"neck_stiffness")*8-
                            _s(X,"confusion")*5-_s(X,"petechiae")*4-_s(X,"skin_itching")*3)

    X["stroke_score"] = (_s(X,"one_side_weakness")*8+_s(X,"speech_difficulty")*7+
                          _s(X,"confusion")*3+_s(X,"dizziness")*2-_s(X,"fever")*4-
                          _s(X,"neck_stiffness")*5-_s(X,"petechiae")*4-_s(X,"skin_itching")*5-
                          _s(X,"chills")*3)

    X["epilepsy_score"] = (_s(X,"seizures")*9+_s(X,"loss_of_consciousness")*5+
                            _s(X,"confusion")*3-_s(X,"one_side_weakness")*2-
                            _s(X,"neck_stiffness")*3-_s(X,"fever")*2-_s(X,"skin_itching")*4)

    X["mi_score"] = (_s(X,"chest_pain")*7+_s(X,"cold_sweats")*6+_s(X,"shortness_of_breath")*3+
                      _s(X,"nausea")*2+_s(X,"palpitations")*2-_s(X,"leg_swelling")*3-
                      _s(X,"wheezing")*4-_s(X,"skin_itching")*5-_s(X,"neck_stiffness")*5)

    X["hf_score"] = (_s(X,"leg_swelling")*7+_s(X,"shortness_of_breath")*5+_s(X,"fatigue")*3+
                      _s(X,"reduced_urination")*3+_s(X,"bloating")*2-_s(X,"chest_pain")*2-
                      _s(X,"cold_sweats")*3-_s(X,"skin_itching")*5-_s(X,"petechiae")*4)

    X["pe_score"] = (_s(X,"shortness_of_breath")*6+_s(X,"chest_pain")*4+_s(X,"rapid_heartbeat")*4+
                      _s(X,"hemoptysis")*5-_s(X,"skin_itching")*5-_s(X,"neck_stiffness")*5)

    X["hypert_score"] = (_s(X,"headache")*3+_s(X,"dizziness")*2-_s(X,"leg_swelling")*3-
                          _s(X,"chest_tightness")*2-_s(X,"skin_itching")*4-_s(X,"petechiae")*4)

    X["hepatitis_score"] = (_s(X,"jaundice")*8+_s(X,"dark_urine")*6+_s(X,"right_upper_quadrant_pain")*5+
                             _s(X,"pale_stools")*5+_s(X,"yellow_eyes")*4-_s(X,"diarrhea")*2-
                             _s(X,"neck_stiffness")*5-_s(X,"petechiae")*3)

    X["cirrhosis_score"] = (_s(X,"jaundice")*5+_s(X,"leg_swelling")*5+_s(X,"abdominal_pain")*3+
                             _s(X,"blood_in_stool")*4+_s(X,"confusion")*2-
                             _s(X,"neck_stiffness")*4-_s(X,"skin_itching")*1)

    X["appendix_score"] = (_s(X,"abdominal_pain")*7+_s(X,"fever")*3+_s(X,"nausea")*3+
                            _s(X,"loss_of_appetite")*4-_s(X,"diarrhea")*3-_s(X,"constipation")*2-
                            _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*6)

    X["gastro_score"] = (_s(X,"vomiting")*5+_s(X,"diarrhea")*6+_s(X,"abdominal_pain")*3+
                          _s(X,"nausea")*4-_s(X,"constipation")*4-_s(X,"neck_stiffness")*5-
                          _s(X,"skin_itching")*4)

    X["cholera_score"] = (_s(X,"diarrhea")*8+_s(X,"vomiting")*4+_s(X,"excessive_thirst")*5+
                           _s(X,"general_weakness")*3-_s(X,"neck_stiffness")*5-_s(X,"skin_itching")*5)

    X["uti_score"] = (_s(X,"burning_urination")*8+_s(X,"frequent_urination")*5+
                       _s(X,"blood_in_urine")*3+_s(X,"fever")*2-_s(X,"flank_pain")*2-
                       _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*4)

    X["kidney_stone_score"] = (_s(X,"flank_pain")*9+_s(X,"blood_in_urine")*5+_s(X,"nausea")*3+
                                 _s(X,"vomiting")*2-_s(X,"burning_urination")*2-
                                 _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*5)

    X["ckd_score"] = (_s(X,"reduced_urination")*6+_s(X,"leg_swelling")*4+_s(X,"fatigue")*3+
                       _s(X,"nausea")*2+_s(X,"general_weakness")*3-_s(X,"burning_urination")*3-
                       _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*2)

    X["diabetes_score"] = (_s(X,"excessive_thirst")*7+_s(X,"frequent_urination")*6+
                            _s(X,"weight_loss")*4+_s(X,"slow_healing_wounds")*5+
                            _s(X,"blurred_vision")*3+_s(X,"fatigue")*2-_s(X,"weight_gain")*4-
                            _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*2)

    X["hypothy_score"] = (_s(X,"cold_intolerance")*7+_s(X,"weight_gain")*5+_s(X,"hair_loss")*5+
                           _s(X,"fatigue")*3+_s(X,"depression")*2+_s(X,"general_weakness")*2-
                           _s(X,"heat_intolerance")*6-_s(X,"weight_loss")*4-
                           _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*2)

    X["hyperthy_score"] = (_s(X,"heat_intolerance")*7+_s(X,"weight_loss")*5+_s(X,"rapid_heartbeat")*4+
                            _s(X,"anxiety")*3+_s(X,"increased_sweating")*3-_s(X,"cold_intolerance")*6-
                            _s(X,"weight_gain")*5-_s(X,"neck_stiffness")*5-_s(X,"skin_itching")*3)

    X["cushings_score"] = (_s(X,"weight_gain")*6+_s(X,"mood_changes")*3+_s(X,"increased_sweating")*3-
                            _s(X,"weight_loss")*6-_s(X,"neck_stiffness")*5-_s(X,"petechiae")*3-
                            _s(X,"skin_itching")*3)

    X["addisons_score"] = (_s(X,"fatigue")*5+_s(X,"weight_loss")*4+_s(X,"dizziness")*3+
                            _s(X,"general_weakness")*4+_s(X,"nausea")*2-_s(X,"weight_gain")*4-
                            _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*3)

    X["chickenpox_score"] = (_s(X,"skin_rash")*6+_s(X,"skin_itching")*5+_s(X,"fever")*3+
                              _s(X,"malaise")*2-_s(X,"petechiae")*5-_s(X,"neck_stiffness")*6-
                              _s(X,"joint_pain")*2)

    X["psoriasis_score"] = (_s(X,"skin_lesions")*7+_s(X,"skin_rash")*4+_s(X,"skin_itching")*4+
                             _s(X,"joint_pain")*2-_s(X,"fever")*5-_s(X,"neck_stiffness")*8-
                             _s(X,"high_fever")*6-_s(X,"confusion")*6-_s(X,"petechiae")*4)

    X["eczema_score"] = (_s(X,"skin_itching")*7+_s(X,"hives")*5+_s(X,"skin_rash")*3-
                          _s(X,"skin_lesions")*2-_s(X,"fever")*6-_s(X,"high_fever")*8-
                          _s(X,"neck_stiffness")*10-_s(X,"confusion")*8-_s(X,"petechiae")*6-
                          _s(X,"severe_headache")*6-_s(X,"seizures")*8-_s(X,"one_side_weakness")*8-
                          _s(X,"productive_cough")*4)

    X["anxiety_score"] = (_s(X,"anxiety")*8+_s(X,"palpitations")*4+_s(X,"tremors")*3+
                           _s(X,"dizziness")*2-_s(X,"depression")*1-_s(X,"neck_stiffness")*6-
                           _s(X,"petechiae")*5-_s(X,"high_fever")*4)

    X["depression_score"] = (_s(X,"depression")*8+_s(X,"fatigue")*4+_s(X,"mood_changes")*4+
                              _s(X,"weight_loss")*2-_s(X,"anxiety")*1-_s(X,"neck_stiffness")*6-
                              _s(X,"petechiae")*5-_s(X,"high_fever")*4)

    X["ra_score"] = (_s(X,"joint_pain")*5+_s(X,"swollen_lymph_nodes")*3+_s(X,"fatigue")*2+
                      _s(X,"malaise")*2-_s(X,"neck_stiffness")*4-_s(X,"petechiae")*4-
                      _s(X,"excessive_thirst")*3)

    X["gout_score"] = (_s(X,"joint_pain")*6+_s(X,"bone_pain")*3-_s(X,"skin_rash")*3-
                        _s(X,"fatigue")*2-_s(X,"neck_stiffness")*5-_s(X,"skin_itching")*3)

    X["hiv_score"] = (_s(X,"frequent_infections")*8+_s(X,"weight_loss")*5+
                       _s(X,"swollen_lymph_nodes")*4+_s(X,"fatigue")*3-
                       _s(X,"neck_stiffness")*4-_s(X,"skin_itching")*2)

    X["anemia_score"] = (_s(X,"fatigue")*5+_s(X,"general_weakness")*4+_s(X,"dizziness")*3+
                          _s(X,"palpitations")*2-_s(X,"frequent_infections")*4-
                          _s(X,"neck_stiffness")*5-_s(X,"skin_itching")*3)

    X["leukemia_score"] = (_s(X,"frequent_infections")*7+_s(X,"petechiae")*5+_s(X,"fatigue")*4+
                            _s(X,"swollen_lymph_nodes")*4+_s(X,"bone_pain")*3-
                            _s(X,"neck_stiffness")*4-_s(X,"skin_itching")*3)

    X["lupus_score"] = (_s(X,"skin_rash")*5+_s(X,"joint_pain")*4+_s(X,"hair_loss")*4+
                         _s(X,"fatigue")*3+_s(X,"blood_in_urine")*3-
                         _s(X,"neck_stiffness")*4-_s(X,"petechiae")*2)

    # ── VITAL FLAGS ──────────────────────────────────────────────────────────
    if "blood_pressure_systolic_mmhg" in X.columns:
        X["bp_high_flag"]     = (X["blood_pressure_systolic_mmhg"]>140).astype(int)
        X["bp_critical_flag"] = (X["blood_pressure_systolic_mmhg"]>180).astype(int)
        X["bp_normal"]        = ((X["blood_pressure_systolic_mmhg"]>=90)&(X["blood_pressure_systolic_mmhg"]<=120)).astype(int)
    else:
        X["bp_high_flag"]=0; X["bp_critical_flag"]=0; X["bp_normal"]=1

    if "oxygen_saturation_pct" in X.columns:
        X["spo2_low_flag"]      = (X["oxygen_saturation_pct"]<95).astype(int)
        X["spo2_critical_flag"] = (X["oxygen_saturation_pct"]<90).astype(int)
    else:
        X["spo2_low_flag"]=0; X["spo2_critical_flag"]=0

    if "body_temperature_celsius" in X.columns:
        X["fever_flag"]      = (X["body_temperature_celsius"]>38.0).astype(int)
        X["highfever_flag"]  = (X["body_temperature_celsius"]>39.0).astype(int)
        X["hyperfever_flag"] = (X["body_temperature_celsius"]>40.0).astype(int)
    else:
        X["fever_flag"]=0; X["highfever_flag"]=0; X["hyperfever_flag"]=0

    if "heart_rate_bpm" in X.columns:
        X["tachy_flag"]        = (X["heart_rate_bpm"]>100).astype(int)
        X["brady_flag"]        = (X["heart_rate_bpm"]<60).astype(int)
        X["severe_tachy_flag"] = (X["heart_rate_bpm"]>130).astype(int)
    else:
        X["tachy_flag"]=0; X["brady_flag"]=0; X["severe_tachy_flag"]=0

    if "blood_sugar_fasting_mgdl" in X.columns:
        X["sugar_high_flag"]     = (X["blood_sugar_fasting_mgdl"]>126).astype(int)
        X["sugar_critical_flag"] = (X["blood_sugar_fasting_mgdl"]>250).astype(int)
    else:
        X["sugar_high_flag"]=0; X["sugar_critical_flag"]=0

    if "bmi" in X.columns:
        X["obese_flag"]       = (X["bmi"]>30).astype(int)
        X["underweight_flag"] = (X["bmi"]<18.5).astype(int)
    else:
        X["obese_flag"]=0; X["underweight_flag"]=0

    if "age" in X.columns:
        X["age_risk_flag"]  = (X["age"]>50).astype(int)
        X["elderly_flag"]   = (X["age"]>65).astype(int)
        X["pediatric_flag"] = (X["age"]<12).astype(int)
    else:
        X["age_risk_flag"]=0; X["elderly_flag"]=0; X["pediatric_flag"]=0

    # ── META FEATURES ────────────────────────────────────────────────────────
    base = [c for c in ALL_SYMPTOM_COLS if c in X.columns]
    X["total_symptoms"]  = X[base].sum(axis=1)
    X["symptom_density"] = X["total_symptoms"]/max(len(ALL_SYMPTOM_COLS),1)
    X["has_fever_any"]   = ((_s(X,"fever")+_s(X,"high_fever"))>0).astype(int)
    X["has_pain_any"]    = ((_s(X,"chest_pain")+_s(X,"abdominal_pain")+_s(X,"joint_pain")+
                              _s(X,"back_pain")+_s(X,"headache")+_s(X,"severe_headache"))>0).astype(int)
    X["red_flag_count"]  = (_s(X,"chest_pain")+_s(X,"shortness_of_breath")+_s(X,"one_side_weakness")+
                             _s(X,"speech_difficulty")+_s(X,"loss_of_consciousness")+_s(X,"seizures")+
                             _s(X,"neck_stiffness")+_s(X,"petechiae"))
    X["multi_system"] = ((X["cardiac_risk"]>0).astype(int)+(X["neuro_risk"]>0).astype(int)+
                          (X["respiratory_score"]>0).astype(int)+(X["gi_score"]>0).astype(int)+
                          (X["metabolic_score"]>0).astype(int)+(X["skin_score"]>0).astype(int)+
                          (X["musculo_score"]>0).astype(int))

    hf_f = X["highfever_flag"]     if "highfever_flag"     in X.columns else 0
    sc_f = X["spo2_critical_flag"] if "spo2_critical_flag" in X.columns else 0
    st_f = X["severe_tachy_flag"]  if "severe_tachy_flag"  in X.columns else 0
    X["severity_proxy"] = X["red_flag_count"]*1.8+hf_f*1.5+sc_f*3.0+st_f*1.5+X["multi_system"]*0.8

    # Key medical discriminators as explicit features
    X["no_fever_but_itch"]   = (((_s(X,"fever")+_s(X,"high_fever"))==0)&(_s(X,"skin_itching")==1)).astype(int)
    X["fever_with_neck"]     = ((_s(X,"high_fever")>0)&(_s(X,"neck_stiffness")>0)).astype(int)
    X["focal_deficit"]       = ((_s(X,"one_side_weakness")>0)|(_s(X,"speech_difficulty")>0)).astype(int)
    X["osmotic_triad"]       = ((_s(X,"excessive_thirst")+_s(X,"frequent_urination")+_s(X,"weight_loss"))==3).astype(int)
    X["anosmia_combo"]       = ((_s(X,"loss_of_smell")>0)&(_s(X,"loss_of_taste")>0)).astype(int)
    X["dengue_signature"]    = ((_s(X,"petechiae")>0)&(_s(X,"high_fever")>0)&(_s(X,"joint_pain")>0)).astype(int)
    X["malaria_signature"]   = ((_s(X,"chills")>0)&(_s(X,"night_sweats")>0)&(_s(X,"high_fever")>0)).astype(int)
    X["cardiac_signature"]   = ((_s(X,"chest_pain")>0)&(_s(X,"cold_sweats")>0)).astype(int)
    X["jaundice_triad"]      = ((_s(X,"jaundice")+_s(X,"dark_urine")+_s(X,"right_upper_quadrant_pain"))>=2).astype(int)
    X["resp_infect_sig"]     = ((_s(X,"fever")>0)&(_s(X,"productive_cough")>0)&(_s(X,"shortness_of_breath")>0)).astype(int)
    X["thyroid_hyper_sig"]   = ((_s(X,"heat_intolerance")>0)&(_s(X,"weight_loss")>0)&(_s(X,"rapid_heartbeat")>0)).astype(int)
    X["thyroid_hypo_sig"]    = ((_s(X,"cold_intolerance")>0)&(_s(X,"weight_gain")>0)&(_s(X,"hair_loss")>0)).astype(int)
    X["eczema_safe"]         = ((_s(X,"neck_stiffness")+_s(X,"high_fever")+_s(X,"confusion")+
                                  _s(X,"petechiae")+_s(X,"seizures"))==0).astype(int)

    return X


def align_to_feature_names(X_engineered: pd.DataFrame, feature_names: List[str]) -> pd.DataFrame:
    """Align column order and fill missing values with 0."""
    return X_engineered.reindex(columns=feature_names, fill_value=0)
