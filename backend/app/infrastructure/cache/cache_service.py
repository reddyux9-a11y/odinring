"""
Shared cache service with Redis-first strategy.

Without Redis, the app typically runs multiple worker processes (see
backend/Dockerfile `--workers`), each with its own Python heap. A per-process
in-memory cache can't be invalidated across those processes, so a write on
one worker (e.g. subscription activation after payment) would leave other
workers serving stale reads for the full TTL. To avoid that correctness bug,
caching is a no-op whenever Redis isn't available - every read goes straight
to the source of truth (Firestore) instead of a cache that can't be trusted.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self) -> None:
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
            logger.warning("Redis unavailable, caching disabled: %s", exc)

    def status(self) -> dict[str, Any]:
        backend = "redis" if self._redis_enabled and self._redis is not None else "disabled"
        healthy = False
        if backend == "redis":
            try:
                self._redis.ping()
                healthy = True
            except Exception:
                healthy = False
        return {
            "backend": backend,
            "healthy": healthy,
            "redis_configured": bool((os.environ.get("REDIS_URL") or "").strip()),
        }

    def get(self, key: str) -> Optional[Any]:
        if not (self._redis_enabled and self._redis is not None):
            return None
        try:
            raw = self._redis.get(key)
            if raw:
                return json.loads(raw)
        except Exception as exc:
            logger.warning("Redis get failed: %s", exc)
        return None

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        if not (self._redis_enabled and self._redis is not None):
            return
        try:
            self._redis.setex(key, ttl_seconds, json.dumps(value))
        except Exception as exc:
            logger.warning("Redis set failed: %s", exc)

    def delete(self, key: str) -> None:
        if not (self._redis_enabled and self._redis is not None):
            return
        try:
            self._redis.delete(key)
        except Exception:
            pass


cache_service = CacheService()

