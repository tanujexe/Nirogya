"""
Tesseract OCR Environment Validator
===================================
Checks whether Tesseract is installed and reachable by pytesseract.
"""

import os
import pytesseract
from config.settings import TESSERACT_CMD

candidates = [
    TESSERACT_CMD,
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

found = False
for c in candidates:
    if c and os.path.exists(c):
        pytesseract.pytesseract.tesseract_cmd = c
        print(f"[OCR] Found Tesseract executable at: {c}")
        found = True
        break

if not found:
    print("[OCR] Tesseract executable not found in default paths.")

try:
    version = pytesseract.get_tesseract_version()
    print(f"[OCR] Tesseract Version: {version}")
    print("[OCR] OCR Engine is functioning correctly.")
except Exception as e:
    print(f"[OCR] Tesseract execution test failed: {e}")
