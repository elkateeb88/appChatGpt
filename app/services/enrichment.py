"""Lead enrichment service with waterfall strategy."""

import httpx
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.models.lead import Lead
from app.utils.cache import cache_result, get_cached, set_cached

logger = logging.getLogger(__name__)


class EnrichmentService:
    """Service for enriching lead data from multiple providers."""

    def __init__(self):
        self.clearbit_api = "https://person.clearbit.com/v2/combined/find"
        self.apollo_api = "https://api.apollo.io/v1/people/match"
        self.hunter_api = "https://api.hunter.io/v2/email-finder"

    async def enrich_clearbit(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Enrich email using Clearbit API.

        Args:
            email: Email address

        Returns:
            Enriched data or None
        """
        if not settings.CLEARBIT_API_KEY:
            logger.warning("Clearbit API key not configured")
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.clearbit_api,
                    params={"email": email},
                    headers={"Authorization": f"Bearer {settings.CLEARBIT_API_KEY}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    person = data.get("person", {})
                    company = data.get("company", {})

                    return {
                        "first_name": person.get("name", {}).get("givenName"),
                        "last_name": person.get("name", {}).get("familyName"),
                        "title": person.get("employment", {}).get("title"),
                        "company": person.get("employment", {}).get("name"),
                        "company_domain": person.get("employment", {}).get("domain"),
                        "linkedin_url": person.get("linkedin", {}).get("handle"),
                        "company_info": {
                            "name": company.get("name"),
                            "domain": company.get("domain"),
                            "industry": company.get("category", {}).get("industry"),
                            "employees": company.get("metrics", {}).get("employees"),
                            "location": company.get("location"),
                        },
                        "source": "clearbit"
                    }

                logger.debug(f"Clearbit returned status {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Clearbit enrichment failed for {email}: {e}")
            return None

    async def enrich_apollo(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Enrich email using Apollo API.

        Args:
            email: Email address

        Returns:
            Enriched data or None
        """
        if not settings.APOLLO_API_KEY:
            logger.warning("Apollo API key not configured")
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.apollo_api,
                    json={"email": email},
                    headers={"api_key": settings.APOLLO_API_KEY},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    person = data.get("person", {})
                    organization = person.get("organization", {})

                    return {
                        "first_name": person.get("first_name"),
                        "last_name": person.get("last_name"),
                        "title": person.get("title"),
                        "company": organization.get("name"),
                        "company_domain": organization.get("website_url"),
                        "phone": person.get("phone_numbers", [{}])[0].get("raw_number"),
                        "linkedin_url": person.get("linkedin_url"),
                        "company_info": {
                            "name": organization.get("name"),
                            "industry": organization.get("industry"),
                            "employees": organization.get("estimated_num_employees"),
                        },
                        "source": "apollo"
                    }

                logger.debug(f"Apollo returned status {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Apollo enrichment failed for {email}: {e}")
            return None

    async def enrich_hunter(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Verify email using Hunter.io API.

        Args:
            email: Email address

        Returns:
            Verification data or None
        """
        if not settings.HUNTER_API_KEY:
            logger.warning("Hunter API key not configured")
            return None

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.hunter.io/v2/email-verifier",
                    params={
                        "email": email,
                        "api_key": settings.HUNTER_API_KEY
                    },
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    verification = data.get("data", {})

                    return {
                        "email_verified": True,
                        "verification_score": verification.get("score"),
                        "verification_status": verification.get("status"),
                        "source": "hunter"
                    }

                return None

        except Exception as e:
            logger.error(f"Hunter verification failed for {email}: {e}")
            return None

    async def enrich_waterfall(self, email: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Enrich email using waterfall strategy.
        Try providers in order until we get data.

        Args:
            email: Email address
            force_refresh: Force refresh cached data

        Returns:
            Combined enriched data
        """
        # Check cache first
        cache_key = f"enrichment:{email}"
        if not force_refresh:
            cached = get_cached(cache_key)
            if cached:
                logger.info(f"Using cached enrichment for {email}")
                return cached

        result = {}

        # Provider priority order
        providers = [
            ("clearbit", self.enrich_clearbit),
            ("apollo", self.enrich_apollo),
            ("hunter", self.enrich_hunter),
        ]

        for provider_name, provider_func in providers:
            try:
                data = await provider_func(email)
                if data:
                    logger.info(f"Enriched {email} using {provider_name}")
                    result.update(data)

                    # If we got substantial data, we can stop
                    if "first_name" in result and "company" in result:
                        break

            except Exception as e:
                logger.error(f"Provider {provider_name} failed: {e}")
                continue

        # Cache result (7 days)
        if result:
            set_cached(cache_key, result, ttl=7 * 24 * 3600)

        return result


# Singleton instance
enrichment_service = EnrichmentService()


async def enrich_email_data(email: str, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Enrich email data using waterfall strategy.

    Args:
        email: Email address
        force_refresh: Force refresh cached data

    Returns:
        Enriched data
    """
    return await enrichment_service.enrich_waterfall(email, force_refresh)


async def enrich_lead_service(lead_id: str, db: Session, force_refresh: bool = False):
    """
    Background task to enrich a lead.

    Args:
        lead_id: Lead UUID
        db: Database session
        force_refresh: Force refresh cached data
    """
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            logger.error(f"Lead {lead_id} not found")
            return

        logger.info(f"Enriching lead: {lead.email}")

        # Enrich
        enriched_data = await enrich_email_data(lead.email, force_refresh)

        if not enriched_data:
            logger.warning(f"No enrichment data found for {lead.email}")
            return

        # Update lead
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

        # Store all enrichment data
        lead.enrichment_data = enriched_data

        # Update status
        if lead.status == "new":
            lead.status = "enriched"

        db.commit()
        logger.info(f"Successfully enriched lead: {lead.email}")

    except Exception as e:
        logger.error(f"Failed to enrich lead {lead_id}: {e}")
        db.rollback()
