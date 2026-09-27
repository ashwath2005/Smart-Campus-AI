import asyncio
import math
from datetime import datetime, timedelta, timezone
from app.algorithms.learning_intelligence import calculate_retention

def test_ebbinghaus_forgetting_curve():
    print("[TEST] Running Ebbinghaus Forgetting Curve Calculations (KDPA)...")
    
    # Base setup: Last revisited 5 days ago, mastery 80%, revision_count 2, difficulty 'medium'
    # Strength S = 1.5 * (1 + 2) * (1 + 0.8) / 1.3 = 4.5 * 1.8 / 1.3 = 8.1 / 1.3 ≈ 6.23
    # Retention R = e^(-5 / 6.23) ≈ e^(-0.80) ≈ 0.448 (44.8%)
    last_revisited = datetime.now() - timedelta(days=5)
    retention = calculate_retention(last_revisited, mastery=80.0, revision_count=2, difficulty="medium")
    print(f"Calculated Retention after 5 days (Medium Difficulty): {retention:.2f}%")
    assert 40.0 < retention < 50.0, "Forgetting curve retention outside anticipated limits."

    # Easy subject should have higher retention (decay slower)
    ret_easy = calculate_retention(last_revisited, mastery=80.0, revision_count=2, difficulty="easy")
    print(f"Calculated Retention after 5 days (Easy Difficulty): {ret_easy:.2f}%")
    assert ret_easy > retention, "Easy subject retention should be higher than medium subject retention."

    # Zero days elapsed should yield exactly 100% retention
    ret_instant = calculate_retention(datetime.now(), mastery=80.0, revision_count=0, difficulty="medium")
    print(f"Calculated Instant Retention: {ret_instant:.2f}%")
    assert math.isclose(ret_instant, 100.0, abs_tol=1.0), "Zero days elapsed should represent 100% retention."
    
    print("[TEST] KDPA Forgetting Curve calculations verified successfully!")

if __name__ == "__main__":
    test_ebbinghaus_forgetting_curve()
