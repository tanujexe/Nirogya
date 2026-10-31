"""
MediSense AI — OCR Engine & Document Processor
===============================================
Extracts text from lab reports (Images and PDFs).
Combines:
  1. PyMuPDF (fitz) / pypdf / pypdfium2 / pdfminer for PDF reports
  2. PDF page rendering (150-200 DPI) for scanned & image-based PDF reports
  3. OpenCV preprocessing (denoise, bilateralFilter, Otsu & adaptive thresholding)
  4. Pytesseract with multi-PSM scoring (--psm 6, --psm 4, --psm 11, --psm 3)
  5. Windows 10/11 WinRT Native OCR fallback
  6. EasyOCR fallback
"""

import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Optional, Union
from config.settings import TESSERACT_CMD

# Ensure UTF-8 output streams on Windows to prevent UnicodeEncodeError with clinical symbols
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_TESSERACT_CONFIGURED = False


def configure_tesseract():
    """Auto-detect and configure Tesseract executable on Windows/Linux."""
    global _TESSERACT_CONFIGURED
    if _TESSERACT_CONFIGURED:
        return
    try:
        import pytesseract
    except Exception:
        return

    cmd = TESSERACT_CMD
    if not cmd or not os.path.exists(cmd):
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
            os.path.expandvars(r"%ProgramFiles%\Tesseract-OCR\tesseract.exe"),
        ]
        for c in candidates:
            if os.path.exists(c):
                cmd = c
                break

        if not cmd:
            import shutil
            which_tess = shutil.which("tesseract")
            if which_tess:
                cmd = which_tess

    if cmd and os.path.exists(cmd):
        pytesseract.pytesseract.tesseract_cmd = str(cmd)
        tess_dir = os.path.dirname(str(cmd))
        if tess_dir not in os.environ.get("PATH", ""):
            os.environ["PATH"] = tess_dir + os.pathsep + os.environ.get("PATH", "")
        tessdata = os.path.join(tess_dir, "tessdata")
        if os.path.exists(tessdata) and "TESSDATA_PREFIX" not in os.environ:
            os.environ["TESSDATA_PREFIX"] = tessdata

    _TESSERACT_CONFIGURED = True


configure_tesseract()


def clean_ocr_text(text: str) -> str:
    """Standardize OCR characters, numbers, and spacing while preserving structured [LAB_ROW] lines."""
    lines = str(text or "").splitlines()
    cleaned_lines = []
    for line in lines:
        if line.startswith("[LAB_ROW]"):
            l = line.replace("µ", "u").replace("μ", "u").replace("—", "-")
            cleaned_lines.append(l.strip())
        else:
            l = line.replace("|", " ").replace("~", " ").replace("—", "-")
            l = re.sub(r"[\t\r]+", " ", l)
            l = re.sub(r"[ ]{2,}", " ", l)
            l = re.sub(r"(?<=\d)[oO](?=\d)", ".", l)
            l = re.sub(r"(?<=\d),(?=\d)", ".", l)
            l = l.replace("µ", "u").replace("μ", "u")
            cleaned_lines.append(l)
    return "\n".join(cleaned_lines)


def score_ocr_text(text: str) -> float:
    """Score candidate OCR output quality based on clinical laboratory keywords."""
    t = str(text or "").lower()
    if not t.strip():
        return -1.0

    keywords = [
        "hemoglobin", "hb", "hgb", "rbc", "wbc", "platelet", "platelets", "pcv", "mcv", "mch", "mchc", "rdw",
        "neutrophils", "lymphocytes", "eosinophils", "monocytes", "basophils",
        "glucose", "blood sugar", "hba1c", "cholesterol", "triglycerides",
        "creatinine", "urea", "bilirubin", "sgot", "sgpt", "ast", "alt", "alp", "ggt",
        "tsh", "t3", "t4", "ft3", "ft4",
        "protein", "albumin", "globulin", "specific gravity", "leukocyte esterase", "nitrite",
        "pus cells", "urine", "urinalysis", "cbc", "complete blood count", "reference value",
        "sodium", "potassium", "chloride", "calcium", "uric acid", "esr",
        "aptt", "ptt", "fibrinogen", "magnesium", "phosphorus", "bicarbonate", "bun",
        "tibc", "reticulocyte", "psa", "ca125", "cea", "ca19-9", "afp", "vdrl", "hiv",
    ]
    score = 0.0
    for kw in keywords:
        # Use regex to match keyword boundary
        if re.search(rf"\b{re.escape(kw)}\b", t):
            score += 15.0 if len(kw) > 4 else 8.0

    for marker in ("normal", "result", "unit", "reference", "report", "investigation", "differential", "interval"):
        if marker in t:
            score += 4.0

    score += min(len(re.findall(r"\b\d+(?:\.\d+)?\b", t)), 30)
    score += min(len(t), 500) / 120.0
    if "end of report" in t or "page 1 of 1" in t or "qr code" in t:
        score -= 5.0
    return score


