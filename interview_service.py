from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
import uuid

from models import (
    Interview, Question, Answer, FeedbackReport,
    InterviewStatusEnum, RoleEnum, DifficultyEnum
)

class InterviewService:
    def __init__(self, db: Session):
        self.db = db

    def create_interview(self, user_id, interview_data, questions):
        interview = Interview(
            id=uuid.uuid4(),
            user_id=user_id,
            role=interview_data.role,
            difficulty=interview_data.difficulty,
            topics=interview_data.topics,
            status=InterviewStatusEnum.PENDING
        )
        self.db.add(interview)
        self.db.flush()

        for i, q in enumerate(questions):
            question = Question(
                id=uuid.uuid4(),
                interview_id=interview.id,
                order_index=i,
                topic=q.get("topic", "General"),
                question_text=q.get("question", q.get("question_text", "")),
                expected_key_points=q.get("keyPoints", q.get("expected_key_points", [])),
                follow_up_question=q.get("followUp", "")
            )
            self.db.add(question)

        self.db.commit()
        self.db.refresh(interview)
        return interview

    def get_interview(self, interview_id, user_id):
        return self.db.query(Interview).filter(
            Interview.id == interview_id,
            Interview.user_id == user_id
        ).first()

    def list_interviews(self, user_id, skip=0, limit=20, status=None, role=None):
        query = self.db.query(Interview).filter(Interview.user_id == user_id)
        if status:
            query = query.filter(Interview.status == status)
        if role:
            query = query.filter(Interview.role == role)
        return query.offset(skip).limit(limit).all()

    def start_interview(self, interview_id, user_id):
        interview = self.get_interview(interview_id, user_id)
        if not interview:
            return None
        interview.status = InterviewStatusEnum.IN_PROGRESS
        interview.started_at = datetime.utcnow()
        self.db.commit()
        first_q = interview.questions[0] if interview.questions else None
        return {
            "interview_id": str(interview.id),
            "first_question": {
                "id": str(first_q.id),
                "topic": first_q.topic,
                "question_text": first_q.question_text
            } if first_q else None,
            "total_questions": len(interview.questions)
        }

    def get_question(self, interview_id, question_id, user_id):
        interview = self.get_interview(interview_id, user_id)
        if not interview:
            return None
        for q in interview.questions:
            if str(q.id) == question_id:
                return q
        return None

    def save_answer(self, question_id, answer_data):
        answer = Answer(
            id=uuid.uuid4(),
            question_id=question_id,
            answer_text=answer_data.answer_text,
            time_taken_seconds=answer_data.time_taken_seconds,
            word_count=len(answer_data.answer_text.split())
        )
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)
        return answer

    def update_answer_scores(self, answer_id, evaluation):
        answer = self.db.query(Answer).filter(Answer.id == answer_id).first()
        if answer:
            answer.total_score = evaluation.get("totalScore", 0)
            answer.technical_score = evaluation.get("technicalScore", 0)
            answer.communication_score = evaluation.get("communicationScore", 0)
            answer.confidence_score = evaluation.get("confidenceScore", 0)
            answer.strengths = evaluation.get("strengths", [])
            answer.weaknesses = evaluation.get("weaknesses", [])
            answer.missed_concepts = evaluation.get("missedConcepts", [])
            answer.detailed_feedback = evaluation.get("feedback", "")
            self.db.commit()
            self.db.refresh(answer)
        return answer

    async def complete_interview(self, interview_id, ai_service):
        interview = self.db.query(Interview).filter(
            Interview.id == interview_id
        ).first()

        answered = [q for q in interview.questions if q.answer]
        if not answered:
            return None

        total = sum(q.answer.total_score or 0 for q in answered) / len(answered)
        tech = sum(q.answer.technical_score or 0 for q in answered) / len(answered)
        comm = sum(q.answer.communication_score or 0 for q in answered) / len(answered)
        conf = sum(q.answer.confidence_score or 0 for q in answered) / len(answered)

        interview.overall_score = round(total, 1)
        interview.technical_score = round(tech, 1)
        interview.communication_score = round(comm, 1)
        interview.confidence_score = round(conf, 1)
        interview.status = InterviewStatusEnum.COMPLETED
        interview.completed_at = datetime.utcnow()

        qa_list = [{
            "question": q.question_text,
            "topic": q.topic,
            "score": q.answer.total_score or 0
        } for q in answered]

        try:
            summary = await ai_service.generate_summary(
                role=interview.role,
                difficulty=interview.difficulty,
                qa_list=qa_list,
                overall_score=round(total, 1)
            )
            report = FeedbackReport(
                id=uuid.uuid4(),
                interview_id=interview.id,
                overall_score=round(total, 1),
                technical_score=round(tech, 1),
                communication_score=round(comm, 1),
                confidence_score=round(conf, 1),
                executive_summary=summary.get("summary", ""),
                top_strengths=summary.get("strengths", []),
                top_improvements=summary.get("improvements", []),
                next_steps=summary.get("nextSteps", "")
            )
            self.db.add(report)
        except:
            report = FeedbackReport(
                id=uuid.uuid4(),
                interview_id=interview.id,
                overall_score=round(total, 1),
                technical_score=round(tech, 1),
                communication_score=round(comm, 1),
                confidence_score=round(conf, 1)
            )
            self.db.add(report)

        self.db.commit()
        self.db.refresh(interview)
        return report

    def update_user_stats(self, user_id):
        from models import User
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            interviews = self.db.query(Interview).filter(
                Interview.user_id == user_id,
                Interview.status == InterviewStatusEnum.COMPLETED
            ).all()
            user.total_interviews = len(interviews)
            scores = [i.overall_score for i in interviews if i.overall_score]
            user.average_score = round(sum(scores) / len(scores), 1) if scores else 0
            self.db.commit()

    def delete_interview(self, interview_id, user_id):
        interview = self.get_interview(interview_id, user_id)
        if interview:
            self.db.delete(interview)
            self.db.commit()
            return True
        return False