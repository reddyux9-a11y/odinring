"""
Privacy & GDPR Compliance Module

SECURITY: This module provides GDPR-compliant data handling including:
- Data retention policies
- User-triggered data deletion (Right to Erasure)
- Consent management
- Privacy controls
"""

from .data_retention import DataRetentionService
from .user_deletion import UserDeletionService
from .consent import ConsentManager

__all__ = [
    "DataRetentionService",
    "UserDeletionService",
    "ConsentManager"
]