def windows_native_ocr(filepath: str) -> str:
    """Fallback Windows 10/11 WinRT OCR via PowerShell without requiring external binaries."""
    try:
        import subprocess
        abs_path = os.path.abspath(filepath)
        if not os.path.exists(abs_path):
            return ""

        ps_script = f"""
        try {{
            $ErrorActionPreference = 'Stop'
            $Ref_Stream  = [Windows.Storage.Streams.RandomAccessStreamReference, Windows.Storage, ContentType=WindowsRuntime]
            $Ref_Decoder = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType=WindowsRuntime]
            $Ref_Engine  = [Windows.Media.Ocr.OcrEngine, Windows.Media, ContentType=WindowsRuntime]
            $Ref_Lang    = [Windows.Globalization.Language, Windows.Globalization, ContentType=WindowsRuntime]
            $Ref_File    = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]

            function Get-Result($AsyncOperation) {{
                while (-not $AsyncOperation.IsCompleted) {{ Start-Sleep -Milliseconds 10 }}
                return $AsyncOperation.GetResults()
            }}

            $path = "{abs_path.replace('\\', '\\\\')}"
            if (-not (Test-Path $path)) {{ throw "File not found: $path" }}

            $file = Get-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path))
            $stream = Get-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read))
            $decoder = Get-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
            $bitmap = Get-Result ($decoder.GetSoftwareBitmapAsync())

            $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
            if (-not $engine) {{
                $lang = [Windows.Globalization.Language]::new("en-US")
                $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
            }}
            $ocrResult = Get-Result ($engine.RecognizeAsync($bitmap))
            $lines = @($ocrResult.Lines | ForEach-Object {{ $_.Text }})
            [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
            Write-Output ($lines -join "`n")
        }} catch {{
            Write-Error $_.Exception.Message
            exit 1
        }}
        """
        result = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return ""


