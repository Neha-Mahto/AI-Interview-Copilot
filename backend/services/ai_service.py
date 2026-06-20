"""
AI Service
Handles LLM interactions for question generation, evaluation, and feedback
Supports OpenAI and Anthropic as providers
"""

import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)


QUESTION_GENERATION_PROMPT = """You are an expert technical interviewer at a top tech company (FAANG level).

Generate exactly {count} interview questions for a {role} position at {difficulty} difficulty level.
Topics to cover: {topics}

Rules:
- Mix question types: conceptual, scenario-based, problem-solving, design
- Hard difficulty: expect 3+ years experience, deep knowledge
- Medium: 1-3 years, solid fundamentals
- Easy: freshers, basic concepts
- Each question should test real-world understanding, not just definitions

Return ONLY a valid JSON array, no other text:
[
  {{
    "order_index": 1,
    "topic": "DSA",
    "question_type": "technical",
    "question_text": "The full question text here",
    "expected_key_points": ["point1", "point2", "point3", "point4"],
    "reference_answer": "A comprehensive reference answer",
    "follow_up_question": "A natural follow-up to dig deeper"
  }}
]"""


EVALUATION_PROMPT = """You are a senior technical interviewer evaluating a candidate's response.

Role: {role}
Difficulty: {difficulty}
Question: {question}

Expected Key Points:
{key_points}

Candidate's Answer:
{answer}

Evaluate thoroughly and return ONLY a valid JSON object:
{{
  "total_score": <0-100>,
  "technical_score": <0-100>,
  "communication_score": <0-100>,
  "confidence_score": <0-100>,
  "completeness_score": <0-100>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "missed_concepts": ["concept they should have mentioned"],
  "improvement_suggestions": ["concrete improvement 1", "concrete improvement 2"],
  "detailed_feedback": "2-3 paragraph detailed feedback explaining the evaluation"
}}

Scoring guidelines:
- technical_score: Accuracy and depth of technical knowledge (50% weight)
- communication_score: Clarity, structure, articulation (30% weight)
- confidence_score: Definitiveness, avoidance of excessive hedging (20% weight)
- total_score = (technical * 0.5) + (communication * 0.3) + (confidence * 0.2)"""


SUMMARY_PROMPT = """You are a career coach providing post-interview feedback.

Interview Details:
- Role: {role}
- Difficulty: {difficulty}
- Questions Asked: {question_count}
- Overall Score: {overall_score}/100
- Technical Score: {technical_score}/100
- Communication Score: {communication_score}/100

Question-by-Question Summary:
{qa_summary}

Generate a comprehensive feedback report. Return ONLY a valid JSON object:
{{
  "executive_summary": "2-3 paragraph overall assessment",
  "top_strengths": ["strength 1", "strength 2", "strength 3"],
  "top_improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "topic_analysis": {{"topic": "brief analysis"}},
  "recommended_resources": [
    {{"title": "Resource name", "type": "book/course/article", "reason": "why this helps"}}
  ],
  "next_steps": "Actionable 30-day improvement plan",
  "readiness_assessment": "Junior/Mid/Senior level assessment"
}}"""


FOLLOW_UP_PROMPT = """Generate a targeted follow-up interview question.

Original Question: {question}
Candidate's Answer: {answer}
Missed Concepts: {missed_concepts}

Generate ONE follow-up question that:
1. Probes the specific gaps in their answer
2. Gives them a chance to demonstrate knowledge of missed concepts
3. Feels natural in conversation flow

Return ONLY the follow-up question text, nothing else."""


class AIService:
    """Service for all AI/LLM interactions."""

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self.model = settings.AI_MODEL
        self.max_tokens = settings.AI_MAX_TOKENS

    async def _call_anthropic(self, system_prompt: str, user_message: str) -> str:
        """Call Anthropic Claude API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": self.max_tokens,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_message}],
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]

    async def _call_openai(self, system_prompt: str, user_message: str) -> str:
        """Call OpenAI GPT API."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o",
                    "max_tokens": self.max_tokens,
                    "temperature": settings.AI_TEMPERATURE,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _call_ai(self, system_prompt: str = "", user_message: str = "") -> str:
        """Call AI with retry logic."""
        try:
            if self.provider == "anthropic":
                return await self._call_anthropic(system_prompt, user_message)
            else:
                return await self._call_openai(system_prompt, user_message)
        except Exception as e:
            logger.error(f"AI API call failed: {e}")
            raise

    def _parse_json_response(self, text: str) -> Any:
        """Parse JSON from AI response, handling markdown code blocks."""
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())

    async def generate_questions(
        self,
        role: str,
        difficulty: str,
        topics: List[str],
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """Generate interview questions using LLM."""
        topics_str = ", ".join(topics)
        role_display = role.replace("_", " ").title()

        prompt = QUESTION_GENERATION_PROMPT.format(
            count=count,
            role=role_display,
            difficulty=difficulty.title(),
            topics=topics_str
        )

        response = await self._call_ai(
            system_prompt="You are an expert technical interviewer. Always respond with valid JSON only.",
            user_message=prompt
        )

        questions = self._parse_json_response(response)
        logger.info(f"Generated {len(questions)} questions for {role}/{difficulty}")
        return questions

    async def generate_follow_up(
        self,
        question: str,
        answer: str,
        missed_concepts: List[str]
    ) -> Optional[str]:
        """Generate a contextual follow-up question."""
        prompt = FOLLOW_UP_PROMPT.format(
            question=question,
            answer=answer,
            missed_concepts=", ".join(missed_concepts) if missed_concepts else "None identified"
        )

        response = await self._call_ai(
            system_prompt="You are an expert interviewer. Generate natural follow-up questions.",
            user_message=prompt
        )

        return response.strip()

    async def generate_interview_summary(
        self,
        role: str,
        difficulty: str,
        questions_and_answers: List[Dict],
        scores: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate comprehensive interview feedback report."""
        qa_summary = "\n\n".join([
            f"Q{i+1} [{qa['topic']}]: {qa['question']}\n"
            f"Score: {qa['score']}/100\n"
            f"Answer Summary: {qa['answer'][:200]}..."
            for i, qa in enumerate(questions_and_answers)
        ])

        prompt = SUMMARY_PROMPT.format(
            role=role.replace("_", " ").title(),
            difficulty=difficulty.title(),
            question_count=len(questions_and_answers),
            overall_score=round(scores.get("overall", 0), 1),
            technical_score=round(scores.get("technical", 0), 1),
            communication_score=round(scores.get("communication", 0), 1),
            qa_summary=qa_summary
        )

        response = await self._call_ai(
            system_prompt="You are a career coach. Always respond with valid JSON only.",
            user_message=prompt
        )

        summary = self._parse_json_response(response)
        logger.info(f"Generated interview summary for {role}")
        return summary
