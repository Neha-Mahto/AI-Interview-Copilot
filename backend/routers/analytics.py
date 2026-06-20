from pydantic import BaseModel
from typing import Optional, List

class DashboardStats(BaseModel):
    total_interviews: int = 0
    average_score: float = 0
    best_score: float = 0
    improvement_rate: float = 0
    total_questions_answered: int = 0
    average_technical_score: float = 0
    average_communication_score: float = 0
    average_confidence_score: float = 0
    current_streak: int = 0
    recent_interviews: List[dict] = []
    weekly_activity: List[dict] = []

class PerformanceTrend(BaseModel):
    date: str
    overall_score: float
    technical_score: float
    communication_score: float
    role: str
    difficulty: str

class TopicBreakdown(BaseModel):
    topic: str
    average_score: float
    question_count: int
    trend: str = "stable"

class ScoreDistribution(BaseModel):
    range: str
    count: int

class RecentActivity(BaseModel):
    date: str
    role: str
    score: float
    difficulty: str