def detect_and_extract_table_rows(img_cv) -> list:
    """
    Detect table rows and columns, extracting clean structured lines.
    Handles tabular lab reports by cropping cell-by-cell or row-by-row with 3x Lanczos scaling.
    """
    if img_cv is None or not hasattr(img_cv, "size") or img_cv.size == 0:
        return []
    try:
        import cv2
        import numpy as np
        import pytesseract
        h, w = img_cv.shape[:2]
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY) if len(img_cv.shape) == 3 else img_cv
        _, thresh = cv2.threshold(gray, 215, 255, cv2.THRESH_BINARY_INV)

        # 1. Detect horizontal lines
        horiz_k = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        horiz = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horiz_k)
        row_sums = np.sum(horiz, axis=1)
        line_ys = np.where(row_sums > 15 * 255)[0]

        all_y = []
        for y in line_ys:
            if not all_y or y > all_y[-1] + 5:
                all_y.append(int(y))

        # Find candidate table body: longest sequence of consecutive lines with spacing 12..55
        runs = []
        current_run = []
        for i in range(len(all_y) - 1):
            diff = all_y[i + 1] - all_y[i]
            if 12 <= diff <= 55 and all_y[i] > int(h * 0.12):
                if not current_run:
                    current_run.append(all_y[i])
                current_run.append(all_y[i + 1])
            else:
                if len(current_run) >= 4:
                    runs.append(current_run)
                current_run = []
        if len(current_run) >= 4:
            runs.append(current_run)

        if not runs:
            return []

        table_y = max(runs, key=len)
        table_y = sorted(list(set(table_y)))
        t_start, t_end = table_y[0], table_y[-1]

        # 2. Detect vertical column dividers in this specific table band
        vert_crop = thresh[t_start:t_end, :]
        vert_k = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 60))
        vert = cv2.morphologyEx(vert_crop, cv2.MORPH_OPEN, vert_k)
        col_sums = np.sum(vert, axis=0)
        col_xs = np.where(col_sums > 35 * 255)[0]

        x_cols = []
        for x in col_xs:
            if not x_cols or x > x_cols[-1] + 6:
                x_cols.append(int(x))

        results = []
        has_columns = len(x_cols) >= 3 and (x_cols[1] - x_cols[0]) > 40

        for i in range(len(table_y) - 1):
            y1, y2 = table_y[i], table_y[i + 1]
            diff = y2 - y1
            if diff < 10 or diff > 65:
                continue

            actual_y2 = y1 + 17 if diff > 20 else y2

            if has_columns:
                # Col 1: Test Name
                c1 = img_cv[y1 + 1:actual_y2 - 1, x_cols[0] + 2:x_cols[1] - 2]
                c1_s = cv2.resize(c1, (c1.shape[1] * 3, c1.shape[0] * 3), interpolation=cv2.INTER_LANCZOS4)
                c1_g = cv2.cvtColor(c1_s, cv2.COLOR_BGR2GRAY) if len(c1_s.shape) == 3 else c1_s
                name_txt = pytesseract.image_to_string(c1_g, config='--oem 3 --psm 7').strip()

                # Col 2: Result Value (Numeric)
                c2 = img_cv[y1 + 1:actual_y2 - 1, x_cols[1] + 2:x_cols[2] - 2]
                c2_s = cv2.resize(c2, (c2.shape[1] * 4, c2.shape[0] * 4), interpolation=cv2.INTER_LANCZOS4)
                c2_g = cv2.cvtColor(c2_s, cv2.COLOR_BGR2GRAY) if len(c2_s.shape) == 3 else c2_s
                val_txt = pytesseract.image_to_string(
                    c2_g, config='--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789.LHlh'
                ).strip()

                # Col 3: Reference Interval
                c3 = img_cv[y1 + 1:actual_y2 - 1, x_cols[2] + 2:x_cols[3] - 2] if len(x_cols) > 3 else None
                ref_txt = ""
                if c3 is not None and c3.size > 0:
                    c3_s = cv2.resize(c3, (c3.shape[1] * 3, c3.shape[0] * 3), interpolation=cv2.INTER_LANCZOS4)
                    c3_g = cv2.cvtColor(c3_s, cv2.COLOR_BGR2GRAY) if len(c3_s.shape) == 3 else c3_s
                    ref_txt = pytesseract.image_to_string(
                        c3_g, config='--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789.-–<> '
                    ).strip()

                # Col 4: Unit
                c4 = img_cv[y1 + 1:actual_y2 - 1, x_cols[3] + 2:x_cols[4] - 2] if len(x_cols) > 4 else None
                unit_txt = ""
                if c4 is not None and c4.size > 0:
                    c4_s = cv2.resize(c4, (c4.shape[1] * 3, c4.shape[0] * 3), interpolation=cv2.INTER_LANCZOS4)
                    c4_g = cv2.cvtColor(c4_s, cv2.COLOR_BGR2GRAY) if len(c4_s.shape) == 3 else c4_s
                    unit_txt = pytesseract.image_to_string(c4_g, config='--oem 3 --psm 7').strip()

                # Validate row
                if any(c.isalpha() for c in name_txt) and any(c.isdigit() for c in val_txt):
                    results.append(f"[LAB_ROW] {name_txt} | {val_txt} | {ref_txt} | {unit_txt}")
            else:
                # Fallback borderless row
                crop = img_cv[y1:actual_y2, int(w * 0.08):int(w * 0.8)]
                scaled = cv2.resize(crop, (crop.shape[1] * 3, crop.shape[0] * 3), interpolation=cv2.INTER_LANCZOS4)
                cgray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY) if len(scaled.shape) == 3 else scaled
                txt = pytesseract.image_to_string(cgray, config='--oem 3 --psm 6').strip()
                if txt and any(c.isdigit() for c in txt):
                    results.append(f"[LAB_ROW] {txt}")

        return results
    except Exception:
        return []


