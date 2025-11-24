"""API endpoints for campaign management."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from app.database import get_db
from app.models.campaign import Campaign, EmailSequence
from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    CampaignAnalytics
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new campaign.

    Args:
        campaign: Campaign data
        db: Database session

    Returns:
        Created campaign
    """
    # Create campaign
    db_campaign = Campaign(
        name=campaign.name,
        settings=campaign.settings
    )
    db.add(db_campaign)
    db.flush()  # Get campaign ID

    # Create sequences
    for sequence_data in campaign.sequences:
        db_sequence = EmailSequence(
            campaign_id=db_campaign.id,
            **sequence_data.model_dump()
        )
        db.add(db_sequence)

    db.commit()
    db.refresh(db_campaign)

    logger.info(f"Created campaign: {db_campaign.name}")

    return db_campaign


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    """
    Get campaign by ID.

    Args:
        campaign_id: Campaign UUID
        db: Database session

    Returns:
        Campaign data
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return campaign


@router.get("/", response_model=List[CampaignResponse])
async def list_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """
    List campaigns with optional filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status
        db: Database session

    Returns:
        List of campaigns
    """
    query = db.query(Campaign)

    if status:
        query = query.filter(Campaign.status == status)

    campaigns = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit).all()

    return campaigns


@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    campaign_update: CampaignUpdate,
    db: Session = Depends(get_db)
):
    """
    Update campaign.

    Args:
        campaign_id: Campaign UUID
        campaign_update: Updated campaign data
        db: Database session

    Returns:
        Updated campaign
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Update fields
    update_data = campaign_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)

    logger.info(f"Updated campaign: {campaign.name}")

    return campaign


@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(campaign_id: str, db: Session = Depends(get_db)):
    """
    Delete a campaign.

    Args:
        campaign_id: Campaign UUID
        db: Database session
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.delete(campaign)
    db.commit()

    logger.info(f"Deleted campaign: {campaign.name}")


@router.post("/{campaign_id}/start")
async def start_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start a campaign.

    Args:
        campaign_id: Campaign UUID
        background_tasks: FastAPI background tasks
        db: Database session

    Returns:
        Status message
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status == "active":
        raise HTTPException(status_code=400, detail="Campaign is already active")

    # Update status
    campaign.status = "active"
    db.commit()

    # Start campaign execution in background
    from app.services.campaign_executor import execute_campaign
    background_tasks.add_task(execute_campaign, campaign_id, db)

    logger.info(f"Started campaign: {campaign.name}")

    return {
        "status": "success",
        "message": "Campaign started",
        "campaign_id": str(campaign_id)
    }


@router.post("/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, db: Session = Depends(get_db)):
    """
    Pause a campaign.

    Args:
        campaign_id: Campaign UUID
        db: Database session

    Returns:
        Status message
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.status = "paused"
    db.commit()

    logger.info(f"Paused campaign: {campaign.name}")

    return {
        "status": "success",
        "message": "Campaign paused",
        "campaign_id": str(campaign_id)
    }


@router.get("/{campaign_id}/analytics", response_model=CampaignAnalytics)
async def get_campaign_analytics(campaign_id: str, db: Session = Depends(get_db)):
    """
    Get campaign analytics.

    Args:
        campaign_id: Campaign UUID
        db: Database session

    Returns:
        Campaign analytics
    """
    from app.models.outreach_history import OutreachHistory

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Calculate metrics
    total_sent = db.query(OutreachHistory).filter(
        OutreachHistory.campaign_id == campaign_id,
        OutreachHistory.sent_at.isnot(None)
    ).count()

    if total_sent == 0:
        return CampaignAnalytics(
            campaign_id=campaign_id,
            total_sent=0,
            open_rate=0.0,
            click_rate=0.0,
            reply_rate=0.0,
            bounce_rate=0.0,
            conversion_rate=0.0
        )

    opened = db.query(OutreachHistory).filter(
        OutreachHistory.campaign_id == campaign_id,
        OutreachHistory.opened_at.isnot(None)
    ).count()

    clicked = db.query(OutreachHistory).filter(
        OutreachHistory.campaign_id == campaign_id,
        OutreachHistory.clicked_at.isnot(None)
    ).count()

    replied = db.query(OutreachHistory).filter(
        OutreachHistory.campaign_id == campaign_id,
        OutreachHistory.replied_at.isnot(None)
    ).count()

    bounced = db.query(OutreachHistory).filter(
        OutreachHistory.campaign_id == campaign_id,
        OutreachHistory.bounced == True
    ).count()

    return CampaignAnalytics(
        campaign_id=campaign_id,
        total_sent=total_sent,
        open_rate=round((opened / total_sent * 100), 2),
        click_rate=round((clicked / total_sent * 100), 2),
        reply_rate=round((replied / total_sent * 100), 2),
        bounce_rate=round((bounced / total_sent * 100), 2),
        conversion_rate=round((replied / total_sent * 100), 2)  # Using replies as conversions
    )
