"""Email sending service with AWS SES and SendGrid support."""

import boto3
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import asyncio
import random
import logging
from typing import Optional
from datetime import datetime, timezone

from app.config import settings
from app.models.email_account import EmailAccount

logger = logging.getLogger(__name__)


class EmailSender:
    """Service for sending emails via multiple providers."""

    def __init__(self):
        # Initialize AWS SES
        self.ses_client = None
        if settings.AWS_SES_ACCESS_KEY and settings.AWS_SES_SECRET_KEY:
            try:
                self.ses_client = boto3.client(
                    'ses',
                    region_name=settings.AWS_SES_REGION,
                    aws_access_key_id=settings.AWS_SES_ACCESS_KEY,
                    aws_secret_access_key=settings.AWS_SES_SECRET_KEY
                )
                logger.info("AWS SES client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize AWS SES: {e}")

        # Initialize SendGrid
        self.sg_client = None
        if settings.SENDGRID_API_KEY:
            try:
                self.sg_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
                logger.info("SendGrid client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid: {e}")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        from_email: str,
        account: EmailAccount,
        track_opens: bool = True,
        track_clicks: bool = True
    ) -> Optional[str]:
        """
        Send email using configured provider.

        Args:
            to_email: Recipient email
            subject: Email subject
            body_html: HTML body
            from_email: Sender email
            account: Email account to use
            track_opens: Enable open tracking
            track_clicks: Enable click tracking

        Returns:
            Message ID if successful, None otherwise
        """
        # Check if account can send
        if not account.can_send():
            logger.warning(f"Account {account.email} cannot send (limit reached or inactive)")
            return None

        # Choose provider based on account
        if account.provider == "aws_ses":
            message_id = await self._send_via_ses(to_email, subject, body_html, from_email)
        elif account.provider == "sendgrid":
            message_id = await self._send_via_sendgrid(
                to_email, subject, body_html, from_email, track_opens, track_clicks
            )
        else:
            logger.error(f"Unknown email provider: {account.provider}")
            return None

        if message_id:
            # Update account stats
            account.daily_sent += 1
            account.last_sent_at = datetime.now(timezone.utc)

            # Add random delay to mimic human behavior
            delay = random.uniform(settings.EMAIL_SEND_DELAY_MIN, settings.EMAIL_SEND_DELAY_MAX)
            await asyncio.sleep(delay)

            logger.info(f"Email sent successfully to {to_email} via {account.provider}")
            return message_id

        return None

    async def _send_via_ses(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        from_email: str
    ) -> Optional[str]:
        """Send email via AWS SES."""
        if not self.ses_client:
            logger.error("AWS SES client not initialized")
            return None

        try:
            response = self.ses_client.send_email(
                Source=from_email,
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {'Data': body_html, 'Charset': 'UTF-8'}
                    }
                }
            )

            return response['MessageId']

        except Exception as e:
            logger.error(f"AWS SES send failed: {e}")
            return None

    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        from_email: str,
        track_opens: bool,
        track_clicks: bool
    ) -> Optional[str]:
        """Send email via SendGrid."""
        if not self.sg_client:
            logger.error("SendGrid client not initialized")
            return None

        try:
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=body_html
            )

            # Enable tracking
            message.tracking_settings = {
                "open_tracking": {"enable": track_opens},
                "click_tracking": {"enable": track_clicks}
            }

            response = self.sg_client.send(message)

            # Get message ID from headers
            message_id = response.headers.get('X-Message-Id')
            return message_id

        except Exception as e:
            logger.error(f"SendGrid send failed: {e}")
            return None

    def check_rate_limit(self, account: EmailAccount) -> bool:
        """
        Check if account is within rate limits.

        Args:
            account: Email account

        Returns:
            True if within limits, False otherwise
        """
        return account.can_send()

    async def send_test_email(
        self,
        to_email: str,
        provider: str = "aws_ses"
    ) -> bool:
        """
        Send a test email.

        Args:
            to_email: Recipient email
            provider: Provider to use

        Returns:
            True if successful
        """
        subject = "Test Email from AI Lead Generation Platform"
        body = """
        <html>
            <body>
                <h2>Test Email</h2>
                <p>This is a test email from the AI Lead Generation Platform.</p>
                <p>If you received this, your email configuration is working correctly.</p>
            </body>
        </html>
        """

        if provider == "aws_ses" and self.ses_client:
            message_id = await self._send_via_ses(
                to_email, subject, body, settings.DEFAULT_FROM_EMAIL
            )
            return message_id is not None

        elif provider == "sendgrid" and self.sg_client:
            message_id = await self._send_via_sendgrid(
                to_email, subject, body, settings.DEFAULT_FROM_EMAIL, True, True
            )
            return message_id is not None

        return False


# Singleton instance
email_sender = EmailSender()


async def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    account: EmailAccount
) -> Optional[str]:
    """
    Convenience function to send email.

    Args:
        to_email: Recipient email
        subject: Email subject
        body_html: HTML body
        account: Email account to use

    Returns:
        Message ID if successful
    """
    return await email_sender.send_email(
        to_email,
        subject,
        body_html,
        account.email,
        account
    )
