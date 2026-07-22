from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, Interview, InterviewStatusEnum
from utils.security import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    completed = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == InterviewStatusEnum.COMPLETED
    ).all()

    total = len(completed)
    scores = [i.overall_score for i in completed if i.overall_score]
    avg = round(sum(scores) / len(scores), 1) if scores else 0
    best = round(max(scores), 1) if scores else 0

    weekly = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        count = sum(1 for iv in completed if iv.completed_at and
                   iv.completed_at.date() == day.date())
        weekly.append({"date": day.strftime("%a"), "count": count})

    recent = []
    for iv in completed[-5:][::-1]:
        recent.append({
            "id": str(iv.id),
            "role": iv.role,
            "difficulty": iv.difficulty,
            "overall_score": iv.overall_score,
            "topics": iv.topics,
        })

    return {
        "total_interviews": total,
        "average_score": avg,
        "best_score": best,
        "total_questions_answered": 0,
        "average_technical_score": round(
            sum(i.technical_score for i in completed if i.technical_score) / total, 1
        ) if total else 0,
        "average_communication_score": round(
            sum(i.communication_score for i in completed if i.communication_score) / total, 1
        ) if total else 0,
        "average_confidence_score": round(
            sum(i.confidence_score for i in completed if i.confidence_score) / total, 1
        ) if total else 0,
        "current_streak": 0,
        "recent_interviews": recent,
        "weekly_activity": weekly
    }

@router.get("/trends")
async def get_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == InterviewStatusEnum.COMPLETED
    ).order_by(Interview.completed_at).all()

    return [
        {
            "date": iv.completed_at.strftime("%Y-%m-%d") if iv.completed_at else "",
            "overall_score": iv.overall_score or 0,
            "technical_score": iv.technical_score or 0,
            "communication_score": iv.communication_score or 0,
            "role": iv.role,
            "difficulty": iv.difficulty
        }
        for iv in interviews
    ]

@router.get("/topics")
async def get_topics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from models import Question, Answer
    topic_scores = {}

    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == InterviewStatusEnum.COMPLETED
    ).all()

    for interview in interviews:
        for question in interview.questions:
            if question.answer and question.answer.total_score:
                topic = question.topic
                if topic not in topic_scores:
                    topic_scores[topic] = []
                topic_scores[topic].append(question.answer.total_score)

    return [
        {
            "topic": topic,
            "average_score": round(sum(scores) / len(scores), 1),
            "question_count": len(scores),
            "trend": "stable"
        }
        for topic, scores in topic_scores.items()
    ]
