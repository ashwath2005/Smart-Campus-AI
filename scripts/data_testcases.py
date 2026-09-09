# -*- coding: utf-8 -*-
"""
Test Cases Data Module for Smart Campus AI (SCME-AWN)
Loads all 22 test cases from Smart_Campus_AI_Test_Cases.docx and provides structured data.
"""
import docx

def load_test_cases():
    doc = docx.Document('Smart_Campus_AI_Test_Cases.docx')
    test_cases = []
    for table in doc.tables:
        tc = {}
        for row in table.rows:
            if len(row.cells) >= 2:
                key = row.cells[0].text.strip()
                val = row.cells[1].text.strip()
                tc[key] = val
        if 'Test Case ID' in tc or 'Title' in tc:
            test_cases.append({
                'id': tc.get('Test Case ID', 'TC_UNKNOWN'),
                'title': tc.get('Title', ''),
                'preconditions': tc.get('Preconditions', ''),
                'steps': tc.get('Test Steps', ''),
                'data': tc.get('Test Data', ''),
                'expected': tc.get('Expected Result', ''),
                'actual': tc.get('Actual Result', ''),
                'status': tc.get('Status', 'Pass')
            })
    return test_cases

if __name__ == '__main__':
    tcs = load_test_cases()
    print(f"Loaded {len(tcs)} test cases successfully!")
    for tc in tcs[:3]:
        print(f" - {tc['id']}: {tc['title']}")
