"""
Caching Service for OdinRing
Provides Redis caching with in-memory fallback for performance optimization
"""

import json
import logging
import os
from typing import Any, Optional, Dict
from datetime import timedelta
import hashlib
import time

logger = logging.getLogger(__name__)

# Try to import Redis, fall back to in-memory if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")

class InMemoryCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._max_size = 10000  # Maximum number of entries
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        if entry['expires_at'] and time.time() > entry['expires_at']:
            # Expired, remove it
            del self._cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with optional TTL"""
        # If cache is full, remove oldest entries
        if len(self._cache) >= self._max_size:
            # Remove 10% of oldest entries
            sorted_entries = sorted(
                self._cache.items(),
                key=lambda x: x[1].get('created_at', 0)
            )
            to_remove = len(sorted_entries) // 10
            for i in range(to_remove):
                del self._cache[sorted_entries[i][0]]
        
        expires_at = None
        if ttl:
            expires_at = time.time() + ttl
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': time.time()
        }
    
    def delete(self, key: str):
        """Delete key from cache"""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self):
        """Clear all cache entries"""
        self._cache.clear()
    
    def exists(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        if key not in self._cache:
            return False
        
        entry = self._cache[key]
        if entry['expires_at'] and time.time() > entry['expires_at']:
            del self._cache[key]
            return False
        
        return True


class CacheService:
    """
    Unified caching service with Redis support and in-memory fallback
    """
    
    def __init__(self):
        self.redis_client = None
        self.in_memory_cache = InMemoryCache()
        self.use_redis = False
        
        # Try to initialize Redis
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
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
                logger.warning(f"⚠️  Redis not available, using in-memory cache: {e}")
                self.use_redis = False
        
        if not self.use_redis:
            logger.info("📦 Using in-memory cache (Redis not configured)")
    
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
        cache_key = self._make_key(collection, key)
        
        try:
            if self.use_redis and self.redis_client:
                value = self.redis_client.get(cache_key)
                if value:
                    return self._deserialize(value)
            else:
                return self.in_memory_cache.get(cache_key)
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
        cache_key = self._make_key(collection, key)
        
        try:
            if self.use_redis and self.redis_client:
                serialized = self._serialize(value)
                if ttl:
                    self.redis_client.setex(cache_key, ttl, serialized)
                else:
                    self.redis_client.set(cache_key, serialized)
            else:
                self.in_memory_cache.set(cache_key, value, ttl)
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
    
    def delete(self, collection: str, key: str):
        """Delete key from cache"""
        cache_key = self._make_key(collection, key)
        
        try:
            if self.use_redis and self.redis_client:
                self.redis_client.delete(cache_key)
            else:
                self.in_memory_cache.delete(cache_key)
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
    
    def delete_pattern(self, collection: str, pattern: str):
        """Delete all keys matching pattern in collection"""
        cache_key_pattern = self._make_key(collection, pattern)
        
        try:
            if self.use_redis and self.redis_client:
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
            else:
                # For in-memory, we need to check each key
                prefix = cache_key_pattern.replace('*', '')
                keys_to_delete = [
                    key for key in self.in_memory_cache._cache.keys()
                    if key.startswith(prefix)
                ]
                for key in keys_to_delete:
                    self.in_memory_cache.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete pattern error: {e}")
    
    def clear_collection(self, collection: str):
        """Clear all cache entries for a collection"""
        self.delete_pattern(collection, '*')
    
    def exists(self, collection: str, key: str) -> bool:
        """Check if key exists in cache"""
        cache_key = self._make_key(collection, key)
        
        try:
            if self.use_redis and self.redis_client:
                return bool(self.redis_client.exists(cache_key))
            else:
                return self.in_memory_cache.exists(cache_key)
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



