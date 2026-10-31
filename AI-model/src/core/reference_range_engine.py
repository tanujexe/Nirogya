"""
MediSense AI — Demographic-Aware Reference Range Engine
======================================================
Provides validated demographic parsing, age calculation from DOB,
and clinical reference-interval selection following CLSI EP28-A3c guidelines.

Selection Priority:
  1. Valid laboratory-provided reference interval from report (range_source='report')
  2. Approved, configured interval matching patient age and sex (range_source='standard_reference')
  3. Safe fallback requiring review when demographic data or reference range is missing/ambiguous
"""

from datetime import date, datetime
import re
from typing import Dict, Any, Optional, List, Tuple, Union


# Standard age group boundary definitions (in years)
AGE_GROUPS = {
    "neonate": (0.0, 0.08),       # 0 to ~28 days
    "infant": (0.08, 2.0),        # 1 month to 2 years
    "child": (2.0, 12.0),         # 2 to 12 years
    "adolescent": (12.0, 18.0),   # 12 to 18 years
    "adult": (18.0, 65.0),        # 18 to 65 years
    "elderly": (65.0, 150.0),     # 65+ years
}


def parse_date_string(date_str: str) -> Optional[date]:
    """
    Parse a date string in various standard international formats.
    Supported: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY/MM/DD.
    Returns datetime.date or None if invalid.
    """
    if not date_str or not isinstance(date_str, str):
        return None

    clean = date_str.strip()
    # Strip optional time component
    clean = re.sub(r"[T\s].*$", "", clean)

    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%Y/%m/%d",
        "%d.%m.%Y",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(clean, fmt).date()
        except ValueError:
            continue
    return None


def calculate_age_from_dob(
    dob: Union[date, str],
    reference_date: Optional[Union[date, str]] = None
) -> Tuple[Optional[float], Optional[int], List[str]]:
    """
    Calculate exact age in years and completed integer years from date of birth.
    
    Returns:
      (exact_age_years, completed_years, validation_errors)
    """
    errors: List[str] = []

    # Resolve reference date
    ref_d: date
    if reference_date is None:
        ref_d = datetime.now().date()
    elif isinstance(reference_date, str):
        parsed_ref = parse_date_string(reference_date)
        if not parsed_ref:
            errors.append(f"Invalid reference_date format: {reference_date}")
            return None, None, errors
        ref_d = parsed_ref
    elif isinstance(reference_date, (date, datetime)):
        ref_d = reference_date.date() if isinstance(reference_date, datetime) else reference_date
    else:
        errors.append(f"Unsupported reference_date type: {type(reference_date)}")
        return None, None, errors

    # Resolve DOB
    dob_d: date
    if isinstance(dob, (date, datetime)):
        dob_d = dob.date() if isinstance(dob, datetime) else dob
    elif isinstance(dob, str):
        parsed_dob = parse_date_string(dob)
        if not parsed_dob:
            errors.append(f"Invalid date of birth format or impossible date: {dob}")
            return None, None, errors
        dob_d = parsed_dob
    else:
        errors.append(f"Unsupported date of birth type: {type(dob)}")
        return None, None, errors

    # Check future birth date
    if dob_d > ref_d:
        errors.append(f"Date of birth ({dob_d}) cannot be in the future (reference date: {ref_d})")
        return None, None, errors

    # Calculate completed years
    completed_years = ref_d.year - dob_d.year - ((ref_d.month, ref_d.day) < (dob_d.month, dob_d.day))

    # Calculate precise fractional age (for infants and boundary sensitivity)
    days = (ref_d - dob_d).days
    fractional_years = round(days / 365.25, 4)

    # Biological sanity check
    if completed_years > 130:
        errors.append(f"Calculated age ({completed_years} years) exceeds maximum human lifespan (130 years)")
        return None, None, errors

    if completed_years < 0:
        errors.append("Calculated age cannot be negative")
        return None, None, errors

    return fractional_years, completed_years, errors


