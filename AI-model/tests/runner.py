"""
Lightweight Test Runner for MediSense AI
========================================
Runs all test_* functions in tests/test_*.py with standard ASCII output.
"""

import sys
import os
import inspect
import importlib
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

TEST_FILES = [
    "tests.test_features",
    "tests.test_emergency",
    "tests.test_nlp",
    "tests.test_api",
    "tests.test_ocr_cases",
    "tests.test_cbc_regression",
    "tests.test_demographic_ranges",
]


def run_all_tests():
    total = 0
    passed = 0
    failed = 0
    print("\n" + "=" * 65)
    print("  MediSense AI -- Running Automated Test Suite")
    print("=" * 65)

    for mod_name in TEST_FILES:
        print(f"\n[Suite] {mod_name}")
        try:
            mod = importlib.import_module(mod_name)
        except Exception as e:
            print(f"  [ERROR] Failed to import {mod_name}: {e}")
            failed += 1
            continue

        test_callables = []
        # Module-level test functions
        for name, fn in inspect.getmembers(mod, inspect.isfunction):
            if name.startswith("test_"):
                test_callables.append((name, fn))

        # Test classes
        for cname, cls in inspect.getmembers(mod, inspect.isclass):
            if cname.startswith("Test"):
                try:
                    instance = cls()
                    for mname, mfn in inspect.getmembers(instance, inspect.ismethod):
                        if mname.startswith("test_"):
                            test_callables.append((f"{cname}.{mname}", mfn))
                except Exception as e:
                    print(f"  [ERROR] Failed to instantiate {cname}: {e}")

        for test_name, fn in test_callables:
            total += 1
            try:
                fn()
                print(f"  [PASS] {test_name}", flush=True)
                passed += 1
            except Exception as e:
                print(f"  [FAIL] {test_name}: {e}", flush=True)
                failed += 1

    print("\n" + "-" * 65, flush=True)
    print(f"  Summary: Total={total} | Passed={passed} | Failed={failed}", flush=True)
    print("=" * 65 + "\n", flush=True)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
