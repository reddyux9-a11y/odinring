"""
Connection Pooling Optimizations for Firestore
Implements connection reuse and pooling strategies
"""

import logging
from typing import Optional
from firebase_config import get_firestore_client

logger = logging.getLogger(__name__)

# Global connection pool
_firestore_client_pool: Optional[object] = None
_connection_count = 0
_max_connections = 10

def get_pooled_firestore_client():
    """
    Get Firestore client from connection pool
    Reuses existing connection to reduce overhead
    """
    global _firestore_client_pool, _connection_count
    
    if _firestore_client_pool is None:
        logger.info("Creating new Firestore client connection")
        _firestore_client_pool = get_firestore_client()
        _connection_count = 1
    else:
        _connection_count += 1
    
    return _firestore_client_pool

def reset_connection_pool():
    """Reset connection pool (useful for testing or reconnection)"""
    global _firestore_client_pool, _connection_count
    _firestore_client_pool = None
    _connection_count = 0
    logger.info("Connection pool reset")

def get_connection_stats():
    """Get connection pool statistics"""
    return {
        'active_connections': _connection_count,
        'max_connections': _max_connections,
        'pool_initialized': _firestore_client_pool is not None
    }



