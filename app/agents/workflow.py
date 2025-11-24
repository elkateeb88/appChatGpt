"""LangGraph workflow orchestration for lead processing."""

import logging
from typing import TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, START, END

from app.agents.research import research_agent
from app.agents.qualification import qualification_agent
from app.agents.email_generation import email_generation_agent
from app.config import settings

logger = logging.getLogger(__name__)


class LeadProcessingState(TypedDict):
    """State for lead processing workflow."""

    # Input
    lead_email: str
    lead_data: dict

    # Research phase
    enrichment_data: dict
    research_insights: Annotated[dict, operator.add]
    personalization_hooks: dict

    # Qualification phase
    qualification_score: float
    qualification_reasoning: str
    qualified: bool

    # Email generation phase
    email_subject: str
    email_body: str
    email_generated: bool

    # Metadata
    workflow_status: str
    errors: list
    campaign_id: str


# Agent nodes
async def research_node(state: LeadProcessingState) -> dict:
    """
    Research agent node.

    Gathers information about the lead and company.
    """
    try:
        logger.info(f"Research node: Processing {state['lead_email']}")

        # Research lead
        research_results = await research_agent.research_lead(
            lead_data=state["lead_data"],
            enrichment_data=state.get("enrichment_data", {})
        )

        # Find personalization hooks
        hooks = await research_agent.find_personalization_hooks(
            lead_data={
                **state["lead_data"],
                **state.get("enrichment_data", {})
            }
        )

        return {
            "research_insights": research_results.get("insights", {}),
            "personalization_hooks": hooks,
            "workflow_status": "research_completed"
        }

    except Exception as e:
        logger.error(f"Research node failed: {e}")
        return {
            "workflow_status": "research_failed",
            "errors": [str(e)]
        }


async def qualification_node(state: LeadProcessingState) -> dict:
    """
    Qualification agent node.

    Scores and qualifies the lead.
    """
    try:
        logger.info(f"Qualification node: Scoring {state['lead_email']}")

        # Qualify lead
        qualification = await qualification_agent.qualify_lead(
            lead_data=state["lead_data"],
            research_insights=state.get("research_insights", {})
        )

        return {
            "qualification_score": qualification["score"],
            "qualification_reasoning": qualification["reasoning"],
            "qualified": qualification["qualified"],
            "workflow_status": "qualification_completed"
        }

    except Exception as e:
        logger.error(f"Qualification node failed: {e}")
        return {
            "qualification_score": 0,
            "qualified": False,
            "workflow_status": "qualification_failed",
            "errors": [str(e)]
        }


async def email_generation_node(state: LeadProcessingState) -> dict:
    """
    Email generation agent node.

    Generates personalized cold email.
    """
    try:
        # Only generate if qualified
        if not state.get("qualified", False):
            logger.info(f"Skipping email generation for unqualified lead: {state['lead_email']}")
            return {
                "email_generated": False,
                "workflow_status": "skipped_unqualified"
            }

        logger.info(f"Email generation node: Creating email for {state['lead_email']}")

        # Generate email
        email = await email_generation_agent.generate_email(
            lead_data=state["lead_data"],
            research_insights=state.get("research_insights", {}),
            personalization_hooks=state.get("personalization_hooks", {})
        )

        return {
            "email_subject": email["subject"],
            "email_body": email["body"],
            "email_generated": True,
            "workflow_status": "email_generated"
        }

    except Exception as e:
        logger.error(f"Email generation node failed: {e}")
        return {
            "email_generated": False,
            "workflow_status": "email_generation_failed",
            "errors": [str(e)]
        }


async def final_node(state: LeadProcessingState) -> dict:
    """
    Final processing node.

    Prepares results and cleanup.
    """
    logger.info(f"Workflow completed for {state['lead_email']}")

    return {
        "workflow_status": "completed"
    }


# Conditional routing
def should_generate_email(state: LeadProcessingState) -> str:
    """
    Decide if we should generate email.

    Routes qualified leads to email generation, others to end.
    """
    if state.get("qualified", False):
        return "generate_email"
    else:
        return "final"


# Build workflow
def build_lead_processing_workflow():
    """
    Build LangGraph workflow for lead processing.

    Flow:
    1. Research lead
    2. Qualify lead
    3. Generate email (if qualified)
    4. Final processing
    """
    workflow = StateGraph(LeadProcessingState)

    # Add nodes
    workflow.add_node("research", research_node)
    workflow.add_node("qualify", qualification_node)
    workflow.add_node("generate_email", email_generation_node)
    workflow.add_node("final", final_node)

    # Define flow
    workflow.add_edge(START, "research")
    workflow.add_edge("research", "qualify")

    # Conditional routing after qualification
    workflow.add_conditional_edges(
        "qualify",
        should_generate_email,
        {
            "generate_email": "generate_email",
            "final": "final"
        }
    )

    workflow.add_edge("generate_email", "final")
    workflow.add_edge("final", END)

    return workflow.compile()


# Singleton workflow instance
lead_generation_workflow = build_lead_processing_workflow()


async def process_lead_with_workflow(
    lead_email: str,
    lead_data: dict,
    enrichment_data: dict = None,
    campaign_id: str = None
) -> dict:
    """
    Process a lead through the complete workflow.

    Args:
        lead_email: Lead email address
        lead_data: Basic lead information
        enrichment_data: Enriched data (optional)
        campaign_id: Campaign ID (optional)

    Returns:
        Processing results
    """
    try:
        # Initialize state
        initial_state = {
            "lead_email": lead_email,
            "lead_data": lead_data,
            "enrichment_data": enrichment_data or {},
            "research_insights": {},
            "personalization_hooks": {},
            "qualification_score": 0.0,
            "qualification_reasoning": "",
            "qualified": False,
            "email_subject": "",
            "email_body": "",
            "email_generated": False,
            "workflow_status": "started",
            "errors": [],
            "campaign_id": campaign_id or ""
        }

        # Run workflow
        result = await lead_generation_workflow.ainvoke(initial_state)

        logger.info(f"Workflow completed for {lead_email}: {result['workflow_status']}")

        return result

    except Exception as e:
        logger.error(f"Workflow execution failed for {lead_email}: {e}")
        return {
            "lead_email": lead_email,
            "workflow_status": "failed",
            "errors": [str(e)]
        }
