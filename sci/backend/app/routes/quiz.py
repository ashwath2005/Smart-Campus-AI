from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import asyncio
from sqlalchemy import select, func

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.ai_learning_engine import UploadedDocument, DocumentChunk, Quiz, QuizQuestion, QuizAttempt, QuizAnalytics
from app.models.learning_intelligence import StudentTopicKnowledge
from app.algorithms.icqea_service import (
    extract_text_from_bytes, 
    clean_text_content, 
    slice_text_into_chunks, 
    call_ollama_embeddings, 
    generate_icqea_quiz
)

router = APIRouter(prefix="/quiz", tags=["AI Offline Quiz Generator"])

# --- Request Models ---

class GenerateQuizRequest(BaseModel):
    subject: str
    difficulty: str
    question_types: List[str]

class SubmitQuizRequest(BaseModel):
    answers: Dict[str, str]  # question_id -> student answer selection
    time_spent_seconds: Optional[int] = 0

# --- REST Endpoints ---

@router.post("/upload")
async def upload_study_material(
    subject: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives document, extracts text, chunks, computes embeddings, and persists.
    """
    try:
        file_bytes = await file.read()
        
        # 1. Parse document content
        raw_text = extract_text_from_bytes(file_bytes, file.filename)
        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty document: Could not extract any readable text."
            )
            
        cleaned_text = clean_text_content(raw_text)
        
        # 2. Chunk text
        chunks = slice_text_into_chunks(cleaned_text, chunk_size=350, overlap=50)
        
        # 3. Create document record
        doc = UploadedDocument(
            subject=subject,
            filename=file.filename,
            file_type=file.filename.split(".")[-1].lower(),
            uploaded_by=current_user["id"]
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        
        # 4. Generate embeddings and save chunks
        for i, chunk_text in enumerate(chunks):
            vector = await asyncio.to_thread(call_ollama_embeddings, chunk_text)
            chunk_rec = DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                content=chunk_text,
                embedding_json=json.dumps(vector) if vector else None
            )
            db.add(chunk_rec)
            
        await db.commit()
        return {
            "status": "success", 
            "message": f"Successfully parsed '{file.filename}' into {len(chunks)} study context chunks."
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document indexing failed: {str(e)}"
        )

@router.get("/documents")
async def list_documents(
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        q = select(UploadedDocument)
        if subject:
            q = q.where(UploadedDocument.subject == subject)
        q_res = await db.execute(q)
        docs = q_res.scalars().all()
        
        # Count chunks per doc
        results = []
        for d in docs:
            c_cnt_res = await db.execute(
                select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == d.id)
            )
            results.append({
                "id": d.id,
                "filename": d.filename,
                "subject": d.subject,
                "file_type": d.file_type,
                "chunks_count": c_cnt_res.scalar() or 0,
                "created_at": d.created_at.strftime("%Y-%m-%d %H:%M")
            })
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve materials: {str(e)}"
        )

@router.post("/generate")
async def generate_quiz(
    req: GenerateQuizRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    RAG semantic search + local LLM generation
    """
    try:
        student_id = current_user["id"]
        quiz_details = await generate_icqea_quiz(
            db=db,
            student_id=student_id,
            subject=req.subject,
            difficulty=req.difficulty,
            question_types=req.question_types
        )
        return quiz_details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )

