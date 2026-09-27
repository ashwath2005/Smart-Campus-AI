import asyncio
import json
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.gemini_service import analyze_skill_gap, ROLE_SKILLS_ONTOLOGY

async def run_tests():
    print("==================================================")
    print("RUNNING HYBRID SKILL GAP ALGORITHM TESTS")
    print("==================================================\n")

    # Test 1: Static Ontology Role (Full Stack Developer)
    # Expected total requirements: 12 skills
    # Inputs: React, Node JS, HTML, CSS (Normalizes: react, node.js, html, css -> 4 matching)
    # Expected Match: 4 / 12 = 33%
    # Expected Missing: 8 skills
    print("--- TEST 1: Static Role (Full Stack Developer) ---")
    skills_input = "React, Node JS, HTML, CSS"
    role_input = "Full Stack Developer"
    
    print(f"Inputs - Role: '{role_input}', Skills: '{skills_input}'")
    result_1 = await analyze_skill_gap(skills_input, role_input)
    
    print("\nResult:")
    print(json.dumps(result_1, indent=2))
    
    # Assertions
    assert result_1["matchPercentage"] == 33, f"Expected 33% match, got {result_1['matchPercentage']}%"
    assert len(result_1["missingSkills"]) == 8, f"Expected 8 missing skills, got {len(result_1['missingSkills'])}"
    print("\nTest 1 PASSED successfully!\n")

    # Test 2: Unknown Dynamic Role (Cloud Solutions Architect)
    # Expected: Calls dynamic fallback to fetch required skills, computes local math, returns recommendations
    print("--- TEST 2: Dynamic Role (Cloud Solutions Architect) ---")
    skills_input_2 = "AWS, Docker, Python"
    role_input_2 = "Cloud Solutions Architect"
    
    print(f"Inputs - Role: '{role_input_2}', Skills: '{skills_input_2}'")
    result_2 = await analyze_skill_gap(skills_input_2, role_input_2)
    
    print("\nResult:")
    print(json.dumps(result_2, indent=2))
    
    # Assertions
    assert "matchPercentage" in result_2
    assert "missingSkills" in result_2
    assert len(result_2["missingSkills"]) > 0
    print("\nTest 2 PASSED successfully!\n")

    # Test 3: 100% Perfect Match
    print("--- TEST 3: Perfect Match (Frontend Developer) ---")
    # Frontend ontology: React, HTML, CSS, JavaScript, TypeScript, Tailwind CSS, Redux, Git, Webpack, UI/UX (10 skills)
    skills_input_3 = "React, HTML, CSS, JavaScript, TypeScript, Tailwind, Redux, Git, Webpack, UI/UX"
    role_input_3 = "Frontend Developer"
    
    print(f"Inputs - Role: '{role_input_3}', Skills: '{skills_input_3}'")
    result_3 = await analyze_skill_gap(skills_input_3, role_input_3)
    
    print("\nResult:")
    print(json.dumps(result_3, indent=2))
    
    assert result_3["matchPercentage"] == 100
    assert len(result_3["missingSkills"]) == 0
    print("\nTest 3 PASSED successfully!\n")

    # Test 4: User Screenshot Match (Fuzzy containment and role normalization)
    print("--- TEST 4: User Screenshot (front end developer) ---")
    skills_input_4 = "react, rest api, ui, testing, html5"
    role_input_4 = "front end developer" # Normalizes to frontenddeveloper
    
    print(f"Inputs - Role: '{role_input_4}', Skills: '{skills_input_4}'")
    result_4 = await analyze_skill_gap(skills_input_4, role_input_4)
    
    print("\nResult:")
    print(json.dumps(result_4, indent=2))
    
    # Assertions
    # 3 matches out of 10: React (react), HTML (html5), UI/UX (ui). So 30%.
    assert result_4["matchPercentage"] == 30, f"Expected 30% match, got {result_4['matchPercentage']}%"
    assert "HTML" not in result_4["missingSkills"], "HTML should have matched html5 and not be missing"
    assert "React" not in result_4["missingSkills"], "React should have matched react and not be missing"
    assert "UI/UX" not in result_4["missingSkills"], "UI/UX should have matched ui and not be missing"
    print("\nTest 4 PASSED successfully!\n")

    # Test 5: User Cloud Architect Screenshot Match (Typo in role name + Conceptual Synonym mapping)
    print("--- TEST 5: User Screenshot (Cloud Architecct - Typo + Terraform conceptual match) ---")
    skills_input_5 = "AWS, azure, terraform, cloud computing"
    role_input_5 = "Cloud Architecct" # Has typo, should fuzzy match to 'cloudarchitect'
    
    print(f"Inputs - Role: '{role_input_5}', Skills: '{skills_input_5}'")
    result_5 = await analyze_skill_gap(skills_input_5, role_input_5)
    
    print("\nResult:")
    print(json.dumps(result_5, indent=2))
    
    # Assertions
    # 4 matches out of 10: AWS (AWS), Microsoft Azure (azure), Infrastructure as Code (terraform), Google Cloud Platform (cloud computing). So 40%.
    assert result_5["matchPercentage"] == 40, f"Expected 40% match, got {result_5['matchPercentage']}%"
    assert "AWS" not in result_5["missingSkills"], "AWS should have matched and not be missing"
    assert "Microsoft Azure" not in result_5["missingSkills"], "Microsoft Azure should have matched azure and not be missing"
    assert "Infrastructure as Code" not in result_5["missingSkills"], "Infrastructure as Code should have matched terraform and not be missing"
    print("\nTest 5 PASSED successfully!\n")

    print("==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