def ocr_image(img_or_path: Union[str, Path, object]) -> str:
    """
    Run multi-variant preprocessing, table structure extraction, and Tesseract OCR cascade on an image.
    Accepts filepath, PIL Image, or OpenCV/numpy image.
    """
    configure_tesseract()
    try:
        import cv2
        import numpy as np
        import pytesseract
        from PIL import Image

        temp_file_to_clean = None
        pil_img = None
        img_cv = None

        if isinstance(img_or_path, (str, Path)):
            filepath = str(img_or_path)
            if not os.path.exists(filepath):
                return ""
            img_cv = cv2.imread(filepath)
            try:
                pil_img = Image.open(filepath)
            except Exception:
                pass
        elif isinstance(img_or_path, Image.Image):
            pil_img = img_or_path
            rgb = np.array(pil_img.convert("RGB"))
            img_cv = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        elif isinstance(img_or_path, np.ndarray):
            img_cv = img_or_path
            rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB) if len(img_cv.shape) == 3 else img_cv
            pil_img = Image.fromarray(rgb)
        else:
            return ""

        table_rows = []
        if img_cv is not None and img_cv.size > 0:
            table_rows = detect_and_extract_table_rows(img_cv)

        candidates = []

        if img_cv is not None and img_cv.size > 0:
            h, w = img_cv.shape[:2]
            # Scaling optimization for OCR resolution
            if w < 1200:
                scale = min(1600.0 / float(w), 2.5)
                resized = cv2.resize(img_cv, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)
            elif w > 2600:
                scale = 2200.0 / float(w)
                resized = cv2.resize(img_cv, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            else:
                resized = img_cv

            gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY) if len(resized.shape) == 3 else resized
            denoised = cv2.bilateralFilter(gray, 7, 50, 50)
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            # Fast early-exit cascade to optimize response time:
            # 1. Grayscale PSM 4 is cleanest and fastest on digital & high-res medical lab scans
            try:
                res_fast = pytesseract.image_to_string(gray, config="--oem 3 --psm 4")
                if res_fast and len(res_fast.strip()) > 10:
                    candidates.append(res_fast)
            except Exception:
                pass

            # 2. Only run additional passes if the initial grayscale pass did not yield strong clinical text
            if not candidates or score_ocr_text(candidates[0]) < 40.0:
                for var, cfg in [(thresh, "--oem 3 --psm 6"), (gray, "--oem 3 --psm 6"), (thresh, "--oem 3 --psm 4")]:
                    try:
                        res = pytesseract.image_to_string(var, config=cfg)
                        if res and len(res.strip()) > 10:
                            candidates.append(res)
                            if score_ocr_text(res) >= 40.0:
                                break
                    except Exception:
                        pass

        # Fallback to direct pytesseract on PIL Image if no candidates yet
        if not candidates and pil_img is not None:
            for cfg in ["--oem 3 --psm 4", "--oem 3 --psm 6"]:
                try:
                    res = pytesseract.image_to_string(pil_img, config=cfg)
                    if res and res.strip():
                        candidates.append(res)
                except Exception:
                    pass

        best_text = ""
        if candidates:
            best_text = max(candidates, key=score_ocr_text)

        # If Tesseract struggled, try Windows Native OCR if available
        if (score_ocr_text(best_text) < 15.0 or len(best_text.strip()) < 30) and os.name == "nt":
            test_path = str(img_or_path) if isinstance(img_or_path, (str, Path)) else None
            if not test_path and pil_img is not None:
                tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
                pil_img.save(tmp.name, format="PNG")
                tmp.close()
                test_path = tmp.name
                temp_file_to_clean = tmp.name

            if test_path and os.path.exists(test_path):
                native = windows_native_ocr(test_path)
                if native and score_ocr_text(native) > score_ocr_text(best_text):
                    best_text = native

        # Clean up temporary file if created
        if temp_file_to_clean and os.path.exists(temp_file_to_clean):
            try:
                os.remove(temp_file_to_clean)
            except Exception:
                pass

        if table_rows:
            table_block = "\n".join(table_rows)
            full_out = f"{table_block}\n\n{best_text}"
        else:
            full_out = best_text

        cleaned = clean_ocr_text(full_out)
        return cleaned.strip() or "[Could not extract text — ensure image is clear and well-lit]"

    except Exception as e:
        return f"[OCR error: {e}]"


