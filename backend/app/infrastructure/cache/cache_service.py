"""
Shared cache service with Redis-first strategy and in-memory fallback.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self) -> None:
        self._memory_cache: dict[str, dict[str, Any]] = {}
        self._redis = None
        self._redis_enabled = False
        self._init_redis()

    def _init_redis(self) -> None:
        redis_url = (os.environ.get("REDIS_URL") or "").strip()
        if not redis_url:
            return
        try:
            import redis  # type: ignore

            self._redis = redis.from_url(redis_url, decode_responses=True)
            # Best-effort connectivity check.
            self._redis.ping()
            self._redis_enabled = True
            logger.info("Shared Redis cache enabled")
        except Exception as exc:
            self._redis_enabled = False
            self._redis = None
            logger.warning("Redis unavailable, using in-memory cache fallback: %s", exc)

    def status(self) -> dict[str, Any]:
        backend = "redis" if self._redis_enabled and self._redis is not None else "memory"
        healthy = False
        if backend == "redis":
            try:
                self._redis.ping()
                healthy = True
            except Exception:
                healthy = False
        else:
            healthy = True
        return {
            "backend": backend,
            "healthy": healthy,
            "redis_configured": bool((os.environ.get("REDIS_URL") or "").strip()),
        }

    def get(self, key: str) -> Optional[Any]:
        if self._redis_enabled and self._redis is not None:
            try:
                raw = self._redis.get(key)
                if raw:
                    return json.loads(raw)
            except Exception as exc:
                logger.warning("Redis get failed, falling back to memory cache: %s", exc)

        cached = self._memory_cache.get(key)
        if cached and cached.get("expires_at", 0) > time.time():
            return cached.get("data")
        return None

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        if self._redis_enabled and self._redis is not None:
            try:
                self._redis.setex(key, ttl_seconds, json.dumps(value))
                return
            except Exception as exc:
                logger.warning("Redis set failed, falling back to memory cache: %s", exc)

        self._memory_cache[key] = {
            "expires_at": time.time() + ttl_seconds,
            "data": value,
        }

    def delete(self, key: str) -> None:
        if self._redis_enabled and self._redis is not None:
            try:
                self._redis.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)


cache_service = CacheService()

