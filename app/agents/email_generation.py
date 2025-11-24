"""Email generation agent using GPT."""

import json
import logging
from typing import Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class EmailGenerationAgent:
    """Agent for generating personalized cold emails."""

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.DEFAULT_MODEL,
            temperature=0.7,  # Higher for more creative emails
            max_tokens=500,
            api_key=settings.OPENAI_API_KEY
        )

        self.email_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert cold email copywriter with 10+ years of experience in B2B SaaS.

**Your task:** Write a personalized cold email that:
- Opens with a specific, relevant hook
- Demonstrates you've done research
- Focuses on THEIR problems, not your product
- Uses conversational, not salesy tone
- Keeps it under 125 words
- Has a clear but soft CTA

**Best practices:**
- No generic compliments ("I love your company")
- No feature dumping
- No pushy CTAs ("Schedule a call now!")
- Reference specific, observable facts
- One clear value proposition
- Professional but human tone

**Format:**
Return JSON with:
{
  "subject": "subject line (max 50 chars, no spammy words)",
  "body": "email body (max 125 words)",
  "personalization_score": 1-10
}

**Product/Service:** AI-powered lead generation and outreach automation platform"""),
            ("user", """Lead Information:
Name: {name}
Company: {company}
Title: {title}

Research Insights:
{research_insights}

Personalization Hooks:
{personalization_hooks}

Generate a cold email:""")
        ])

    async def generate_email(
        self,
        lead_data: Dict[str, Any],
        research_insights: Dict[str, Any],
        personalization_hooks: Dict[str, Any],
        campaign_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized cold email.

        Args:
            lead_data: Lead information
            research_insights: Research results
            personalization_hooks: Personalization opportunities
            campaign_context: Optional campaign-specific context

        Returns:
            Generated email with subject and body
        """
        try:
            # Extract lead info
            name = lead_data.get("first_name", "there")
            company = lead_data.get("company", "your company")
            title = lead_data.get("title", "your role")

            # Format prompt
            prompt = self.email_prompt.format_messages(
                name=name,
                company=company,
                title=title,
                research_insights=json.dumps(research_insights, indent=2),
                personalization_hooks=json.dumps(personalization_hooks, indent=2)
            )

            # Generate email
            response = await self.llm.ainvoke(prompt)

            # Parse response
            try:
                email_data = json.loads(response.content)

                result = {
                    "subject": email_data.get("subject", f"Quick question about {company}"),
                    "body": email_data.get("body", ""),
                    "personalization_score": email_data.get("personalization_score", 5),
                    "generated": True
                }

            except json.JSONDecodeError:
                logger.error(f"Failed to parse email response: {response.content}")

                # Extract subject and body from text
                content = response.content
                result = self._parse_email_from_text(content, lead_data)

            logger.info(f"Generated email for {lead_data.get('email')}")

            return result

        except Exception as e:
            logger.error(f"Email generation failed: {e}")
            return self._fallback_email(lead_data)

    async def generate_follow_up(
        self,
        lead_data: Dict[str, Any],
        previous_email: Dict[str, Any],
        step_number: int
    ) -> Dict[str, Any]:
        """
        Generate follow-up email.

        Args:
            lead_data: Lead information
            previous_email: Previous email sent
            step_number: Follow-up step number (2, 3, etc.)

        Returns:
            Follow-up email
        """
        prompt = f"""Generate follow-up email #{step_number} for:

Lead: {lead_data.get('first_name')} at {lead_data.get('company')}
Previous Email Subject: {previous_email.get('subject')}

Follow-up strategy:
- Step 2: Provide additional value (case study, insight)
- Step 3: Different angle (different pain point)
- Step 4: Final attempt (breakup email)

Keep it short (75 words max), reference previous email indirectly, add value.

Return JSON with subject and body."""

        try:
            response = await self.llm.ainvoke(prompt)

            try:
                email_data = json.loads(response.content)
                return {
                    "subject": email_data.get("subject"),
                    "body": email_data.get("body"),
                    "step": step_number,
                    "generated": True
                }
            except json.JSONDecodeError:
                return self._parse_email_from_text(response.content, lead_data)

        except Exception as e:
            logger.error(f"Follow-up generation failed: {e}")
            return self._fallback_followup(lead_data, step_number)

    def _parse_email_from_text(
        self,
        content: str,
        lead_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse email from unstructured text."""
        lines = content.split('\n')

        subject = ""
        body_lines = []
        in_body = False

        for line in lines:
            line = line.strip()
            if line.lower().startswith("subject:"):
                subject = line.split(":", 1)[1].strip()
            elif line.lower().startswith("body:"):
                in_body = True
                body_text = line.split(":", 1)[1].strip()
                if body_text:
                    body_lines.append(body_text)
            elif in_body and line:
                body_lines.append(line)

        return {
            "subject": subject or f"Question about {lead_data.get('company')}",
            "body": "\n".join(body_lines) or content,
            "personalization_score": 5,
            "generated": True
        }

    def _fallback_email(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate fallback email template."""
        name = lead_data.get("first_name", "there")
        company = lead_data.get("company", "your company")

        return {
            "subject": f"Quick question, {name}",
            "body": f"""Hi {name},

I noticed {company} is growing and wanted to reach out.

We help companies like yours automate their lead generation and outreach, saving 10+ hours per week while improving response rates.

Would you be open to a quick chat about how we could help {company}?

Best,
[Your name]""",
            "personalization_score": 3,
            "generated": False
        }

    def _fallback_followup(
        self,
        lead_data: Dict[str, Any],
        step_number: int
    ) -> Dict[str, Any]:
        """Generate fallback follow-up."""
        name = lead_data.get("first_name", "there")

        return {
            "subject": f"Following up, {name}",
            "body": f"""Hi {name},

Just wanted to follow up on my previous email.

Is this something you'd be interested in exploring?

Best,
[Your name]""",
            "step": step_number,
            "generated": False
        }


# Singleton instance
email_generation_agent = EmailGenerationAgent()
