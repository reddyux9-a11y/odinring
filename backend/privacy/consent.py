"""
Consent Management Service

SECURITY: Implements GDPR Article 7 - Conditions for consent.
Manages user consent for data processing, analytics, and marketing.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from firestore_db import FirestoreDB
from logging_config import get_logger

logger = get_logger(__name__)

# Consent types
CONSENT_TYPES = {
    "analytics": "Analytics tracking",
    "marketing": "Marketing communications",
    "data_sharing": "Data sharing with third parties",
    "cookies": "Cookie usage"
}


class ConsentManager:
    """
    Service for managing user consent.
    
    SECURITY: Ensures GDPR-compliant consent management.
    """
    
    def __init__(self):
        self.consents_collection = FirestoreDB('user_consents')
    
    async def record_consent(
        self,
        user_id: str,
        consent_type: str,
        granted: bool,
        ip_address: str,
        user_agent: str
    ) -> Dict[str, Any]:
        """
        Record user consent.
        
        SECURITY: Records consent with timestamp, IP, and user agent for audit.
        
        Args:
            user_id: ID of user
            consent_type: Type of consent (analytics, marketing, etc.)
            granted: Whether consent was granted
            ip_address: IP address of user
            user_agent: User agent of user
            
        Returns:
            Consent record
        """
        if consent_type not in CONSENT_TYPES:
            raise ValueError(f"Invalid consent type: {consent_type}")
        
        consent_record = {
            "id": f"{user_id}_{consent_type}_{int(datetime.utcnow().timestamp())}",
            "user_id": user_id,
            "consent_type": consent_type,
            "granted": granted,
            "recorded_at": datetime.utcnow(),
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        await self.consents_collection.create(consent_record)
        
        logger.info(
            "consent_recorded",
            user_id=user_id,
            consent_type=consent_type,
            granted=granted
        )
        
        return consent_record
    
    async def get_user_consent(
        self,
        user_id: str,
        consent_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get user's current consent status.
        
        Args:
            user_id: ID of user
            consent_type: Type of consent to check
            
        Returns:
            Most recent consent record, or None if no consent recorded
        """
        consents = await self.consents_collection.find({
            "user_id": user_id,
            "consent_type": consent_type
        })
        
        if not consents:
            return None
        
        # Return most recent consent
        sorted_consents = sorted(
            consents,
            key=lambda x: x.get("recorded_at", datetime.min),
            reverse=True
        )
        
        return sorted_consents[0] if sorted_consents else None
    
    async def has_consent(
        self,
        user_id: str,
        consent_type: str
    ) -> bool:
        """
        Check if user has granted consent.
        
        SECURITY: Returns True only if most recent consent was granted.
        
        Args:
            user_id: ID of user
            consent_type: Type of consent to check
            
        Returns:
            True if consent granted, False otherwise
        """
        consent = await self.get_user_consent(user_id, consent_type)
        
        if not consent:
            return False  # No consent recorded = no consent
        
        return consent.get("granted", False)
    
    async def require_consent_before_tracking(
        self,
        user_id: str,
        tracking_type: str = "analytics"
    ) -> bool:
        """
        Check if consent is required and granted before tracking.
        
        SECURITY: Enforces consent before analytics tracking.
        
        Args:
            user_id: ID of user
            tracking_type: Type of tracking (default: analytics)
            
        Returns:
            True if tracking allowed, False if consent required but not granted
        """
        # SECURITY: Analytics tracking requires consent
        if tracking_type == "analytics":
            return await self.has_consent(user_id, "analytics")
        
        # Default: allow if no specific consent required
        return True


