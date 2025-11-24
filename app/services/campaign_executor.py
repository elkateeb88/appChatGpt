"""Campaign execution service."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import List

from app.models.campaign import Campaign, EmailSequence
from app.models.lead import Lead
from app.models.email_account import EmailAccount
from app.models.outreach_history import OutreachHistory, AnalyticsEvent
from app.services.email_sender import email_sender

logger = logging.getLogger(__name__)


class CampaignExecutor:
    """Execute campaign email sequences."""

    async def execute_campaign(self, campaign_id: str, db: Session):
        """
        Execute a campaign.

        Args:
            campaign_id: Campaign UUID
            db: Database session
        """
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found")
            return

        if campaign.status != "active":
            logger.warning(f"Campaign {campaign_id} is not active")
            return

        logger.info(f"Starting execution of campaign: {campaign.name}")

        # Get campaign settings
        settings_data = campaign.settings or {}
        target_leads = settings_data.get("target_leads", [])
        min_score = settings_data.get("min_qualification_score", 7)

        # Get leads to contact
        if target_leads:
            # Specific leads
            leads = db.query(Lead).filter(Lead.id.in_(target_leads)).all()
        else:
            # All qualified leads not yet contacted in this campaign
            leads = db.query(Lead).filter(
                Lead.score >= min_score,
                Lead.status.in_(["qualified", "enriched"])
            ).all()

        if not leads:
            logger.warning(f"No leads to contact for campaign {campaign.name}")
            return

        # Get email accounts (round-robin)
        email_accounts = db.query(EmailAccount).filter(
            EmailAccount.is_active == True,
            EmailAccount.health_score > 30
        ).all()

        if not email_accounts:
            logger.error("No active email accounts available")
            return

        # Get sequences
        sequences = db.query(EmailSequence).filter(
            EmailSequence.campaign_id == campaign_id
        ).order_by(EmailSequence.step_number).all()

        if not sequences:
            logger.error(f"No email sequences for campaign {campaign.name}")
            return

        # Execute for each lead
        account_index = 0
        for lead in leads:
            # Check if already contacted
            existing = db.query(OutreachHistory).filter(
                OutreachHistory.lead_id == lead.id,
                OutreachHistory.campaign_id == campaign_id
            ).first()

            if existing:
                logger.debug(f"Lead {lead.email} already contacted in this campaign")
                continue

            # Get next available email account
            account = email_accounts[account_index % len(email_accounts)]
            account_index += 1

            # Send first sequence step
            await self._send_sequence_step(
                lead, campaign, sequences[0], account, db
            )

            # Small delay between leads
            await asyncio.sleep(5)

        logger.info(f"Campaign {campaign.name} execution completed")

    async def _send_sequence_step(
        self,
        lead: Lead,
        campaign: Campaign,
        sequence: EmailSequence,
        account: EmailAccount,
        db: Session
    ):
        """
        Send a single email sequence step.

        Args:
            lead: Lead to contact
            campaign: Campaign
            sequence: Email sequence step
            account: Email account to use
            db: Database session
        """
        try:
            # Personalize email content
            subject = self._personalize_content(sequence.subject_template, lead)
            body = self._personalize_content(sequence.body_template, lead)

            # Send email
            message_id = await email_sender.send_email(
                to_email=lead.email,
                subject=subject,
                body_html=body,
                from_email=account.email,
                account=account
            )

            if message_id:
                # Record outreach history
                history = OutreachHistory(
                    lead_id=lead.id,
                    campaign_id=campaign.id,
                    sequence_id=sequence.id,
                    email_account_id=account.id,
                    sent_at=datetime.now(timezone.utc)
                )
                db.add(history)

                # Record analytics event
                event = AnalyticsEvent(
                    event_type="sent",
                    lead_id=lead.id,
                    campaign_id=campaign.id,
                    metadata={"sequence_step": sequence.step_number}
                )
                db.add(event)

                # Update lead status
                if lead.status == "qualified":
                    lead.status = "contacted"

                db.commit()

                logger.info(f"Sent email to {lead.email} for campaign {campaign.name}")
            else:
                logger.error(f"Failed to send email to {lead.email}")

        except Exception as e:
            logger.error(f"Error sending sequence step to {lead.email}: {e}")
            db.rollback()

    def _personalize_content(self, template: str, lead: Lead) -> str:
        """
        Personalize email content with lead data.

        Args:
            template: Email template
            lead: Lead data

        Returns:
            Personalized content
        """
        replacements = {
            "{{first_name}}": lead.first_name or "there",
            "{{last_name}}": lead.last_name or "",
            "{{full_name}}": lead.full_name or "there",
            "{{company}}": lead.company or "your company",
            "{{title}}": lead.title or "your role",
            "{{email}}": lead.email,
        }

        content = template
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)

        return content

    async def schedule_follow_ups(self, campaign_id: str, db: Session):
        """
        Schedule follow-up emails for a campaign.

        Args:
            campaign_id: Campaign UUID
            db: Database session
        """
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return

        # Get all sequences
        sequences = db.query(EmailSequence).filter(
            EmailSequence.campaign_id == campaign_id
        ).order_by(EmailSequence.step_number).all()

        if len(sequences) <= 1:
            logger.info(f"No follow-ups configured for campaign {campaign.name}")
            return

        # Get leads with sent emails but no response
        sent_histories = db.query(OutreachHistory).filter(
            OutreachHistory.campaign_id == campaign_id,
            OutreachHistory.sent_at.isnot(None),
            OutreachHistory.replied_at.is_(None)
        ).all()

        for history in sent_histories:
            # Check if enough time has passed for follow-up
            current_sequence = db.query(EmailSequence).filter(
                EmailSequence.id == history.sequence_id
            ).first()

            if not current_sequence:
                continue

            # Get next sequence
            next_sequence = db.query(EmailSequence).filter(
                EmailSequence.campaign_id == campaign_id,
                EmailSequence.step_number == current_sequence.step_number + 1
            ).first()

            if not next_sequence:
                continue  # No more follow-ups

            # Check if wait time has passed
            wait_until = history.sent_at + timedelta(days=current_sequence.wait_days)
            if datetime.now(timezone.utc) >= wait_until:
                # Send follow-up
                lead = db.query(Lead).filter(Lead.id == history.lead_id).first()
                account = db.query(EmailAccount).filter(
                    EmailAccount.id == history.email_account_id
                ).first()

                if lead and account and account.can_send():
                    await self._send_sequence_step(
                        lead, campaign, next_sequence, account, db
                    )


# Singleton instance
campaign_executor = CampaignExecutor()


async def execute_campaign(campaign_id: str, db: Session):
    """
    Execute a campaign (convenience function).

    Args:
        campaign_id: Campaign UUID
        db: Database session
    """
    await campaign_executor.execute_campaign(campaign_id, db)
