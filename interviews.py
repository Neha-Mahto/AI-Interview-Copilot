"""
Interviews Router
CRUD for interviews + answer submission + evaluation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from database import get_db
from models import User, Interview, InterviewStatusEnum
from schemas.interview import (
    InterviewCreate, InterviewResponse, InterviewListResponse,
    InterviewDetailResponse, AnswerSubmit, AnswerResponse,
    FeedbackResponse, StartInterviewResponse
)
from services.interview_service import InterviewService
from services.ai_service import AIService
from services.evaluation_service import EvaluationService
from utils.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=InterviewDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_interview(
    interview_data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new interview session and generate questions via LLM.
    
    - **role**: Target job role (software_engineer, frontend_developer, etc.)
    - **difficulty**: easy | medium | hard
    - **topics**: List of topics to cover (DSA, OOP, System Design, etc.)
    - **question_count**: Number of questions (3-10)
    """
    interview_service = InterviewService(db)
    ai_service = AIService()
    
    # Generate questions using LLM
    logger.info(f"Generating {interview_data.question_count} questions for {interview_data.role}")
    questions = await ai_service.generate_questions(
        role=interview_data.role,
        difficulty=interview_data.difficulty,
        topics=interview_data.topics,
        count=interview_data.question_count
    )
    
    # Create interview + save questions to DB
    interview = interview_service.create_interview(
        user_id=current_user.id,
        interview_data=interview_data,
        questions=questions
    )
    
    logger.info(f"Interview created: {interview.id} for user {current_user.email}")
    return interview


@router.get("/", response_model=List[InterviewListResponse])
async def list_interviews(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[InterviewStatusEnum] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of user's interviews with optional filters."""
    service = InterviewService(db)
    return service.list_interviews(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        role=role
    )


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full interview details including questions and answers."""
    service = InterviewService(db)
    interview = service.get_interview(interview_id, current_user.id)
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return interview


@router.post("/{interview_id}/start", response_model=StartInterviewResponse)
async def start_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark interview as started and return first question."""
    service = InterviewService(db)
    return service.start_interview(interview_id, current_user.id)


@router.post("/{interview_id}/questions/{question_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    interview_id: str,
    question_id: str,
    answer_data: AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit answer for a question and get real-time AI evaluation.
    
    Returns score breakdown, strengths, weaknesses, and detailed feedback.
    Also returns a follow-up question if applicable.
    """
    interview_service = InterviewService(db)
    evaluation_service = EvaluationService()
    ai_service = AIService()
    
    # Get question
    question = interview_service.get_question(interview_id, question_id, current_user.id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Save raw answer
    answer = interview_service.save_answer(question_id, answer_data)
    
    # Evaluate with AI
    evaluation = await evaluation_service.evaluate_answer(
        question=question.question_text,
        key_points=question.expected_key_points,
        user_answer=answer_data.answer_text,
        role=question.interview.role,
        difficulty=question.interview.difficulty
    )
    
    # Update answer with evaluation scores
    answer = interview_service.update_answer_scores(answer.id, evaluation)
    
    # Check if follow-up is needed (score < 70 or answer is incomplete)
    follow_up = None
    if evaluation.get("total_score", 100) < 70 and answer_data.allow_follow_up:
        follow_up = await ai_service.generate_follow_up(
            question=question.question_text,
            answer=answer_data.answer_text,
            missed_concepts=evaluation.get("missed_concepts", [])
        )
    
    return {**evaluation, "follow_up_question": follow_up, "answer_id": str(answer.id)}


@router.post("/{interview_id}/complete", response_model=FeedbackResponse)
async def complete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Complete interview and generate comprehensive feedback report.
    Calculates overall scores and AI-powered improvement suggestions.
    """
    interview_service = InterviewService(db)
    ai_service = AIService()
    
    interview = interview_service.get_interview(interview_id, current_user.id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Generate final report
    report = await interview_service.complete_interview(interview_id, ai_service)
    
    # Update user stats
    interview_service.update_user_stats(current_user.id)
    
    logger.info(f"Interview completed: {interview_id}, score: {report.overall_score}")
    return report


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an interview and all associated data."""
    service = InterviewService(db)
    deleted = service.delete_interview(interview_id, current_user.id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Interview not found")
