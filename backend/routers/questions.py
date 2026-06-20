from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Interview, Question
from utils.security import get_current_user

router = APIRouter()

@router.get("/interviews/{interview_id}/questions")
async def get_questions(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    return [
        {
            "id": str(q.id),
            "topic": q.topic,
            "question_text": q.question_text,
            "order_index": q.order_index,
            "follow_up_question": q.follow_up_question
        }
        for q in interview.questions
    ]

@router.get("/interviews/{interview_id}/questions/{question_id}")
async def get_question(
    interview_id: str,
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.interview_id == interview_id
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return {
        "id": str(question.id),
        "topic": question.topic,
        "question_text": question.question_text,
        "order_index": question.order_index,
        "expected_key_points": question.expected_key_points,
        "follow_up_question": question.follow_up_question
    }
