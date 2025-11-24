"""Qualification agent for scoring leads."""

import json
import logging
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)


class QualificationResult(BaseModel):
    """Structured qualification result."""

    score: int = Field(ge=0, le=10, description="Lead quality score 0-10")
    reasoning: str = Field(description="Explanation for the score")
    recommendation: str = Field(description="Action recommendation")
    icp_match: bool = Field(description="Whether lead matches ICP")
    buying_authority: str = Field(description="Estimated buying authority: high, medium, low")
    urgency: str = Field(description="Estimated urgency: high, medium, low")


class QualificationAgent:
    """Agent for qualifying and scoring leads."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.DEFAULT_MODEL,
            temperature=0.1,  # Lower temperature for more consistent scoring
            max_tokens=1000,
            api_key=settings.OPENAI_API_KEY
        )

        self.qualification_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert B2B sales qualification specialist. Score leads 0-10 based on:

**Scoring Criteria:**

1. **Job Title Relevance (0-3 points)**
   - C-level, VP, Director: 3 points
   - Manager, Head of: 2 points
   - Individual contributor with buying influence: 1 point
   - Others: 0 points

2. **Company Size (0-2 points)**
   - 50-500 employees: 2 points
   - 500-1000 or 20-50: 1 point
   - Others: 0 points

3. **Industry Fit (0-2 points)**
   - Perfect ICP match: 2 points
   - Adjacent industry: 1 point
   - Unrelated: 0 points

4. **Data Completeness (0-1 point)**
   - All fields filled: 1 point
   - Missing data: 0 points

5. **Buying Signals (0-2 points)**
   - Recent funding, hiring, tech changes: 2 points
   - Some indicators: 1 point
   - None: 0 points

**ICP (Ideal Customer Profile):**
- Technology/SaaS companies
- 50-500 employees
- Growth stage
- US/EU based
- Decision makers in Sales, Marketing, or Revenue roles

Return ONLY valid JSON matching the structure provided."""),
            ("user", """Lead Data:
{lead_data}

Research Insights:
{research_insights}

Qualification Score and Analysis:""")
        ])

    async def qualify_lead(
        self,
        lead_data: Dict[str, Any],
        research_insights: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Qualify and score a lead.

        Args:
            lead_data: Lead information
            research_insights: Research results

        Returns:
            Qualification results with score
        """
        try:
            # Format prompt
            prompt = self.qualification_prompt.format_messages(
                lead_data=json.dumps(lead_data, indent=2),
                research_insights=json.dumps(research_insights, indent=2)
            )

            # Get AI response with structured output
            response = await self.llm.ainvoke(prompt)

            # Parse response
            try:
                result = json.loads(response.content)

                # Validate and structure
                qualification = {
                    "score": result.get("score", 0),
                    "reasoning": result.get("reasoning", "No reasoning provided"),
                    "recommendation": result.get("recommendation", "Review manually"),
                    "icp_match": result.get("icp_match", False),
                    "buying_authority": result.get("buying_authority", "unknown"),
                    "urgency": result.get("urgency", "low"),
                    "qualified": result.get("score", 0) >= settings.MIN_QUALIFICATION_SCORE
                }

            except json.JSONDecodeError:
                logger.error(f"Failed to parse qualification response: {response.content}")

                # Fallback: basic scoring
                qualification = self._fallback_scoring(lead_data)

            logger.info(f"Qualified lead with score: {qualification['score']}")

            return qualification

        except Exception as e:
            logger.error(f"Qualification failed: {e}")
            return self._fallback_scoring(lead_data)

    def _fallback_scoring(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback scoring if AI fails.

        Args:
            lead_data: Lead information

        Returns:
            Basic qualification score
        """
        score = 5  # Default middle score

        # Basic rules
        title = (lead_data.get("title") or "").lower()
        if any(word in title for word in ["ceo", "cto", "cmo", "vp", "director"]):
            score += 2

        if lead_data.get("company"):
            score += 1

        if lead_data.get("linkedin_url"):
            score += 1

        return {
            "score": min(score, 10),
            "reasoning": "Fallback scoring used due to AI error",
            "recommendation": "Review manually",
            "icp_match": False,
            "buying_authority": "unknown",
            "urgency": "low",
            "qualified": score >= settings.MIN_QUALIFICATION_SCORE
        }


# Singleton instance
qualification_agent = QualificationAgent()
