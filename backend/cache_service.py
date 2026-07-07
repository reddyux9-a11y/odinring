"""
Caching Service for OdinRing
Provides Redis caching for performance optimization.

Without Redis, the app runs multiple worker processes (see backend/Dockerfile
`--workers`), each with its own heap. A per-process in-memory cache can't be
invalidated across those processes: a write in one worker (e.g. activating a
subscription after payment) only clears that worker's own copy, so other
workers keep serving stale data for the full TTL (up to 5 minutes for the
'subscriptions' collection). To avoid that correctness bug, caching is a
no-op whenever Redis isn't available - every read goes straight to Firestore.
"""

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Try to import Redis; caching is disabled entirely if it's unavailable/unconfigured
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, caching disabled")


class CacheService:
    """
    Redis-backed caching service. No-ops when Redis isn't configured.
    """
    
    def __init__(self):
        self.redis_client = None
        self.use_redis = False

        # Try to initialize Redis
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv('REDIS_URL', '')
                if not redis_url:
                    raise ValueError("REDIS_URL not configured")
                redis_password = os.getenv('REDIS_PASSWORD')

                # Parse Redis URL
                if redis_url.startswith('redis://'):
                    # Extract host and port
                    parts = redis_url.replace('redis://', '').split(':')
                    host = parts[0] if len(parts) > 0 else 'localhost'
                    port = int(parts[1]) if len(parts) > 1 else 6379

                    self.redis_client = redis.Redis(
                        host=host,
                        port=port,
                        password=redis_password,
                        decode_responses=True,
                        socket_connect_timeout=2,
                        socket_timeout=2
                    )

                    # Test connection
                    self.redis_client.ping()
                    self.use_redis = True
                    logger.info("✅ Redis cache initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️  Redis not available, caching disabled: {e}")
                self.use_redis = False
                self.redis_client = None

        if not self.use_redis:
            logger.info("📦 Caching disabled (Redis not configured) - reads go straight to the database")
    
    def _serialize(self, value: Any) -> str:
        """Serialize value to JSON string"""
        return json.dumps(value, default=str)
    
    def _deserialize(self, value: str) -> Any:
        """Deserialize JSON string to value"""
        return json.loads(value)
    
    def _make_key(self, collection: str, key: str) -> str:
        """Create cache key from collection and key"""
        return f"odinring:{collection}:{key}"
    
    def get(self, collection: str, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            collection: Collection name (e.g., 'users', 'links')
            key: Cache key (e.g., user_id, link_id)
        
        Returns:
            Cached value or None if not found/expired
        """
        if not (self.use_redis and self.redis_client):
            return None

        cache_key = self._make_key(collection, key)
        try:
            value = self.redis_client.get(cache_key)
            if value:
                return self._deserialize(value)
            return None
        except Exception as e:
            logger.warning(f"Cache get error: {e}, falling back to database")
            return None
    
    def set(self, collection: str, key: str, value: Any, ttl: Optional[int] = None):
        """
        Set value in cache
        
        Args:
            collection: Collection name
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None = no expiration)
        """
        if not (self.use_redis and self.redis_client):
            return

        cache_key = self._make_key(collection, key)
        try:
            serialized = self._serialize(value)
            if ttl:
                self.redis_client.setex(cache_key, ttl, serialized)
            else:
                self.redis_client.set(cache_key, serialized)
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def delete(self, collection: str, key: str):
        """Delete key from cache"""
        if not (self.use_redis and self.redis_client):
            return

        cache_key = self._make_key(collection, key)
        try:
            self.redis_client.delete(cache_key)
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
    
    def delete_pattern(self, collection: str, pattern: str):
        """Delete all keys matching pattern in collection"""
        if not (self.use_redis and self.redis_client):
            return

        cache_key_pattern = self._make_key(collection, pattern)
        try:
            # Use SCAN to find matching keys
            cursor = 0
            while True:
                cursor, keys = self.redis_client.scan(
                    cursor=cursor,
                    match=cache_key_pattern.replace('*', '*'),
                    count=100
                )
                if keys:
                    self.redis_client.delete(*keys)
                if cursor == 0:
                    break
        except Exception as e:
            logger.warning(f"Cache delete pattern error: {e}")
    
    def clear_collection(self, collection: str):
        """Clear all cache entries for a collection"""
        self.delete_pattern(collection, '*')
    
    def exists(self, collection: str, key: str) -> bool:
        """Check if key exists in cache"""
        if not (self.use_redis and self.redis_client):
            return False

        cache_key = self._make_key(collection, key)
        try:
            return bool(self.redis_client.exists(cache_key))
        except Exception as e:
            logger.warning(f"Cache exists error: {e}")
            return False


# Global cache instance
_cache_instance: Optional[CacheService] = None

def get_cache() -> CacheService:
    """Get global cache instance"""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance


# Cache TTL constants (in seconds)
CACHE_TTL = {
    'users': 300,  # 5 minutes - user profiles change infrequently
    'links': 180,  # 3 minutes - links may change more often
    'rings': 600,  # 10 minutes - ring settings rarely change
    'items': 180,  # 3 minutes - merchant items
    'subscriptions': 300,  # 5 minutes - subscription data
    'default': 180  # 3 minutes default
}



