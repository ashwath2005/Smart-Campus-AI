"""
Unified Test Runner for Smart Campus AI Backend
"""
import sys
import os
import subprocess
from pathlib import Path

# Add backend root to sys.path
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

def run_verify():
    print("=" * 60)
    print("Running System & AI Verification Test...")
    print("=" * 60)
    cmd = [sys.executable, str(BACKEND_ROOT / "tests" / "integration" / "test_verify.py")]
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run(cmd, env=env, cwd=str(BACKEND_ROOT))
    return result.returncode == 0

def main():
    success = run_verify()
    if success:
        print("\n[PASS] All baseline backend verification tests passed successfully.")
        sys.exit(0)
    else:
        print("\n[FAIL] Backend verification tests failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
