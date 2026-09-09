import sys

try:
    print("Testing backend imports...")
    from app.services.gemini_service import (
        ask_campus_ai,
        summarize_pdf_text,
        generate_quiz,
        generate_study_plan,
        review_resume,
        analyze_skill_gap,
        generate_interview_questions,
        career_recommendations
    )
    print("✓ gemini_service.py imported successfully!")

    from app.routes.ai import get_ai_context, chat
    print("✓ routes/ai.py imported successfully!")
    print("All modified files are syntax-valid and compile correctly.")
except Exception as e:
    print("✕ Verification failed with error:", e)
    sys.exit(1)
