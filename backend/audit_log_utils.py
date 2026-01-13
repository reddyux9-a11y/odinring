"""
Audit Logging Utility

SECURITY: Provides security-grade audit logging separate from debug logging.
Audit logs are immutable (append-only) and have retention policies for compliance.

Key Features:
- Immutable audit trail
- Retention policy (180 days default)
- Separate from debug logging
- Tamper-aware design
"""

from datetime import datetime, timedelta
from typing import Optional, Any, Dict
import uuid
import logging
from firestore_db import FirestoreDB
from config import settings
from logging_config import get_logger

logger = get_logger(__name__)

# SECURITY: Audit logs collection - separate from debug logs
audit_logs_collection = FirestoreDB('audit_logs')

# SECURITY: Audit log retention period (180 days for compliance)
AUDIT_LOG_RETENTION_DAYS = getattr(settings, 'AUDIT_LOG_RETENTION_DAYS', 180)

# SECURITY: Audit logs are immutable (append-only)
AUDIT_LOG_IMMUTABLE = getattr(settings, 'AUDIT_LOG_IMMUTABLE', True)


class AuditLog:
    """Audit log entry model"""
    
    @staticmethod
    def create_entry(
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        ip_address: Optional[str] = "unknown",
        user_agent: Optional[str] = "unknown",
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success"
    ) -> Dict[str, Any]:
        """
        Create an audit log entry
        
        Args:
            actor_id: ID of the user or admin performing the action
            action: Action performed (e.g., 'login', 'profile_update', 'link_create')
            entity_type: Type of entity affected (e.g., 'user', 'link', 'ring')
            entity_id: ID of the affected entity (optional)
            ip_address: IP address of the request
            user_agent: User agent of the request
            metadata: Additional metadata about the action
            status: Status of the action ('success' or 'failure')
        
        Returns:
            Audit log entry dictionary
        """
        # SECURITY: Create immutable audit log entry
        # Note: Firestore doesn't support true immutability, but we enforce
        # append-only by never updating existing audit logs
        audit_entry = {
            'id': str(uuid.uuid4()),
            'actor_id': actor_id,
            'action': action,
            'entity_type': entity_type,
            'entity_id': entity_id,
            'timestamp': datetime.utcnow(),
            'ip_address': ip_address,
            'user_agent': user_agent,
            'metadata': metadata or {},
            'status': status,
            # SECURITY: Add retention metadata
            'expires_at': datetime.utcnow() + timedelta(days=AUDIT_LOG_RETENTION_DAYS),
            'immutable': AUDIT_LOG_IMMUTABLE
        }
        
        return audit_entry


async def log_audit_event(
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    ip_address: Optional[str] = "unknown",
    user_agent: Optional[str] = "unknown",
    metadata: Optional[Dict[str, Any]] = None,
    status: str = "success"
) -> bool:
    """
    Log an audit event to Firestore
    
    Args:
        actor_id: ID of the user or admin performing the action
        action: Action performed (e.g., 'login', 'profile_update', 'link_create')
        entity_type: Type of entity affected (e.g., 'user', 'link', 'ring')
        entity_id: ID of the affected entity (optional)
        ip_address: IP address of the request
        user_agent: User agent of the request
        metadata: Additional metadata about the action
        status: Status of the action ('success' or 'failure')
    
    Returns:
        True if logged successfully, False otherwise
    """
    try:
        audit_entry = AuditLog.create_entry(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
            status=status
        )
        
        await audit_logs_collection.insert_one(audit_entry)
        logger.info(
            f"Audit log created: action={action}, actor={actor_id}, "
            f"entity={entity_type}:{entity_id}, status={status}"
        )
        return True
        
    except Exception as e:
        # Don't fail the operation if audit logging fails
        # But log the error for monitoring
        logger.error(f"Failed to create audit log: {e}", exc_info=True)
        return False


# Helper functions for common audit events

async def log_login(
    user_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown",
    method: str = "email",
    status: str = "success"
):
    """Log user login event"""
    return await log_audit_event(
        actor_id=user_id,
        action='login',
        entity_type='user',
        entity_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'method': method},
        status=status
    )


async def log_logout(
    user_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown"
):
    """Log user logout event"""
    return await log_audit_event(
        actor_id=user_id,
        action='logout',
        entity_type='user',
        entity_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_profile_update(
    user_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown",
    fields_updated: Optional[list] = None
):
    """Log profile update event"""
    return await log_audit_event(
        actor_id=user_id,
        action='profile_update',
        entity_type='user',
        entity_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'fields_updated': fields_updated or []}
    )


async def log_link_create(
    user_id: str,
    link_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown"
):
    """Log link creation event"""
    return await log_audit_event(
        actor_id=user_id,
        action='link_create',
        entity_type='link',
        entity_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_link_update(
    user_id: str,
    link_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown",
    fields_updated: Optional[list] = None
):
    """Log link update event"""
    return await log_audit_event(
        actor_id=user_id,
        action='link_update',
        entity_type='link',
        entity_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata={'fields_updated': fields_updated or []}
    )


async def log_link_delete(
    user_id: str,
    link_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown"
):
    """Log link deletion event"""
    return await log_audit_event(
        actor_id=user_id,
        action='link_delete',
        entity_type='link',
        entity_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_ring_assign(
    user_id: str,
    ring_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown"
):
    """Log ring assignment event"""
    return await log_audit_event(
        actor_id=user_id,
        action='ring_assign',
        entity_type='ring',
        entity_id=ring_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_ring_unassign(
    user_id: str,
    ring_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown"
):
    """Log ring unassignment event"""
    return await log_audit_event(
        actor_id=user_id,
        action='ring_unassign',
        entity_type='ring',
        entity_id=ring_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


async def log_admin_action(
    admin_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    ip_address: str = "unknown",
    user_agent: str = "unknown",
    metadata: Optional[Dict[str, Any]] = None
):
    """Log admin action"""
    return await log_audit_event(
        actor_id=admin_id,
        action=f"admin_{action}",
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        metadata=metadata
    )


def get_client_ip(request) -> str:
    """
    Extract client IP from request
    Handles proxy headers like X-Forwarded-For
    """
    # Check for proxy headers first
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded.split(',')[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return "unknown"


def get_user_agent(request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")

