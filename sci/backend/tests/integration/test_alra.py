import sys
import unittest
from datetime import datetime, date, timedelta

# Import the service functions
from app.algorithms.alra_service import calculate_alra_study_load, adapt_study_plan_json

class TestALRA(unittest.TestCase):
    def test_calculate_study_load_easy(self):
        # 1. Easy topic, far timeline, high stats
        res = calculate_alra_study_load(
            remaining_days=10,
            difficulty=1.0,     # easy
            weakness=0.2,       # strong mastery
            quiz_score=0.9,     # excellent
            focus_time=0.9,      # excellent
            completion_rate=0.95, # excellent
            attendance=0.9,      # excellent
            exam_weight=1.0,
            available_hours=2.0
        )
        # Expected behavior: StudyLoad should be low
        self.assertLess(res["study_load"], 2.0)
        self.assertGreater(res["study_load"], 0.0)
        print(f"✓ Easy/Strong: SL = {res['study_load']:.2f} hrs (Priority = {res['priority_score']:.4f}, Efficiency = {res['learning_efficiency']:.2f})")

    def test_calculate_study_load_hard(self):
        # 2. Hard topic, close timeline, low stats
        res = calculate_alra_study_load(
            remaining_days=2,
            difficulty=1.8,     # hard
            weakness=0.8,       # weak mastery
            quiz_score=0.4,     # struggling
            focus_time=0.5,      # moderate
            completion_rate=0.5,  # low
            attendance=0.6,      # low
            exam_weight=1.0,
            available_hours=2.0
        )
        # Expected behavior: StudyLoad should be high because timeline is close and topic is hard
        self.assertGreater(res["study_load"], 1.5)
        print(f"✓ Hard/Close: SL = {res['study_load']:.2f} hrs (Priority = {res['priority_score']:.4f}, Efficiency = {res['learning_efficiency']:.2f})")

    def test_adaptation_high_completion(self):
        # Completion >= 90%: Workload should increase
        dummy_plan = {
            "subject": "Data Structures",
            "days": 2,
            "plan": [
                {
                    "day": 1,
                    "title": "Arrays & Strings",
                    "tasks": [{"text": "Task A", "completed": True}, {"text": "Task B", "completed": True}],
                    "duration": "2 hours"
                },
                {
                    "day": 2,
                    "title": "Linked Lists",
                    "tasks": [{"text": "Task C", "completed": False}, {"text": "Task D", "completed": False}],
                    "duration": "2 hours"
                }
            ]
        }
        
        adapted = adapt_study_plan_json(dummy_plan, completed_day=1, completion_percentage=95.0, missed_tasks=[])
        
        # Verify Day 2 duration and challenge task
        day2 = adapted["plan"][1]
        self.assertTrue(any("[Challenge]" in str(t) for t in day2["tasks"]))
        self.assertIn("Scaled Up", day2["duration"])
        print("✓ Adaptation (High Completion): Challenge task successfully injected, workload scaled up!")

    def test_adaptation_medium_completion(self):
        # Completion >= 60%: Maintain current schedule
        dummy_plan = {
            "subject": "Data Structures",
            "days": 2,
            "plan": [
                {
                    "day": 1,
                    "title": "Arrays & Strings",
                    "tasks": [{"text": "Task A", "completed": True}, {"text": "Task B", "completed": False}],
                    "duration": "2 hours"
                },
                {
                    "day": 2,
                    "title": "Linked Lists",
                    "tasks": [{"text": "Task C", "completed": False}],
                    "duration": "2 hours"
                }
            ]
        }
        
        adapted = adapt_study_plan_json(dummy_plan, completed_day=1, completion_percentage=75.0, missed_tasks=[])
        
        # Verify no changes
        day2 = adapted["plan"][1]
        self.assertFalse(any("[Challenge]" in str(t) for t in day2["tasks"]))
        self.assertEqual(day2["duration"], "2 hours")
        print("✓ Adaptation (Medium Completion): Schedule maintained unchanged.")

    def test_adaptation_low_completion(self):
        # Completion < 60%: Workload should be reduced, revision session inserted, missed tasks rescheduled
        dummy_plan = {
            "subject": "Data Structures",
            "days": 2,
            "plan": [
                {
                    "day": 1,
                    "title": "Arrays & Strings",
                    "tasks": [{"text": "Task A", "completed": False}, {"text": "Task B", "completed": False}],
                    "duration": "2 hours"
                },
                {
                    "day": 2,
                    "title": "Linked Lists",
                    "tasks": [{"text": "Task C", "completed": False}],
                    "duration": "2 hours"
                }
            ]
        }
        
        missed = [{"text": "Task A", "completed": False}, {"text": "Task B", "completed": False}]
        adapted = adapt_study_plan_json(dummy_plan, completed_day=1, completion_percentage=20.0, missed_tasks=missed)
        
        # Verify Day 2 has rescheduled tasks, workload reduced
        day2 = adapted["plan"][1]
        self.assertTrue(any("[Rescheduled]" in str(t) for t in day2["tasks"]))
        self.assertIn("Reduced Load", day2["duration"])
        
        # Verify Revision day inserted (Day 3, shifted original Day 2 tasks)
        self.assertEqual(len(adapted["plan"]), 3)
        rev_day = adapted["plan"][2]
        self.assertEqual(rev_day["day"], 3)
        self.assertIn("Revision", rev_day["title"])
        print("✓ Adaptation (Low Completion): Workload reduced, revision session injected, tasks rescheduled successfully!")

if __name__ == "__main__":
    unittest.main()
