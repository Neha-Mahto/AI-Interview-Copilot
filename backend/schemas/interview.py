from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InterviewCreate(BaseModel):
    role: str
    difficulty: str
    topics: List[str]
    question_count: int = 5

class InterviewResponse(BaseModel):
    id: str
    role: str
    difficulty: str
    topics: List[str]
    status: str
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    model_config = {"from_attributes": True}

class InterviewListResponse(BaseModel):
    id: str
    role: str
    difficulty: str
    topics: List[str]
    status: str
    overall_score: Optional[float] = None
    model_config = {"from_attributes": True}

class InterviewDetailResponse(BaseModel):
    id: str
    role: str
    difficulty: str
    topics: List[str]
    status: str
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    model_config = {"from_attributes": True}

class AnswerSubmit(BaseModel):
    answer_text: str
    time_taken_seconds: Optional[int] = None
    allow_follow_up: bool = True

class AnswerResponse(BaseModel):
    answer_id: str
    total_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    missed_concepts: List[str] = []
    improvement_suggestions: List[str] = []
    detailed_feedback: Optional[str] = None
    follow_up_question: Optional[str] = None

class FeedbackResponse(BaseModel):
    interview_id: str
    overall_score: float
    technical_score: float
    communication_score: float
    confidence_score: float
    executive_summary: Optional[str] = None
    top_strengths: List[str] = []
    top_improvements: List[str] = []
    next_steps: Optional[str] = None

class StartInterviewResponse(BaseModel):
    interview_id: str
    first_question: Optional[dict] = None
    total_questions: int

class QuestionResponse(BaseModel):
    id: str
    topic: str
    question_text: str
    order_index: int
    model_config = {"from_attributes": True}
