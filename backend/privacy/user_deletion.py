"""
User Deletion Service

SECURITY: Implements GDPR Article 17 - Right to Erasure.
Allows users to request complete deletion of their personal data.
"""

from typing import Dict, Any, List
from datetime import datetime
from firestore_db import FirestoreDB
from logging_config import get_logger
from audit_log_utils import log_audit_event

logger = get_logger(__name__)

# Collections containing user data
USER_DATA_COLLECTIONS = {
    'users': {'user_id_field': 'id'},
    'links': {'user_id_field': 'user_id'},
    'items': {'user_id_field': 'user_id'},
    'media': {'user_id_field': 'user_id'},
    'analytics': {'user_id_field': 'user_id'},
    'ring_analytics': {'user_id_field': 'user_id'},
    'qr_scans': {'user_id_field': 'user_id'},
    'appointments': {'user_id_field': 'user_id'},
    'availability': {'user_id_field': 'user_id'},
    'sessions': {'user_id_field': 'user_id'},
    'subscriptions': {'user_id_field': 'user_id'},
    'memberships': {'user_id_field': 'user_id'},
}


class UserDeletionService:
    """
    Service for handling user data deletion requests.
    
    SECURITY: Implements GDPR Right to Erasure (Article 17).
    """
    
    async def delete_user_data(
        self,
        user_id: str,
        actor_id: str,
        ip_address: str,
        user_agent: str
    ) -> Dict[str, Any]:
        """
        Delete all user data.
        
        SECURITY: Permanently deletes all user data across all collections.
        This action is irreversible and should be logged.
        
        Args:
            user_id: ID of user whose data should be deleted
            actor_id: ID of user/admin performing the deletion
            ip_address: IP address of requester
            user_agent: User agent of requester
            
        Returns:
            Dictionary with deletion results
        """
        results = {
            "user_id": user_id,
            "deleted_at": datetime.utcnow().isoformat(),
            "collections": {}
        }
        
        # SECURITY: Log deletion request
        await log_audit_event(
            event_type="user_data_deletion",
            actor_id=actor_id,
            entity_type="user",
            entity_id=user_id,
            details={
                "deletion_requested_by": actor_id,
                "ip_address": ip_address,
                "user_agent": user_agent
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Delete from each collection
        for collection_name, config in USER_DATA_COLLECTIONS.items():
            try:
                collection = FirestoreDB(collection_name)
                user_id_field = config['user_id_field']
                
                # Find all documents for this user
                user_docs = await collection.find({user_id_field: user_id})
                deleted_count = 0
                
                for doc in user_docs:
                    doc_id = doc.get('id') or doc.get('_id')
                    if doc_id:
                        await collection.delete_one({"id": doc_id})
                        deleted_count += 1
                
                results["collections"][collection_name] = {
                    "deleted": deleted_count,
                    "status": "success"
                }
                
                if deleted_count > 0:
                    logger.info(
                        "user_data_deleted",
                        user_id=user_id,
                        collection=collection_name,
                        deleted_count=deleted_count
                    )
            
            except Exception as e:
                logger.error(
                    "user_data_deletion_error",
                    user_id=user_id,
                    collection=collection_name,
                    error=str(e),
                    exc_info=True
                )
                results["collections"][collection_name] = {
                    "deleted": 0,
                    "status": "error",
                    "error": str(e)
                }
        
        # SECURITY: Anonymize ring_id if user had one
        # We keep ring_id but remove user association
        try:
            rings_collection = FirestoreDB('rings')
            ring_docs = await rings_collection.find({"user_id": user_id})
            
            for ring_doc in ring_docs:
                ring_id = ring_doc.get("ring_id")
                if ring_id:
                    # Remove user association but keep ring record
                    await rings_collection.update_one(
                        {"ring_id": ring_id},
                        {
                            "$unset": {"user_id": ""},
                            "$set": {
                                "status": "revoked",
                                "revoked_at": datetime.utcnow(),
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    results["collections"]["rings"] = {
                        "revoked": 1,
                        "status": "success"
                    }
        except Exception as e:
            logger.error(
                "ring_revocation_error",
                user_id=user_id,
                error=str(e)
            )
        
        logger.info(
            "user_data_deletion_complete",
            user_id=user_id,
            actor_id=actor_id,
            results=results
        )
        
        return results
    
    async def anonymize_user_data(
        self,
        user_id: str,
        actor_id: str,
        ip_address: str,
        user_agent: str
    ) -> Dict[str, Any]:
        """
        Anonymize user data instead of deleting.
        
        SECURITY: Replaces PII with anonymized values while preserving
        analytics data for business purposes.
        
        Args:
            user_id: ID of user whose data should be anonymized
            actor_id: ID of user/admin performing the anonymization
            ip_address: IP address of requester
            user_agent: User agent of requester
            
        Returns:
            Dictionary with anonymization results
        """
        results = {
            "user_id": user_id,
            "anonymized_at": datetime.utcnow().isoformat(),
            "collections": {}
        }
        
        # SECURITY: Log anonymization request
        await log_audit_event(
            event_type="user_data_anonymization",
            actor_id=actor_id,
            entity_type="user",
            entity_id=user_id,
            details={
                "anonymization_requested_by": actor_id,
                "ip_address": ip_address,
                "user_agent": user_agent
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Anonymize user document
        try:
            users_collection = FirestoreDB('users')
            await users_collection.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "email": f"deleted_{user_id[:8]}@anonymized.local",
                        "name": "Deleted User",
                        "username": f"deleted_{user_id[:8]}",
                        "bio": "",
                        "profile_image_url": None,
                        "anonymized": True,
                        "anonymized_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            results["collections"]["users"] = {
                "anonymized": True,
                "status": "success"
            }
        except Exception as e:
            logger.error(
                "user_anonymization_error",
                user_id=user_id,
                error=str(e)
            )
            results["collections"]["users"] = {
                "anonymized": False,
                "status": "error",
                "error": str(e)
            }
        
        logger.info(
            "user_data_anonymization_complete",
            user_id=user_id,
            actor_id=actor_id
        )
        
        return results


