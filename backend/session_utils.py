"""
Session Management Utility
Handles session lifecycle: creation, validation, invalidation, and expiry
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import uuid
import logging
from firestore_db import FirestoreDB

logger = logging.getLogger(__name__)

# Sessions collection
sessions_collection = FirestoreDB('sessions')


class SessionManager:
    """Manages user sessions with JWT binding"""
    
    @staticmethod
    async def create_session(
        user_id: str,
        token: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown",
        expires_in_hours: int = 168  # 7 days default
    ) -> Dict[str, Any]:
        """
        Create a new session
        
        Args:
            user_id: User ID
            token: JWT access token
            ip_address: Client IP address
            user_agent: Client user agent
            expires_in_hours: Session expiry in hours
        
        Returns:
            Session dictionary
        """
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=expires_in_hours)
        
        session = {
            'id': session_id,
            'user_id': user_id,
            'token': token,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': now,
            'expires_at': expires_at,
            'is_active': True,
            'last_activity': now
        }
        
        try:
            await sessions_collection.insert_one(session)
            logger.info(f"Session created: session_id={session_id}, user_id={user_id}")
            return session
        except Exception as e:
            logger.error(f"Failed to create session: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def get_session(session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session by ID
        
        Args:
            session_id: Session ID
        
        Returns:
            Session dictionary or None if not found
        """
        try:
            return await sessions_collection.find_one({'id': session_id})
        except Exception as e:
            logger.error(f"Failed to get session: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def get_session_by_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Get session by JWT token
        
        Args:
            token: JWT access token
        
        Returns:
            Session dictionary or None if not found
        """
        try:
            return await sessions_collection.find_one({'token': token})
        except Exception as e:
            logger.error(f"Failed to get session by token: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def validate_session(session_id: str) -> bool:
        """
        Validate if session is active and not expired
        
        Args:
            session_id: Session ID
        
        Returns:
            True if session is valid, False otherwise
        """
        try:
            session = await SessionManager.get_session(session_id)
            
            if not session:
                logger.warning(f"Session not found: {session_id}")
                return False
            
            # Check if session is active
            if not session.get('is_active', False):
                logger.warning(f"Session is inactive: {session_id}")
                return False
            
            # Check if session is expired
            expires_at = session.get('expires_at')
            if expires_at:
                # Ensure timezone-aware comparison
                now = datetime.now(timezone.utc)
                # Convert expires_at to timezone-aware if it's naive
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if now > expires_at:
                    logger.warning(f"Session expired: {session_id}")
                    # Auto-invalidate expired session
                    await SessionManager.invalidate_session(session_id)
                    return False
            
            # Update last activity
            await SessionManager.update_last_activity(session_id)
            return True
            
        except Exception as e:
            logger.error(f"Failed to validate session: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def invalidate_session(session_id: str) -> bool:
        """
        Invalidate a session (logout)
        
        Args:
            session_id: Session ID
        
        Returns:
            True if invalidated successfully
        """
        try:
            result = await sessions_collection.update_one(
                {'id': session_id},
                {'$set': {'is_active': False, 'invalidated_at': datetime.utcnow()}}
            )
            
            if result.get('modified_count', 0) > 0:
                logger.info(f"Session invalidated: {session_id}")
                return True
            
            logger.warning(f"Session not found for invalidation: {session_id}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to invalidate session: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def invalidate_user_sessions(user_id: str) -> int:
        """
        Invalidate all sessions for a user
        
        Args:
            user_id: User ID
        
        Returns:
            Number of sessions invalidated
        """
        try:
            sessions = await sessions_collection.find({'user_id': user_id, 'is_active': True})
            count = 0
            
            for session in sessions:
                if await SessionManager.invalidate_session(session['id']):
                    count += 1
            
            logger.info(f"Invalidated {count} sessions for user: {user_id}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to invalidate user sessions: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def update_last_activity(session_id: str) -> bool:
        """
        Update session last activity timestamp
        
        Args:
            session_id: Session ID
        
        Returns:
            True if updated successfully
        """
        try:
            await sessions_collection.update_one(
                {'id': session_id},
                {'$set': {'last_activity': datetime.utcnow()}}
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update last activity: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def cleanup_expired_sessions() -> int:
        """
        Clean up expired sessions (can be run periodically)
        
        Returns:
            Number of sessions cleaned up
        """
        try:
            now = datetime.utcnow()
            expired_sessions = await sessions_collection.find({
                'expires_at': {'$lt': now},
                'is_active': True
            })
            
            count = 0
            for session in expired_sessions:
                if await SessionManager.invalidate_session(session['id']):
                    count += 1
            
            logger.info(f"Cleaned up {count} expired sessions")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired sessions: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def get_active_sessions(user_id: str) -> list:
        """
        Get all active sessions for a user
        
        Args:
            user_id: User ID
        
        Returns:
            List of active sessions
        """
        try:
            return await sessions_collection.find({
                'user_id': user_id,
                'is_active': True
            })
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}", exc_info=True)
            return []

