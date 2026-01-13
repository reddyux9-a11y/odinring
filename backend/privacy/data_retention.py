"""
Data Retention Service

SECURITY: Implements GDPR-compliant data retention policies.
Analytics data is automatically purged after retention period (default: 90 days).
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from firestore_db import FirestoreDB
from logging_config import get_logger
from config import settings

logger = get_logger(__name__)

# SECURITY: Default retention period (90 days for GDPR compliance)
DEFAULT_RETENTION_DAYS = getattr(settings, 'DATA_RETENTION_DAYS', 90)

# Collections subject to retention policies
ANALYTICS_COLLECTIONS = [
    'analytics',
    'ring_analytics',
    'qr_scans'
]


class DataRetentionService:
    """
    Service for managing data retention policies.
    
    SECURITY: Ensures compliance with GDPR Article 5(1)(e) - storage limitation.
    """
    
    def __init__(self, retention_days: int = DEFAULT_RETENTION_DAYS):
        """
        Initialize data retention service.
        
        Args:
            retention_days: Number of days to retain data (default: 90)
        """
        self.retention_days = retention_days
        self.cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        logger.info(
            "data_retention_initialized",
            retention_days=retention_days,
            cutoff_date=self.cutoff_date.isoformat()
        )
    
    async def purge_expired_analytics(self) -> Dict[str, int]:
        """
        Purge expired analytics data.
        
        SECURITY: Removes analytics data older than retention period.
        
        Returns:
            Dictionary with collection names and deleted count
        """
        results = {}
        
        for collection_name in ANALYTICS_COLLECTIONS:
            try:
                collection = FirestoreDB(collection_name)
                
                # SECURITY: Find documents older than cutoff date
                # Note: Firestore queries require timestamp field
                # We'll use a timestamp field if available, otherwise skip
                deleted_count = 0
                
                # For analytics collections, we typically have a 'timestamp' field
                if collection_name in ['analytics', 'ring_analytics', 'qr_scans']:
                    # Query for old documents
                    old_docs = await collection.find({
                        "timestamp": {"$lt": self.cutoff_date}
                    })
                    
                    # Delete in batches
                    for doc in old_docs:
                        doc_id = doc.get('id') or doc.get('_id')
                        if doc_id:
                            await collection.delete_one({"id": doc_id})
                            deleted_count += 1
                
                results[collection_name] = deleted_count
                
                if deleted_count > 0:
                    logger.info(
                        "data_retention_purged",
                        collection=collection_name,
                        deleted_count=deleted_count,
                        cutoff_date=self.cutoff_date.isoformat()
                    )
            
            except Exception as e:
                logger.error(
                    "data_retention_purge_error",
                    collection=collection_name,
                    error=str(e),
                    exc_info=True
                )
                results[collection_name] = 0
        
        return results
    
    async def get_retention_stats(self) -> Dict[str, Any]:
        """
        Get statistics about data retention.
        
        Returns:
            Dictionary with retention statistics
        """
        stats = {
            "retention_days": self.retention_days,
            "cutoff_date": self.cutoff_date.isoformat(),
            "collections": {}
        }
        
        for collection_name in ANALYTICS_COLLECTIONS:
            try:
                collection = FirestoreDB(collection_name)
                
                # Count total documents
                total_count = await collection.count_documents({})
                
                # Count expired documents (if timestamp field exists)
                expired_count = 0
                if collection_name in ['analytics', 'ring_analytics', 'qr_scans']:
                    expired_docs = await collection.find({
                        "timestamp": {"$lt": self.cutoff_date}
                    })
                    expired_count = len(list(expired_docs))
                
                stats["collections"][collection_name] = {
                    "total": total_count,
                    "expired": expired_count,
                    "active": total_count - expired_count
                }
            
            except Exception as e:
                logger.error(
                    "data_retention_stats_error",
                    collection=collection_name,
                    error=str(e)
                )
                stats["collections"][collection_name] = {
                    "total": 0,
                    "expired": 0,
                    "active": 0,
                    "error": str(e)
                }
        
        return stats