def get_age_group(age_years: Optional[float]) -> str:
    """Categorize age in years into standard clinical age group."""
    if age_years is None:
        return "unknown"
    if age_years < 0:
        return "invalid"
    for group, (low, high) in AGE_GROUPS.items():
        if low <= age_years < high:
            return group
    return "elderly" if age_years >= 65.0 else "unknown"


def validate_and_calculate_demographics(
    age: Optional[Union[int, float, str]] = None,
    dob: Optional[Union[date, str]] = None,
    sex: Optional[str] = None,
    reference_date: Optional[Union[date, str]] = None
) -> Dict[str, Any]:
    """
    Validates, normalizes, and reconciles patient demographic inputs.
    Never silently assumes age or sex.
    """
    validation_errors: List[str] = []
    calc_age: Optional[float] = None
    completed_years: Optional[int] = None
    dob_str: Optional[str] = None
    source = "none"

    # 1. Process DOB if present
    if dob is not None and str(dob).strip():
        source = "dob"
        calc_age, completed_years, dob_errs = calculate_age_from_dob(dob, reference_date)
        validation_errors.extend(dob_errs)
        if isinstance(dob, (date, datetime)):
            dob_str = dob.strftime("%Y-%m-%d")
        else:
            parsed = parse_date_string(str(dob))
            dob_str = parsed.strftime("%Y-%m-%d") if parsed else str(dob).strip()

    # 2. Process directly provided age
    if age is not None and str(age).strip() != "":
        parsed_age: Optional[float] = None
        raw_age_str = str(age).strip().lower()

        # Handle age with units like '6m', '3 months', '18y'
        m_month = re.match(r"^(\d+\.?\d*)\s*(?:m|mo|month|months)$", raw_age_str)
        m_year = re.match(r"^(\d+\.?\d*)\s*(?:y|yr|yrs|year|years)?$", raw_age_str)
        m_day = re.match(r"^(\d+\.?\d*)\s*(?:d|day|days)$", raw_age_str)

        if m_month:
            parsed_age = round(float(m_month.group(1)) / 12.0, 4)
        elif m_day:
            parsed_age = round(float(m_day.group(1)) / 365.25, 4)
        elif m_year:
            try:
                parsed_age = float(m_year.group(1))
            except ValueError:
                parsed_age = None

        if parsed_age is None:
            validation_errors.append(f"Unparseable age format: {age}")
        elif parsed_age < 0:
            validation_errors.append(f"Age cannot be negative: {age}")
        elif parsed_age > 130:
            validation_errors.append(f"Age exceeds biological limit (130 years): {age}")
        else:
            if calc_age is not None:
                # Reconcile age with DOB
                if abs(parsed_age - calc_age) > 1.1:
                    validation_errors.append(
                        f"Specified age ({parsed_age} yrs) conflicts with date of birth ({calc_age} yrs)"
                    )
            else:
                calc_age = parsed_age
                completed_years = int(parsed_age)
                source = "user_input"

    # 3. Process sex/gender
    norm_sex: Optional[str] = None
    if sex is not None and str(sex).strip():
        s = str(sex).strip().lower()
        if s in ("male", "m", "man", "boy"):
            norm_sex = "male"
        elif s in ("female", "f", "woman", "girl"):
            norm_sex = "female"
        elif s in ("other", "non-binary", "intersex", "transgender"):
            norm_sex = "other"
        elif s in ("unknown", "unspecified", "none", "not specified"):
            norm_sex = None
        else:
            validation_errors.append(f"Unrecognized sex/gender value: {sex}")
            norm_sex = None

    age_group = get_age_group(calc_age)
    is_valid = len(validation_errors) == 0

    return {
        "valid": is_valid,
        "age": calc_age if is_valid else None,
        "age_years": completed_years if is_valid else None,
        "age_group": age_group if is_valid else "unknown",
        "sex": norm_sex,
        "dob": dob_str,
        "demographic_source": source if is_valid else "invalid",
        "validation_errors": validation_errors,
        "is_complete": bool(calc_age is not None and norm_sex in ("male", "female")),
    }


