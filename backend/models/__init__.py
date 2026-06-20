"""
SQLAlchemy ORM Models
Complete database schema for AI Interview Copilot
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, JSON, Enum as SAEnum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from database import Base


# ─── Enums ──────────────────────────────────────────────────────────────────
class RoleEnum(str, enum.Enum):
    SOFTWARE_ENGINEER = "software_engineer"
    FRONTEND_DEVELOPER = "frontend_developer"
    BACKEND_DEVELOPER = "backend_developer"
    FULLSTACK_DEVELOPER = "fullstack_developer"
    DATA_ANALYST = "data_analyst"
    ML_ENGINEER = "ml_engineer"
    DEVOPS_ENGINEER = "devops_engineer"
    SYSTEM_DESIGNER = "system_designer"


class DifficultyEnum(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatusEnum(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class QuestionTypeEnum(str, enum.Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"
    CODING = "coding"
    FOLLOW_UP = "follow_up"


# ─── Mixin ──────────────────────────────────────────────────────────────────
class TimestampMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ─── User ───────────────────────────────────────────────────────────────────
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=True)
    experience_years = Column(Float, default=0, nullable=False)
    total_interviews = Column(Integer, default=0, nullable=False)
    average_score = Column(Float, default=0.0, nullable=False)

    # Relationships
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"


# ─── Refresh Token ───────────────────────────────────────────────────────────
class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")


# ─── Interview ───────────────────────────────────────────────────────────────
class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(SAEnum(RoleEnum), nullable=False)
    difficulty = Column(SAEnum(DifficultyEnum), nullable=False)
    topics = Column(JSON, nullable=False, default=list)  # List of topic strings
    status = Column(SAEnum(InterviewStatusEnum), default=InterviewStatusEnum.PENDING)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    # Scores
    overall_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

    # AI-generated summary
    summary = Column(Text, nullable=True)
    key_strengths = Column(JSON, default=list)
    key_improvements = Column(JSON, default=list)

    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan", order_by="Question.order_index")
    feedback_report = relationship("FeedbackReport", back_populates="interview", uselist=False)

    __table_args__ = (
        Index("idx_interview_user_id", "user_id"),
        Index("idx_interview_status", "status"),
    )


# ─── Question ────────────────────────────────────────────────────────────────
class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    topic = Column(String(100), nullable=False)
    question_type = Column(SAEnum(QuestionTypeEnum), default=QuestionTypeEnum.TECHNICAL)
    question_text = Column(Text, nullable=False)
    expected_key_points = Column(JSON, default=list)     # List of strings
    reference_answer = Column(Text, nullable=True)
    follow_up_question = Column(Text, nullable=True)
    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=True)

    # Relationships
    interview = relationship("Interview", back_populates="questions")
    answer = relationship("Answer", back_populates="question", uselist=False)
    follow_ups = relationship("Question", remote_side=[parent_question_id])


# ─── Answer ──────────────────────────────────────────────────────────────────
class Answer(Base, TimestampMixin):
    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, unique=True)
    answer_text = Column(Text, nullable=False)
    time_taken_seconds = Column(Integer, nullable=True)
    word_count = Column(Integer, nullable=True)

    # Scores (0-100)
    total_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)

    # Evaluation details
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    missed_concepts = Column(JSON, default=list)
    improvement_suggestions = Column(JSON, default=list)
    detailed_feedback = Column(Text, nullable=True)

    # Relationships
    question = relationship("Question", back_populates="answer")


# ─── Feedback Report ─────────────────────────────────────────────────────────
class FeedbackReport(Base, TimestampMixin):
    __tablename__ = "feedback_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=False, unique=True)

    # Aggregated scores
    overall_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Topic breakdown
    topic_scores = Column(JSON, default=dict)  # {topic: score}
    question_scores = Column(JSON, default=list)  # [{question_id, score, feedback}]

    # AI-generated insights
    executive_summary = Column(Text, nullable=True)
    top_strengths = Column(JSON, default=list)
    top_improvements = Column(JSON, default=list)
    recommended_resources = Column(JSON, default=list)
    next_steps = Column(Text, nullable=True)

    # Relationships
    interview = relationship("Interview", back_populates="feedback_report")
