from typing import List
from services.ai_service import AIService

class EvaluationService:
    def __init__(self):
        self.ai_service = AIService()

    async def evaluate_answer(
        self,
        question: str,
        key_points: List[str],
        user_answer: str,
        role: str,
        difficulty: str
    ) -> dict:
        try:
            result = await self.ai_service.evaluate_answer(
                question=question,
                key_points=key_points,
                answer=user_answer,
                role=role,
                difficulty=difficulty
            )
            return result
        except Exception as e:
            return {
                "totalScore": 50,
                "technicalScore": 50,
                "communicationScore": 50,
                "confidenceScore": 50,
                "strengths": ["Attempted the question"],
                "weaknesses": ["Could not evaluate properly"],
                "missedConcepts": [],
                "improvement_suggestions": [],
                "feedback": "Answer submitted successfully."
            }