def extract_text_from_pdf(filepath: str) -> str:
    """
    Extract text from PDF reports, handling both digital PDFs and scanned image PDFs.
    1. Attempts digital selectable text extraction.
    2. If digital text has low clinical yield (< 2 lab values or low score),
       renders pages as images (150 DPI) and executes OCR.
    3. Merges or selects optimal clinical findings.
    """
    digital_chunks = []
    pdf_doc = None
    page_count = 0

    # 1. Try PyMuPDF
    try:
        import pymupdf
        pdf_doc = pymupdf.open(filepath)
        page_count = len(pdf_doc)
        for page in pdf_doc:
            txt = page.get_text("text") or ""
            if txt.strip():
                digital_chunks.append(txt.strip())
    except Exception:
        try:
            import fitz
            pdf_doc = fitz.open(filepath)
            page_count = len(pdf_doc)
            for page in pdf_doc:
                txt = page.get_text("text") or ""
                if txt.strip():
                    digital_chunks.append(txt.strip())
        except Exception:
            pass

    # 1b. Fallback digital readers if pymupdf could not open
    if not digital_chunks:
        try:
            import pypdf
            reader = pypdf.PdfReader(filepath)
            page_count = len(reader.pages)
            for p in reader.pages:
                txt = p.extract_text() or ""
                if txt.strip():
                    digital_chunks.append(txt.strip())
        except Exception:
            pass

    if not digital_chunks:
        try:
            from pdfminer.high_level import extract_text as pe
            mined = pe(filepath)
            if mined and mined.strip():
                digital_chunks.append(mined.strip())
        except Exception:
            pass

    digital_text = "\n\n".join(digital_chunks)
    digital_score = score_ocr_text(digital_text)

    # Check whether digital text already has actual clinical biomarkers
    from src.ocr.lab_parser import extract_lab_values
    digital_vals = extract_lab_values(digital_text)

    # If digital text is rich with 3+ lab values and decent score, return immediately
    if len(digital_vals) >= 3 and digital_score >= 20.0 and len(digital_text.strip()) >= 100:
        return clean_ocr_text(digital_text)

    # 2. Scanned or image-based PDF: render pages to images and execute OCR
    ocr_chunks = []
    max_pages = min(page_count if page_count > 0 else 8, 8)

    if pdf_doc is not None:
        try:
            import io
            from PIL import Image
            for idx in range(min(len(pdf_doc), max_pages)):
                page = pdf_doc[idx]
                pix = page.get_pixmap(dpi=150)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                page_txt = ocr_image(img)
                if page_txt and not page_txt.startswith("[Could not extract"):
                    ocr_chunks.append(f"--- Page {idx + 1} ---\n{page_txt}")
        except Exception:
            pass

    # If PyMuPDF rendering failed or was unavailable, try pypdfium2
    if not ocr_chunks:
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(filepath)
            for idx in range(min(len(pdf), max_pages)):
                page = pdf[idx]
                pil_image = page.render(scale=2.0).to_pil_image()
                page_txt = ocr_image(pil_image)
                if page_txt and not page_txt.startswith("[Could not extract"):
                    ocr_chunks.append(f"--- Page {idx + 1} ---\n{page_txt}")
        except Exception:
            pass

    ocr_text = "\n\n".join(ocr_chunks)
    ocr_score = score_ocr_text(ocr_text)
    ocr_vals = extract_lab_values(ocr_text)

    # Combine or choose the best result
    if len(ocr_vals) > len(digital_vals) or ocr_score > digital_score:
        if digital_text and len(digital_text.strip()) > 50 and digital_text not in ocr_text:
            combined = f"{digital_text}\n\n{ocr_text}"
        else:
            combined = ocr_text
    else:
        if ocr_text and len(ocr_text.strip()) > 50 and ocr_text not in digital_text:
            combined = f"{digital_text}\n\n{ocr_text}"
        else:
            combined = digital_text or ocr_text

    cleaned = clean_ocr_text(combined)
    return cleaned.strip() or "[Could not extract text from PDF — ensure document is clear and readable]"


def extract_text_from_file(filepath: str) -> str:
    """Extract text from PDF or Image using optimal OCR cascade."""
    if not filepath or not os.path.exists(filepath):
        return "[Error: File does not exist]"

    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(filepath)
    else:
        return ocr_image(filepath)
