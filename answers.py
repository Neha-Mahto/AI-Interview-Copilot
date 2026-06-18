from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Question, Answer
from utils.security import get_current_user
from services.evaluation_service import EvaluationService
import uuid

router = APIRouter()

@router.post("/interviews/{interview_id}/questions/{question_id}/answer")
async def submit_answer(
    interview_id: str,
    question_id: str,
    answer_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.interview_id == interview_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    evaluation_service = EvaluationService()

    evaluation = await evaluation_service.evaluate_answer(
        question=question.question_text,
        key_points=question.expected_key_points or [],
        user_answer=answer_data.get("answer_text", ""),
        role="Software Engineer",
        difficulty="Medium"
    )

    answer = Answer(
        id=uuid.uuid4(),
        question_id=question_id,
        answer_text=answer_data.get("answer_text", ""),
        total_score=evaluation.get("totalScore", 0),
        technical_score=evaluation.get("technicalScore", 0),
        communication_score=evaluation.get("communicationScore", 0),
        confidence_score=evaluation.get("confidenceScore", 0),
        strengths=evaluation.get("strengths", []),
        weaknesses=evaluation.get("weaknesses", []),
        missed_concepts=evaluation.get("missedConcepts", []),
        detailed_feedback=evaluation.get("feedback", "")
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return {
        "answer_id": str(answer.id),
        "total_score": answer.total_score,
        "technical_score": answer.technical_score,
        "communication_score": answer.communication_score,
        "confidence_score": answer.confidence_score,
        "strengths": answer.strengths,
        "weaknesses": answer.weaknesses,
        "missed_concepts": answer.missed_concepts,
        "feedback": answer.detailed_feedback
    }


@router.get("/interviews/{interview_id}/answers")
async def get_answers(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    questions = db.query(Question).filter(
        Question.interview_id == interview_id
    ).all()

    result = []
    for q in questions:
        if q.answer:
            result.append({
                "question_id": str(q.id),
                "question_text": q.question_text,
                "answer_text": q.answer.answer_text,
                "total_score": q.answer.total_score,
                "feedback": q.answer.detailed_feedback
            })

    return result