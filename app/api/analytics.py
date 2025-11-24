"""API endpoints for analytics and reporting."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.database import get_db
from app.models.outreach_history import OutreachHistory, AnalyticsEvent
from app.models.campaign import Campaign
from app.models.lead import Lead

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics.

    Args:
        days: Number of days to analyze
        db: Database session

    Returns:
        Dashboard statistics
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Total leads
    total_leads = db.query(Lead).count()

    # New leads in period
    new_leads = db.query(Lead).filter(Lead.created_at >= cutoff_date).count()

    # Qualified leads
    qualified_leads = db.query(Lead).filter(Lead.score >= 7).count()

    # Active campaigns
    active_campaigns = db.query(Campaign).filter(Campaign.status == "active").count()

    # Email metrics
    total_sent = db.query(OutreachHistory).filter(
        OutreachHistory.sent_at.isnot(None),
        OutreachHistory.sent_at >= cutoff_date
    ).count()

    total_opened = db.query(OutreachHistory).filter(
        OutreachHistory.opened_at.isnot(None),
        OutreachHistory.opened_at >= cutoff_date
    ).count()

    total_replied = db.query(OutreachHistory).filter(
        OutreachHistory.replied_at.isnot(None),
        OutreachHistory.replied_at >= cutoff_date
    ).count()

    total_bounced = db.query(OutreachHistory).filter(
        OutreachHistory.bounced == True,
        OutreachHistory.created_at >= cutoff_date
    ).count()

    # Calculate rates
    open_rate = (total_opened / total_sent * 100) if total_sent > 0 else 0
    reply_rate = (total_replied / total_sent * 100) if total_sent > 0 else 0
    bounce_rate = (total_bounced / total_sent * 100) if total_sent > 0 else 0

    return {
        "period_days": days,
        "leads": {
            "total": total_leads,
            "new": new_leads,
            "qualified": qualified_leads
        },
        "campaigns": {
            "active": active_campaigns
        },
        "email_metrics": {
            "sent": total_sent,
            "opened": total_opened,
            "replied": total_replied,
            "bounced": total_bounced,
            "open_rate": round(open_rate, 2),
            "reply_rate": round(reply_rate, 2),
            "bounce_rate": round(bounce_rate, 2)
        }
    }


@router.get("/trends")
async def get_trends(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """
    Get time-series trends.

    Args:
        days: Number of days to analyze
        db: Database session

    Returns:
        Time-series trend data
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Query analytics events
    events = db.query(
        func.date(AnalyticsEvent.created_at).label('date'),
        AnalyticsEvent.event_type,
        func.count(AnalyticsEvent.id).label('count')
    ).filter(
        AnalyticsEvent.created_at >= cutoff_date
    ).group_by(
        func.date(AnalyticsEvent.created_at),
        AnalyticsEvent.event_type
    ).all()

    # Format data
    trends = {}
    for event in events:
        date_str = event.date.isoformat()
        if date_str not in trends:
            trends[date_str] = {}
        trends[date_str][event.event_type] = event.count

    return {
        "period_days": days,
        "trends": trends
    }


@router.get("/funnel")
async def get_conversion_funnel(
    campaign_id: Optional[str] = Query(None, description="Filter by campaign"),
    db: Session = Depends(get_db)
):
    """
    Get conversion funnel statistics.

    Args:
        campaign_id: Optional campaign filter
        db: Database session

    Returns:
        Conversion funnel data
    """
    query = db.query(OutreachHistory)

    if campaign_id:
        query = query.filter(OutreachHistory.campaign_id == campaign_id)

    total = query.count()
    sent = query.filter(OutreachHistory.sent_at.isnot(None)).count()
    opened = query.filter(OutreachHistory.opened_at.isnot(None)).count()
    clicked = query.filter(OutreachHistory.clicked_at.isnot(None)).count()
    replied = query.filter(OutreachHistory.replied_at.isnot(None)).count()

    return {
        "campaign_id": campaign_id,
        "funnel": {
            "total": total,
            "sent": sent,
            "opened": opened,
            "clicked": clicked,
            "replied": replied
        },
        "conversion_rates": {
            "sent_to_opened": round((opened / sent * 100), 2) if sent > 0 else 0,
            "opened_to_clicked": round((clicked / opened * 100), 2) if opened > 0 else 0,
            "clicked_to_replied": round((replied / clicked * 100), 2) if clicked > 0 else 0,
            "sent_to_replied": round((replied / sent * 100), 2) if sent > 0 else 0
        }
    }


@router.get("/lead-distribution")
async def get_lead_distribution(db: Session = Depends(get_db)):
    """
    Get lead distribution by status and score.

    Args:
        db: Database session

    Returns:
        Lead distribution data
    """
    # By status
    status_dist = db.query(
        Lead.status,
        func.count(Lead.id).label('count')
    ).group_by(Lead.status).all()

    # By score
    score_dist = db.query(
        Lead.score,
        func.count(Lead.id).label('count')
    ).group_by(Lead.score).order_by(Lead.score).all()

    return {
        "by_status": {status: count for status, count in status_dist},
        "by_score": {score: count for score, count in score_dist}
    }


@router.get("/top-performing")
async def get_top_performing_campaigns(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get top performing campaigns.

    Args:
        limit: Number of campaigns to return
        db: Database session

    Returns:
        Top performing campaigns
    """
    campaigns = db.query(Campaign).filter(Campaign.status != "draft").limit(limit).all()

    results = []
    for campaign in campaigns:
        # Get metrics
        total_sent = db.query(OutreachHistory).filter(
            OutreachHistory.campaign_id == campaign.id,
            OutreachHistory.sent_at.isnot(None)
        ).count()

        if total_sent == 0:
            continue

        replied = db.query(OutreachHistory).filter(
            OutreachHistory.campaign_id == campaign.id,
            OutreachHistory.replied_at.isnot(None)
        ).count()

        reply_rate = (replied / total_sent * 100) if total_sent > 0 else 0

        results.append({
            "campaign_id": str(campaign.id),
            "campaign_name": campaign.name,
            "total_sent": total_sent,
            "total_replied": replied,
            "reply_rate": round(reply_rate, 2)
        })

    # Sort by reply rate
    results.sort(key=lambda x: x["reply_rate"], reverse=True)

    return {
        "campaigns": results[:limit]
    }
