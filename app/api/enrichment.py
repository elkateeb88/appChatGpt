"""API endpoints for lead enrichment."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadEnrichmentRequest, LeadEnrichmentResponse
from app.services.enrichment import enrich_lead_service, enrich_email_data

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/enrich", response_model=LeadEnrichmentResponse)
async def enrich_lead(
    request: LeadEnrichmentRequest,
    db: Session = Depends(get_db)
):
    """
    Enrich lead data synchronously.

    Args:
        request: Enrichment request
        db: Database session

    Returns:
        Enriched lead data
    """
    try:
        # Enrich email
        enriched_data = await enrich_email_data(request.email, force_refresh=request.force_refresh)

        if not enriched_data:
            return LeadEnrichmentResponse(
                email=request.email,
                enriched=False,
                data={},
                source="none",
                message="No data found for this email"
            )

        # Update lead if exists
        lead = db.query(Lead).filter(Lead.email == request.email).first()
        if lead:
            # Update lead with enriched data
            if "first_name" in enriched_data:
                lead.first_name = enriched_data["first_name"]
            if "last_name" in enriched_data:
                lead.last_name = enriched_data["last_name"]
            if "company" in enriched_data:
                lead.company = enriched_data["company"]
            if "title" in enriched_data:
                lead.title = enriched_data["title"]
            if "phone" in enriched_data:
                lead.phone = enriched_data["phone"]
            if "linkedin_url" in enriched_data:
                lead.linkedin_url = enriched_data["linkedin_url"]

            lead.enrichment_data = enriched_data
            db.commit()

        return LeadEnrichmentResponse(
            email=request.email,
            enriched=True,
            data=enriched_data,
            source=enriched_data.get("source", "unknown"),
            message="Lead enriched successfully"
        )

    except Exception as e:
        logger.error(f"Enrichment failed for {request.email}: {e}")
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")


@router.post("/enrich/{lead_id}")
async def enrich_lead_by_id(
    lead_id: str,
    background_tasks: BackgroundTasks,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Enrich lead by ID (async in background).

    Args:
        lead_id: Lead UUID
        background_tasks: FastAPI background tasks
        force: Force refresh cached data
        db: Database session

    Returns:
        Status message
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Enrich in background
    background_tasks.add_task(enrich_lead_service, lead_id, db, force_refresh=force)

    return {
        "status": "success",
        "message": "Lead enrichment started",
        "lead_id": str(lead_id)
    }


@router.post("/bulk-enrich")
async def bulk_enrich_leads(
    lead_ids: list[str],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Bulk enrich multiple leads (async in background).

    Args:
        lead_ids: List of lead UUIDs
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Status message
    """
    # Verify leads exist
    leads = db.query(Lead).filter(Lead.id.in_(lead_ids)).all()

    if not leads:
        raise HTTPException(status_code=404, detail="No leads found")

    # Enrich each lead in background
    for lead in leads:
        background_tasks.add_task(enrich_lead_service, lead.id, db)

    return {
        "status": "success",
        "message": f"Bulk enrichment started for {len(leads)} leads",
        "count": len(leads)
    }


@router.get("/status/{lead_id}")
async def get_enrichment_status(lead_id: str, db: Session = Depends(get_db)):
    """
    Get enrichment status for a lead.

    Args:
        lead_id: Lead UUID
        db: Database session

    Returns:
        Enrichment status
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    enriched = bool(lead.enrichment_data)
    completeness = calculate_completeness(lead)

    return {
        "lead_id": str(lead_id),
        "email": lead.email,
        "enriched": enriched,
        "completeness": completeness,
        "data_sources": lead.enrichment_data.get("source", "none") if enriched else None
    }


def calculate_completeness(lead: Lead) -> float:
    """
    Calculate lead data completeness percentage.

    Args:
        lead: Lead object

    Returns:
        Completeness percentage (0-100)
    """
    fields = [
        lead.first_name,
        lead.last_name,
        lead.company,
        lead.title,
        lead.phone,
        lead.linkedin_url
    ]

    filled_fields = sum(1 for field in fields if field)
    total_fields = len(fields)

    return round((filled_fields / total_fields) * 100, 2)
