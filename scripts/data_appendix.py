# -*- coding: utf-8 -*-
"""
Appendix Data Module for Smart Campus AI (SCME-AWN)
Loads real algorithm source code from sci/backend/app/algorithms/ for Appendix 1.
"""
import os

ALGO_DIR = os.path.join('sci', 'backend', 'app', 'algorithms')

CODE_FILES = [
    ('ALRA Engine (alra_service.py)', os.path.join(ALGO_DIR, 'alra_service.py')),
    ('DCRA+ Classroom Optimizer (dcra_service.py)', os.path.join(ALGO_DIR, 'dcra_service.py')),
    ('DSEA Skill Evaluation Engine (dsea_service.py)', os.path.join(ALGO_DIR, 'dsea_service.py')),
    ('ICQEA Diagnostic Quiz Engine (icqea_service.py)', os.path.join(ALGO_DIR, 'icqea_service.py')),
    ('CSP Backtracking Timetable Scheduler (backtracking_scheduler.py)', os.path.join(ALGO_DIR, 'backtracking_scheduler.py')),
    ('CLPA & KDPA Learning Intelligence Engine (learning_intelligence.py)', os.path.join(ALGO_DIR, 'learning_intelligence.py')),
    ('Timetable Management Service (timetable_service.py)', os.path.join(ALGO_DIR, 'timetable_service.py'))
]

def load_source_code_listings():
    listings = []
    for title, filepath in CODE_FILES:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            listings.append((title, code))
        else:
            print(f"Warning: File not found: {filepath}")
    return listings

if __name__ == '__main__':
    listings = load_source_code_listings()
    print(f"Loaded {len(listings)} source code files for Appendix 1:")
    for title, code in listings:
        print(f" - {title}: {len(code.splitlines())} lines")
