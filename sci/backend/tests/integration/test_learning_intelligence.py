import unittest
import json
import math
from datetime import datetime, date, timedelta
from app.algorithms.alra_service import calculate_alra_study_load, adapt_study_plan_json
from app.algorithms.dsea_service import calculate_dsea_metrics
from app.algorithms.icqea_service import (
    clean_text_content, 
    slice_text_into_chunks, 
    calculate_cosine_similarity, 
    calculate_keyword_overlap,
    calculate_qes
)

class TestLearningIntelligence(unittest.TestCase):

    def test_alra_calculations(self):
        print("[TEST] Running ALRA Extended Calculations Check...")
        res = calculate_alra_study_load(
            remaining_days=5,
            difficulty=1.8, # Hard
            weakness=0.8, # Low mastery
            quiz_score=0.95,
            focus_time=0.90,
            completion_rate=0.92,
            attendance=0.85,
            available_hours=3.0
        )
        self.assertGreater(res["study_load"], 0.5)
        self.assertLessEqual(res["study_load"], 6.0)
        print(f"  - Calculated study load: {res['study_load']} hours. Passed!")

    def test_dsea_metrics(self):
        print("[TEST] Running DSEA Career and Skill Gap Calculations Check...")
        res = calculate_dsea_metrics(
            cgpa=8.5,
            current_skills=["Python", "Machine Learning", "Git"],
            projects=[{"title": "Image Classifier", "complexity": "hard"}],
            coding_points=800,
            certifications=["TensorFlow Developer Certificate"],
            career_path="AI Engineer",
            aptitude_score=85.0
        )
        self.assertIn("Python", res["matched_skills"])
        self.assertIn("PyTorch", res["missing_skills"])
        self.assertGreater(res["career_readiness_score"], 0.0)
        self.assertGreater(res["placement_readiness_score"], 0.0)
        print(f"  - Match results: Matched={res['matched_skills']}, Missing={res['missing_skills']}")
        print(f"  - Career Readiness: {res['career_readiness_score']}%, Placement Readiness: {res['placement_readiness_score']}%. Passed!")

    def test_icqea_pipeline(self):
        print("[TEST] Running ICQEA Retrieval-Augmented Generation Pipeline Check...")
        
        # 1. Clean and Chunk Text
        raw_notes = "Introduction to Database Systems.\n\nPage 4\n\nA database management system (DBMS) is software designed to manage databases."
        cleaned = clean_text_content(raw_notes)
        self.assertNotIn("Page 4", cleaned)
        
        chunks = slice_text_into_chunks(cleaned, chunk_size=5, overlap=1)
        self.assertGreater(len(chunks), 0)
        
        # 2. Similarity Search Math
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        v3 = [0.0, 1.0, 0.0]
        self.assertAlmostEqual(calculate_cosine_similarity(v1, v2), 1.0)
        self.assertAlmostEqual(calculate_cosine_similarity(v1, v3), 0.0)
        
        overlap = calculate_keyword_overlap("database system", "A database management system is great")
        self.assertGreater(overlap, 0.0)
        
        # 3. Question Evolution Score (QES)
        qes = calculate_qes(
            topic_importance=1.5,
            mastery=40.0, # Low mastery (weakness = 0.6)
            accuracy=0.5, # Low accuracy (error = 0.5)
            confidence=0.4, # Low confidence (low_conf = 0.6)
            difficulty_preference=1.8 # Hard
        )
        self.assertGreater(qes, 0.0)
        print(f"  - Extracted {len(chunks)} chunks. Cosine similarity and QES check passed!")

if __name__ == "__main__":
    unittest.main()
