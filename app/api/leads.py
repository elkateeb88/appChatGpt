"""API endpoints for lead management."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.services.enrichment import enrich_lead_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead: LeadCreate,
    background_tasks: BackgroundTasks,
    enrich: bool = Query(True, description="Automatically enrich lead data"),
    db: Session = Depends(get_db)
):
    """
    Create a new lead.

    Args:
        lead: Lead data
        enrich: Whether to automatically enrich the lead
        db: Database session

    Returns:
        Created lead
    """
    # Check if lead already exists
    existing_lead = db.query(Lead).filter(Lead.email == lead.email).first()
    if existing_lead:
        raise HTTPException(status_code=400, detail="Lead with this email already exists")

    # Create lead
    db_lead = Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    logger.info(f"Created lead: {db_lead.email}")

    # Enrich in background if requested
    if enrich:
        background_tasks.add_task(enrich_lead_service, db_lead.id, db)

    return db_lead


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, db: Session = Depends(get_db)):
    """
    Get lead by ID.

    Args:
        lead_id: Lead UUID
        db: Database session

    Returns:
        Lead data
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return lead


@router.get("/", response_model=List[LeadResponse])
async def list_leads(
    skip: int = Query(0, ge=0, description="Number of leads to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of leads to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    min_score: Optional[int] = Query(None, ge=0, le=10, description="Minimum lead score"),
    search: Optional[str] = Query(None, description="Search by email, name, or company"),
    db: Session = Depends(get_db)
):
    """
    List leads with optional filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status
        min_score: Minimum lead score
        search: Search query
        db: Database session

    Returns:
        List of leads
    """
    query = db.query(Lead)

    # Apply filters
    if status:
        query = query.filter(Lead.status == status)

    if min_score is not None:
        query = query.filter(Lead.score >= min_score)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Lead.email.ilike(search_pattern)) |
            (Lead.first_name.ilike(search_pattern)) |
            (Lead.last_name.ilike(search_pattern)) |
            (Lead.company.ilike(search_pattern))
        )

    # Execute query
    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()

    return leads


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db)
):
    """
    Update lead information.

    Args:
        lead_id: Lead UUID
        lead_update: Updated lead data
        db: Database session

    Returns:
        Updated lead
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Update fields
    update_data = lead_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)

    logger.info(f"Updated lead: {lead.email}")

    return lead


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    """
    Delete a lead.

    Args:
        lead_id: Lead UUID
        db: Database session
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db.delete(lead)
    db.commit()

    logger.info(f"Deleted lead: {lead.email}")


@router.post("/bulk", response_model=List[LeadResponse])
async def bulk_create_leads(
    leads: List[LeadCreate],
    background_tasks: BackgroundTasks,
    enrich: bool = Query(True, description="Automatically enrich leads"),
    db: Session = Depends(get_db)
):
    """
    Bulk create leads.

    Args:
        leads: List of lead data
        enrich: Whether to automatically enrich leads
        db: Database session

    Returns:
        List of created leads
    """
    created_leads = []

    for lead_data in leads:
        # Check if lead exists
        existing_lead = db.query(Lead).filter(Lead.email == lead_data.email).first()
        if existing_lead:
            logger.warning(f"Lead already exists: {lead_data.email}")
            continue

        # Create lead
        db_lead = Lead(**lead_data.model_dump())
        db.add(db_lead)
        created_leads.append(db_lead)

    # Commit all
    db.commit()

    # Refresh all
    for lead in created_leads:
        db.refresh(lead)

        # Enrich in background if requested
        if enrich:
            background_tasks.add_task(enrich_lead_service, lead.id, db)

    logger.info(f"Bulk created {len(created_leads)} leads")

    return created_leads


@router.get("/{lead_id}/history")
async def get_lead_history(lead_id: str, db: Session = Depends(get_db)):
    """
    Get lead outreach history.

    Args:
        lead_id: Lead UUID
        db: Database session

    Returns:
        Lead outreach history
    """
    from app.models.outreach_history import OutreachHistory

    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    history = db.query(OutreachHistory).filter(
        OutreachHistory.lead_id == lead_id
    ).order_by(OutreachHistory.created_at.desc()).all()

    return {
        "lead": lead,
        "history": history
    }
