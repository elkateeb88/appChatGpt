"""Redis caching utilities."""

import redis
import json
import functools
from typing import Any, Callable, Optional
from app.config import settings


def get_redis_client() -> redis.Redis:
    """Get Redis client instance."""
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis.

    Args:
        ttl: Time to live in seconds (default: 1 hour)
        key_prefix: Prefix for cache key

    Usage:
        @cache_result(ttl=600)
        def expensive_function(arg1, arg2):
            return result
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            redis_client = get_redis_client()
            cached = redis_client.get(cache_key)

            if cached:
                try:
                    return json.loads(cached)
                except json.JSONDecodeError:
                    return cached

            # Execute function
            result = func(*args, **kwargs)

            # Cache result
            try:
                redis_client.setex(cache_key, ttl, json.dumps(result))
            except (TypeError, json.JSONEncodeError):
                # If result is not JSON serializable, store as string
                redis_client.setex(cache_key, ttl, str(result))

            return result

        return wrapper

    return decorator


def invalidate_cache(pattern: str) -> int:
    """
    Invalidate all cache keys matching pattern.

    Args:
        pattern: Redis key pattern (e.g., "lead:*")

    Returns:
        Number of keys deleted
    """
    redis_client = get_redis_client()
    keys = redis_client.keys(pattern)
    if keys:
        return redis_client.delete(*keys)
    return 0


def get_cached(key: str) -> Optional[Any]:
    """Get cached value by key."""
    redis_client = get_redis_client()
    cached = redis_client.get(key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            return cached
    return None


def set_cached(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set cached value with TTL."""
    redis_client = get_redis_client()
    try:
        return redis_client.setex(key, ttl, json.dumps(value))
    except (TypeError, json.JSONEncodeError):
        return redis_client.setex(key, ttl, str(value))
