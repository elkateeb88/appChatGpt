"""Rate limiting utilities using Redis."""

from fastapi import HTTPException, Request
from app.config import settings
from app.utils.cache import get_redis_client


def rate_limit_key(identifier: str, endpoint: str) -> str:
    """Generate rate limit key."""
    return f"rate_limit:{endpoint}:{identifier}"


def check_rate_limit(
    identifier: str,
    endpoint: str,
    max_requests: int = None,
    window_seconds: int = None
) -> bool:
    """
    Check if request is within rate limit.

    Args:
        identifier: Unique identifier (e.g., user ID, IP address)
        endpoint: API endpoint name
        max_requests: Maximum requests allowed (default: from settings)
        window_seconds: Time window in seconds (default: from settings)

    Returns:
        True if within limit, False otherwise
    """
    if not settings.RATE_LIMIT_ENABLED:
        return True

    max_requests = max_requests or settings.RATE_LIMIT_REQUESTS
    window_seconds = window_seconds or settings.RATE_LIMIT_PERIOD

    redis_client = get_redis_client()
    key = rate_limit_key(identifier, endpoint)

    # Increment counter
    current = redis_client.incr(key)

    # Set expiry on first request
    if current == 1:
        redis_client.expire(key, window_seconds)

    return current <= max_requests


def rate_limiter(max_requests: int = None, window_seconds: int = None):
    """
    Decorator for rate limiting endpoints.

    Usage:
        @app.get("/api/endpoint")
        @rate_limiter(max_requests=10, window_seconds=60)
        async def endpoint(request: Request):
            return {"message": "success"}
    """

    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            # Use IP address as identifier
            identifier = request.client.host
            endpoint = request.url.path

            if not check_rate_limit(identifier, endpoint, max_requests, window_seconds):
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again later."
                )

            return await func(request, *args, **kwargs)

        return wrapper

    return decorator


def get_rate_limit_status(identifier: str, endpoint: str) -> dict:
    """
    Get current rate limit status.

    Returns:
        dict with remaining requests and reset time
    """
    redis_client = get_redis_client()
    key = rate_limit_key(identifier, endpoint)

    current = int(redis_client.get(key) or 0)
    ttl = redis_client.ttl(key)

    max_requests = settings.RATE_LIMIT_REQUESTS

    return {
        "limit": max_requests,
        "remaining": max(0, max_requests - current),
        "reset_in_seconds": ttl if ttl > 0 else 0
    }
