"""Research agent for gathering lead information."""

import json
import logging
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class ResearchAgent:
    """Agent for researching leads and companies."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.DEFAULT_MODEL,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            api_key=settings.OPENAI_API_KEY
        )

        self.research_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert B2B sales researcher. Analyze the provided lead data and extract key insights.

Your task:
1. Identify the lead's role and responsibilities
2. Assess company size and industry
3. Identify potential pain points
4. Find personalization opportunities
5. Evaluate buying authority

Return a structured JSON with your findings."""),
            ("user", """Lead Data:
{lead_data}

Enrichment Data:
{enrichment_data}

Provide a detailed research report.""")
        ])

    async def research_lead(
        self,
        lead_data: Dict[str, Any],
        enrichment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Research a lead using AI analysis.

        Args:
            lead_data: Basic lead information
            enrichment_data: Enriched data from external sources

        Returns:
            Research insights
        """
        try:
            # Format prompt
            prompt = self.research_prompt.format_messages(
                lead_data=json.dumps(lead_data, indent=2),
                enrichment_data=json.dumps(enrichment_data, indent=2)
            )

            # Get AI response
            response = await self.llm.ainvoke(prompt)

            # Parse response
            try:
                insights = json.loads(response.content)
            except json.JSONDecodeError:
                # If not valid JSON, wrap in structure
                insights = {
                    "analysis": response.content,
                    "confidence": "medium"
                }

            logger.info(f"Researched lead: {lead_data.get('email')}")

            return {
                "research_completed": True,
                "insights": insights,
                "timestamp": "now"
            }

        except Exception as e:
            logger.error(f"Research failed: {e}")
            return {
                "research_completed": False,
                "error": str(e)
            }

    async def analyze_company(self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze company information.

        Args:
            company_data: Company information

        Returns:
            Company analysis
        """
        prompt = f"""Analyze this company:

Company Data:
{json.dumps(company_data, indent=2)}

Provide insights about:
1. Company maturity and growth stage
2. Technology stack (if available)
3. Potential challenges in their industry
4. Decision-making process (based on company size)
5. Budget indicators

Return JSON with your analysis."""

        try:
            response = await self.llm.ainvoke(prompt)

            try:
                analysis = json.loads(response.content)
            except json.JSONDecodeError:
                analysis = {"raw_analysis": response.content}

            return analysis

        except Exception as e:
            logger.error(f"Company analysis failed: {e}")
            return {"error": str(e)}

    async def find_personalization_hooks(
        self,
        lead_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Find personalization opportunities.

        Args:
            lead_data: Lead and enrichment data

        Returns:
            Personalization hooks
        """
        prompt = f"""Based on this lead data, suggest 3-5 specific personalization hooks for a cold email:

{json.dumps(lead_data, indent=2)}

Hooks should be:
- Specific to this person/company
- Relevant to their role
- Based on observable facts
- Conversation starters

Return JSON: {{"hooks": [list of hooks]}}"""

        try:
            response = await self.llm.ainvoke(prompt)

            try:
                hooks = json.loads(response.content)
            except json.JSONDecodeError:
                # Extract hooks from text
                hooks = {"hooks": [response.content]}

            return hooks

        except Exception as e:
            logger.error(f"Hook finding failed: {e}")
            return {"hooks": []}


# Singleton instance
research_agent = ResearchAgent()