def select_reference_range(
    analyte_key: str,
    patient_demographics: Optional[Dict[str, Any]] = None,
    extracted_meta: Optional[Dict[str, Any]] = None,
    config_ranges: Optional[Dict[str, Any]] = None,
    value: Optional[Union[float, int]] = None,
) -> Dict[str, Any]:
    """
    Selects the clinically appropriate reference interval for an analyte.
    
    Selection Priority:
      1. Valid laboratory-provided reference interval from report (range_source='report')
      2. Approved, configured interval matching patient age and sex (range_source='standard_reference')
      3. Unreviewed / Requires Review when demographics or reference intervals are unavailable or ambiguous
    """
    demog = patient_demographics or {
        "age": None,
        "sex": None,
        "age_group": "unknown",
        "valid": True,
        "validation_errors": [],
    }

    age = demog.get("age")
    sex = demog.get("sex")
    cfg = (config_ranges or {}).get(analyte_key)

    ref_lo: Optional[float] = None
    ref_hi: Optional[float] = None
    reported_range: Optional[str] = None
    unit: str = ""
    range_source = "none"
    is_fallback = False
    demographic_matched = False
    review_flags: List[str] = []
    review_reasons: List[str] = []
    source_metadata: Dict[str, Any] = {}

    m_info = extracted_meta.get(analyte_key) if extracted_meta else None

    # ──────────────────────────────────────────────────────────────────────────
    # PRIORITY 1: Laboratory-Provided Reference Range from Report
    # ──────────────────────────────────────────────────────────────────────────
    if m_info and (
        m_info.get("ref_lo") is not None
        or m_info.get("ref_hi") is not None
        or m_info.get("reported_range")
    ):
        raw_lo = m_info.get("ref_lo")
        raw_hi = m_info.get("ref_hi")
        rep_str = m_info.get("reported_range") or (f"{raw_lo}–{raw_hi}" if raw_lo is not None and raw_hi is not None else None)
        rep_unit = m_info.get("unit") or (cfg.get("unit", "") if cfg else "")

        # Check for inverted laboratory range
        if raw_lo is not None and raw_hi is not None and raw_lo > raw_hi:
            review_flags.append("inverted_report_range")
            review_reasons.append(
                f"Laboratory report printed inverted reference range: {raw_lo}–{raw_hi}"
            )
            return {
                "ref_lo": raw_lo,
                "ref_hi": raw_hi,
                "normal_range": rep_str or f"{raw_lo}–{raw_hi}",
                "unit": rep_unit,
                "range_source": "report",
                "is_fallback_range": False,
                "demographic_matched": True,
                "review_flags": review_flags,
                "review_reasons": review_reasons,
                "status_override": "review",
                "metadata": {"source": "Printed Laboratory Report", "status": "inverted"},
            }

        ref_lo = raw_lo
        ref_hi = raw_hi
        reported_range = rep_str
        unit = rep_unit
        range_source = "report"
        is_fallback = False
        demographic_matched = True

        # Check if report range conflicts significantly with standard reference
        if cfg and raw_lo is not None and raw_hi is not None:
            std_ref = cfg.get("male") or cfg.get("female")
            if isinstance(std_ref, list) and len(std_ref) == 2 and std_ref[0] is not None and std_ref[1] is not None:
                # If report range is 3x different than standard reference, add advisory flag
                if raw_hi > std_ref[1] * 3.5 or (std_ref[0] > 0 and raw_lo < std_ref[0] / 3.5):
                    review_flags.append("conflicting_lab_standard_range")
                    review_reasons.append(
                        f"Report range ({raw_lo}–{raw_hi}) deviates substantially from standard reference ({std_ref[0]}–{std_ref[1]})"
                    )

        return {
            "ref_lo": ref_lo,
            "ref_hi": ref_hi,
            "normal_range": reported_range or (f"{ref_lo}–{ref_hi}" if ref_lo is not None and ref_hi is not None else "N/A"),
            "unit": unit,
            "range_source": range_source,
            "is_fallback_range": is_fallback,
            "demographic_matched": demographic_matched,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
            "status_override": None,
            "metadata": {"source": "Printed Laboratory Report"},
        }

    # ──────────────────────────────────────────────────────────────────────────
    # PRIORITY 2: Configured Reference Interval with Demographic Matching
    # ──────────────────────────────────────────────────────────────────────────
    if not cfg:
        review_flags.append("no_approved_reference_range")
        review_reasons.append(f"No configured or approved reference interval for analyte: {analyte_key}")
        return {
            "ref_lo": None,
            "ref_hi": None,
            "normal_range": "N/A",
            "unit": m_info.get("unit", "") if m_info else "",
            "range_source": "none",
            "is_fallback_range": False,
            "demographic_matched": False,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
            "status_override": "unreviewed",
            "metadata": {},
        }

    unit = (m_info.get("unit") if m_info and m_info.get("unit") else "") or cfg.get("unit", "")
    is_fallback = True
    range_source = "standard_reference"
    source_metadata = {
        "source": cfg.get("source", "Standard Reference Range Database"),
        "citation_url": cfg.get("citation_url"),
        "reviewed_date": cfg.get("reviewed_date"),
        "population": cfg.get("population", "General Population"),
    }

    is_age_dependent = bool(cfg.get("age_dependent", False) or "intervals" in cfg)
    is_sex_dependent = bool(cfg.get("sex_dependent", False))

    # Check for sex-specific tests (e.g. PSA for males only)
    if cfg.get("applicable_sex") == "male" and sex == "female":
        review_flags.append("inapplicable_demographic_for_test")
        review_reasons.append(f"{analyte_key.upper()} reference intervals are clinically inapplicable for female patients")
        return {
            "ref_lo": None,
            "ref_hi": None,
            "normal_range": "N/A (Male only)",
            "unit": unit,
            "range_source": "standard_reference",
            "is_fallback_range": True,
            "demographic_matched": False,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
            "status_override": "review",
            "metadata": source_metadata,
        }

    # Evaluate intervals array if present
    matched_interval: Optional[Dict[str, Any]] = None
    if "intervals" in cfg and isinstance(cfg["intervals"], list):
        if age is None:
            if cfg.get("requires_age", False):
                # When age is missing for an age-dependent analyte, check if the value is
                # unequivocally outside all age intervals (e.g. ALP > 360 U/L is HIGH for all ages).
                all_highs: List[float] = []
                all_lows: List[float] = []
                sex_keys = [sex] if sex in ("male", "female") else ["male", "female"]
                for interval in cfg["intervals"]:
                    for s_key in sex_keys:
                        rng = interval.get(s_key)
                        if isinstance(rng, list) and len(rng) == 2:
                            if rng[0] is not None:
                                all_lows.append(float(rng[0]))
                            if rng[1] is not None:
                                all_highs.append(float(rng[1]))

                is_unambiguous = False
                val_num = None
                if value is not None:
                    try:
                        val_num = float(value)
                    except (ValueError, TypeError):
                        pass

                if val_num is not None:
                    if all_highs and val_num > max(all_highs):
                        is_unambiguous = True
                    elif all_lows and val_num < min(all_lows):
                        is_unambiguous = True

                if not is_unambiguous:
                    # Ambiguous without age: cannot select interval when analyte strictly requires age
                    review_flags.append("missing_age_for_age_dependent_analyte")
                    review_reasons.append(
                        f"Patient age is required to determine the appropriate reference interval for {analyte_key.replace('_', ' ').title()}"
                    )
                    return {
                        "ref_lo": None,
                        "ref_hi": None,
                        "normal_range": "Age required",
                        "unit": unit,
                        "range_source": "standard_reference",
                        "is_fallback_range": True,
                        "demographic_matched": False,
                        "review_flags": review_flags,
                        "review_reasons": review_reasons,
                        "status_override": "unreviewed",
                        "metadata": source_metadata,
                    }
                else:
                    # Unequivocally elevated or decreased across all age brackets.
                    review_flags.append("missing_age_demographic")
                    review_reasons.append(
                        f"Age not specified; value ({val_num}) exceeds all age-group thresholds and was evaluated against adult interval"
                    )
                    for interval in cfg["intervals"]:
                        if "adult" in interval.get("description", "").lower():
                            matched_interval = interval
                            break
                    if not matched_interval:
                        matched_interval = cfg["intervals"][-1]
            else:
                # Fallback to standard adult interval with explicit advisory flag that age was missing
                review_flags.append("missing_age_demographic")
                review_reasons.append(
                    f"Age not specified; evaluated against standard adult reference interval for {analyte_key.replace('_', ' ').title()}"
                )
                for interval in cfg["intervals"]:
                    if "adult" in interval.get("description", "").lower():
                        matched_interval = interval
                        break
                if not matched_interval:
                    matched_interval = cfg["intervals"][-1]
        else:
            # Match age interval with exact half-open boundaries: [age_min, age_max)
            for interval in cfg["intervals"]:
                amin = interval.get("age_min", 0.0)
                amax = interval.get("age_max", 150.0)
                if amin <= age < amax:
                    matched_interval = interval
                    break

            if not matched_interval:
                review_flags.append("age_out_of_configured_intervals")
                review_reasons.append(f"Patient age ({age} yrs) falls outside configured age intervals")
                return {
                    "ref_lo": None,
                    "ref_hi": None,
                    "normal_range": "Out of age range",
                    "unit": unit,
                    "range_source": "standard_reference",
                    "is_fallback_range": True,
                    "demographic_matched": False,
                    "review_flags": review_flags,
                    "review_reasons": review_reasons,
                    "status_override": "review",
                    "metadata": source_metadata,
                }

    # If an interval was matched, resolve sex-specific bounds from interval
    if matched_interval:
        source_metadata["interval_description"] = matched_interval.get("description")
        source_metadata["interval_source"] = matched_interval.get("source", source_metadata.get("source"))

        interval_male = matched_interval.get("male")
        interval_female = matched_interval.get("female")
        interval_sex_dependent = interval_male != interval_female

        if interval_sex_dependent:
            if not sex:
                review_flags.append("missing_sex_for_sex_dependent_analyte")
                review_reasons.append(
                    f"Patient sex is required to evaluate {analyte_key.replace('_', ' ').title()} in this age group"
                )
                m_str = f"{interval_male[0]}–{interval_male[1]}" if isinstance(interval_male, list) else "N/A"
                f_str = f"{interval_female[0]}–{interval_female[1]}" if isinstance(interval_female, list) else "N/A"
                return {
                    "ref_lo": None,
                    "ref_hi": None,
                    "normal_range": f"M: {m_str}, F: {f_str}",
                    "unit": unit,
                    "range_source": "standard_reference",
                    "is_fallback_range": True,
                    "demographic_matched": False,
                    "review_flags": review_flags,
                    "review_reasons": review_reasons,
                    "status_override": "unreviewed",
                    "metadata": source_metadata,
                }
            chosen = interval_male if sex == "male" else interval_female
        else:
            chosen = interval_male or interval_female

        if isinstance(chosen, list) and len(chosen) == 2:
            ref_lo, ref_hi = chosen[0], chosen[1]
            demographic_matched = True
            reported_range = f"{ref_lo}–{ref_hi}"
        elif isinstance(chosen, list) and len(chosen) == 1:
            ref_lo = chosen[0]
            demographic_matched = True
            reported_range = str(ref_lo)

        return {
            "ref_lo": ref_lo,
            "ref_hi": ref_hi,
            "normal_range": reported_range or "N/A",
            "unit": unit,
            "range_source": range_source,
            "is_fallback_range": True,
            "demographic_matched": demographic_matched,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
            "status_override": None,
            "metadata": source_metadata,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # PRIORITY 3: Flat Config Format ("male" / "female" keys)
    # ──────────────────────────────────────────────────────────────────────────
    male_range = cfg.get("male")
    female_range = cfg.get("female")
    flat_sex_dependent = is_sex_dependent or (male_range != female_range)

    # If analyte is sex-dependent and sex is missing:
    if flat_sex_dependent:
        if not sex:
            review_flags.append("missing_sex_for_sex_dependent_analyte")
            review_reasons.append(
                f"Sex is required for sex-dependent reference range: {analyte_key.replace('_', ' ').title()}"
            )
            m_str = f"{male_range[0]}–{male_range[1]}" if isinstance(male_range, list) and len(male_range) == 2 else "N/A"
            f_str = f"{female_range[0]}–{female_range[1]}" if isinstance(female_range, list) and len(female_range) == 2 else "N/A"
            return {
                "ref_lo": None,
                "ref_hi": None,
                "normal_range": f"M: {m_str}, F: {f_str}",
                "unit": unit,
                "range_source": "standard_reference",
                "is_fallback_range": True,
                "demographic_matched": False,
                "review_flags": review_flags,
                "review_reasons": review_reasons,
                "status_override": "unreviewed",
                "metadata": source_metadata,
            }
        chosen = male_range if sex == "male" else female_range
    else:
        chosen = male_range if male_range is not None else female_range

    if isinstance(chosen, list):
        if len(chosen) == 2:
            ref_lo, ref_hi = chosen[0], chosen[1]
            if ref_lo is not None and ref_hi is not None:
                reported_range = f"{ref_lo}–{ref_hi}"
            elif ref_lo is not None:
                reported_range = f">{ref_lo}"
            elif ref_hi is not None:
                reported_range = f"<{ref_hi}"
        elif len(chosen) == 1:
            reported_range = str(chosen[0])
        demographic_matched = True
    elif chosen is None:
        reported_range = "N/A"
        review_flags.append("qualitative_or_unbounded")
    else:
        reported_range = str(chosen)
        demographic_matched = True

    return {
        "ref_lo": ref_lo,
        "ref_hi": ref_hi,
        "normal_range": reported_range or "N/A",
        "unit": unit,
        "range_source": range_source,
        "is_fallback_range": True,
        "demographic_matched": demographic_matched,
        "review_flags": review_flags,
        "review_reasons": review_reasons,
        "status_override": None,
        "metadata": source_metadata,
    }


def evaluate_analyte_value(
    value: Union[float, int, str],
    selected_range_info: Dict[str, Any],
    analyte_key: str = "",
    extracted_unit: str = "",
) -> Dict[str, Any]:
    """
    Evaluates extracted value against selected reference interval.
    Enforces unit mismatch protection, value normalization, and neutral clinical wording.
    """
    review_flags: List[str] = list(selected_range_info.get("review_flags", []))
    review_reasons: List[str] = list(selected_range_info.get("review_reasons", []))
    ref_lo = selected_range_info.get("ref_lo")
    ref_hi = selected_range_info.get("ref_hi")
    range_unit = str(selected_range_info.get("unit", "")).lower()
    cur_unit = str(extracted_unit or selected_range_info.get("unit", "")).lower()

    # If the range selection produced a status override (e.g. inverted range or missing demographic):
    if selected_range_info.get("status_override"):
        status = selected_range_info["status_override"]
        interp = "requires review" if status == "review" else "unable to determine"
        return {
            "status": status,
            "interpretation": interp,
            "normalized_value": value,
            "unit_mismatch": False,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
        }

    # Unit mismatch protections
    unit_mismatch = False
    if analyte_key == "rdw_sd" and "%" in cur_unit:
        unit_mismatch = True
        review_flags.append("unit_mismatch_rdw_sd_percent")
        review_reasons.append("RDW-SD is measured in femtoliters (fL), but percent (%) was detected")
    elif analyte_key == "rdw_cv" and "fl" in cur_unit:
        unit_mismatch = True
        review_flags.append("unit_mismatch_rdw_cv_fl")
        review_reasons.append("RDW-CV is a percentage (%), but femtoliters (fL) was detected")

    if unit_mismatch:
        return {
            "status": "review",
            "interpretation": "requires review",
            "normalized_value": value,
            "unit_mismatch": True,
            "review_flags": review_flags,
            "review_reasons": review_reasons,
        }

    # Value normalization if comparing numeric value against config
    val_eval = value
    if isinstance(value, (int, float)):
        val_float = float(value)
        val_eval = val_float
        is_fallback = selected_range_info.get("is_fallback_range", False)

        if is_fallback:
            if analyte_key == "platelets":
                if val_float <= 10.0:
                    val_eval = val_float * 100000.0
                elif 10.0 < val_float < 1000.0 and ref_hi and ref_hi > 10000:
                    val_eval = val_float * 1000.0
                elif val_float > 10000 and ref_hi and ref_hi < 1000:
                    val_eval = val_float / 1000.0
            elif analyte_key == "wbc":
                if val_float <= 50.0 and ref_hi and ref_hi > 1000:
                    val_eval = val_float * 1000.0
                elif val_float > 1000 and ref_hi and ref_hi < 50:
                    val_eval = val_float / 1000.0
            elif analyte_key == "rbc":
                if val_float > 100000.0 and ref_hi and ref_hi < 100:
                    val_eval = val_float / 1000000.0
            elif analyte_key in ("hemoglobin", "mchc"):
                if (cur_unit == "g/l" or val_float > 100.0) and ref_hi and ref_hi < 50.0:
                    val_eval = val_float / 10.0
            elif analyte_key == "blood_sugar":
                if (cur_unit == "mmol/l" or val_float < 30.0) and ref_hi and ref_hi > 60.0:
                    val_eval = val_float * 18.018

    # Physiological comparison
    status = "normal"
    interpretation = "within reference interval"

    if not isinstance(val_eval, (int, float)):
        # Qualitative marker
        status = "normal"
        interpretation = "within reference interval"
    elif ref_lo is not None and ref_hi is not None:
        if val_eval < ref_lo:
            status = "LOW"
            interpretation = "below reference interval"
        elif val_eval > ref_hi:
            status = "HIGH"
            interpretation = "above reference interval"
        else:
            status = "normal"
            interpretation = "within reference interval"
    elif ref_lo is not None and ref_hi is None:
        if val_eval < ref_lo:
            status = "LOW"
            interpretation = "below reference interval"
        else:
            status = "normal"
            interpretation = "within reference interval"
    elif ref_lo is None and ref_hi is not None:
        if val_eval > ref_hi:
            status = "HIGH"
            interpretation = "above reference interval"
        else:
            status = "normal"
            interpretation = "within reference interval"
    else:
        # Qualitative / clinical threshold handling
        if analyte_key in ("troponin_i", "troponin_t") and isinstance(val_eval, (int, float)) and val_eval > 0.04:
            status = "HIGH"
            interpretation = "above reference interval"
        elif analyte_key == "d_dimer" and isinstance(val_eval, (int, float)) and val_eval > 0.5:
            status = "HIGH"
            interpretation = "above reference interval"
        elif analyte_key in ("protein_urine", "ketones_urine", "blood_urine", "nitrite", "leukocyte_esterase") and isinstance(val_eval, (int, float)) and val_eval >= 1.0:
            status = "HIGH"
            interpretation = "above reference interval"
        else:
            status = "unreviewed"
            interpretation = "unable to determine"

    return {
        "status": status,
        "interpretation": interpretation,
        "normalized_value": val_eval,
        "unit_mismatch": False,
        "review_flags": review_flags,
        "review_reasons": review_reasons,
    }