@router.post("/submit/{quiz_id}")
async def submit_quiz(
    quiz_id: int,
    req: SubmitQuizRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Grades quiz answers, updates student mastery and histories.
    """
    try:
        student_id = current_user["id"]
        
        # 1. Fetch Quiz and Questions
        quiz_q = select(Quiz).where(Quiz.id == quiz_id)
        quiz_res = await db.execute(quiz_q)
        quiz = quiz_res.scalars().first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
            
        questions_q = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id)
        questions_res = await db.execute(questions_q)
        questions = questions_res.scalars().all()
        
        # 2. Grade Quiz
        score = 0.0
        max_score = float(len(questions))
        grade_breakdown = []
        topic_updates = {} # topic -> (correct_count, total_count)
        
        for q in questions:
            student_ans = (req.answers.get(str(q.id)) or "").strip().lower()
            correct_ans = (q.correct_answer or "").strip().lower()
            
            is_correct = False
            if q.question_type in ["mcq", "true_false"]:
                # Check first letter (e.g. 'A') or direct match
                is_correct = (student_ans == correct_ans) or \
                             (student_ans.startswith(correct_ans)) or \
                             (correct_ans.startswith(student_ans))
            else: # short, long, code, case study: default to auto-pass or keyword matches
                # If they wrote something, give them credits
                is_correct = len(student_ans) > 5
                
            if is_correct:
                score += 1.0
                
            grade_breakdown.append({
                "question_id": q.id,
                "question_text": q.question_text,
                "student_answer": req.answers.get(str(q.id), ""),
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
                "is_correct": is_correct,
                "topic": q.topic
            })
            
            # Group scores by topic to update StudentTopicKnowledge
            t_name = q.topic or "General"
            corr, tot = topic_updates.get(t_name, (0, 0))
            topic_updates[t_name] = (corr + (1 if is_correct else 0), tot + 1)
            
        # 3. Save Attempt
        attempt = QuizAttempt(
            student_id=student_id,
            quiz_id=quiz_id,
            score=score,
            max_score=max_score,
            answers_json=json.dumps(req.answers),
            time_spent_seconds=req.time_spent_seconds
        )
        db.add(attempt)
        
        # 4. Update StudentTopicKnowledge mastery values
        mastery_results = []
        for t_name, (corr, tot) in topic_updates.items():
            tk_q = select(StudentTopicKnowledge).where(
                StudentTopicKnowledge.student_id == student_id,
                StudentTopicKnowledge.subject == quiz.subject,
                StudentTopicKnowledge.topic == t_name
            )
            tk_res = await db.execute(tk_q)
            tk = tk_res.scalars().first()
            
            accuracy = corr / tot
            delta = (accuracy - 0.50) * 10.0 # scale mastery up/down based on accuracy
            
            if not tk:
                tk = StudentTopicKnowledge(
                    student_id=student_id,
                    subject=quiz.subject,
                    topic=t_name,
                    mastery=50.0,
                    difficulty="medium"
                )
                db.add(tk)
                
            tk.mastery = min(max(tk.mastery + delta, 10.0), 100.0)
            tk.revision_count += 1
            tk.last_revisited_at = datetime.now()
            
            mastery_results.append({
                "topic": t_name,
                "new_mastery": round(tk.mastery, 1),
                "delta": round(delta, 1)
            })
            
        # 5. Compile QuizAnalytics
        an_q = select(QuizAnalytics).where(
            QuizAnalytics.student_id == student_id,
            QuizAnalytics.subject == quiz.subject
        )
        an_res = await db.execute(an_q)
        analytics = an_res.scalars().first()
        
        if not analytics:
            analytics = QuizAnalytics(
                student_id=student_id,
                subject=quiz.subject
            )
            db.add(analytics)
            
        analytics.attempts_count += 1
        # Recalculate rolling average score
        analytics.average_score = (
            (analytics.average_score * (analytics.attempts_count - 1)) + (score / max_score * 100.0)
        ) / analytics.attempts_count
        analytics.last_attempted_at = datetime.now()
        
        # Find weakest and strongest topics
        all_tk_q = select(StudentTopicKnowledge).where(
            StudentTopicKnowledge.student_id == student_id,
            StudentTopicKnowledge.subject == quiz.subject
        )
        all_tk_res = await db.execute(all_tk_q)
        all_tk = all_tk_res.scalars().all()
        
        if all_tk:
            all_tk.sort(key=lambda x: x.mastery)
            analytics.weakest_topic = all_tk[0].topic
            analytics.strongest_topic = all_tk[-1].topic
            
        await db.commit()
        
        return {
            "score": score,
            "max_score": max_score,
            "accuracy_percentage": round((score / max_score) * 100.0, 1),
            "breakdown": grade_breakdown,
            "mastery_updates": mastery_results,
            "analytics": {
                "attempts_count": analytics.attempts_count,
                "average_score": round(analytics.average_score, 1),
                "weakest_topic": analytics.weakest_topic,
                "strongest_topic": analytics.strongest_topic
            }
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit quiz grading: {str(e)}"
        )

@router.get("/analytics")
async def get_quiz_analytics(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        student_id = current_user["id"]
        q = select(QuizAnalytics).where(QuizAnalytics.student_id == student_id)
        res = await db.execute(q)
        analytics_list = res.scalars().all()
        
        # Get attempts history list
        attempts_q = select(QuizAttempt).where(QuizAttempt.student_id == student_id).order_by(QuizAttempt.completed_at.desc()).limit(10)
        attempts_res = await db.execute(attempts_q)
        attempts = attempts_res.scalars().all()
        
        history = []
        for att in attempts:
            quiz_q = select(Quiz).where(Quiz.id == att.quiz_id)
            quiz_res = await db.execute(quiz_q)
            quiz = quiz_res.scalars().first()
            
            history.append({
                "id": att.id,
                "quiz_title": quiz.title if quiz else "Practice Quiz",
                "subject": quiz.subject if quiz else "General",
                "score": att.score,
                "max_score": att.max_score,
                "completed_at": att.completed_at.strftime("%Y-%m-%d %H:%M")
            })
            
        return {
            "summary": [
                {
                    "subject": a.subject,
                    "attempts_count": a.attempts_count,
                    "average_score": round(a.average_score, 1),
                    "weakest_topic": a.weakest_topic,
                    "strongest_topic": a.strongest_topic
                } for a in analytics_list
            ],
            "history": history
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch quiz analytics dashboard: {str(e)}"
        )
