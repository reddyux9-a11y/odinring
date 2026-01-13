"""
Refresh Token Management Utility
Handles secure refresh token generation, storage, validation, and rotation
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import uuid
import secrets
import hashlib
import logging
from firestore_db import FirestoreDB

logger = logging.getLogger(__name__)

# Refresh tokens collection
refresh_tokens_collection = FirestoreDB('refresh_tokens')


class RefreshTokenManager:
    """Manages refresh tokens with secure hashing and rotation"""
    
    # Token configuration
    TOKEN_LENGTH = 64  # 64 bytes = 512 bits
    REFRESH_TOKEN_EXPIRY_DAYS = 7
    ACCESS_TOKEN_EXPIRY_MINUTES = 15
    
    @staticmethod
    def hash_token(token: str) -> str:
        """
        Hash a refresh token using SHA-256
        
        Args:
            token: Raw refresh token
        
        Returns:
            Hashed token (hex digest)
        """
        return hashlib.sha256(token.encode()).hexdigest()
    
    @staticmethod
    def generate_refresh_token() -> str:
        """
        Generate a cryptographically secure refresh token
        
        Returns:
            Random token string
        """
        return secrets.token_urlsafe(RefreshTokenManager.TOKEN_LENGTH)
    
    @staticmethod
    async def create_refresh_token(
        user_id: str,
        session_id: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown"
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Create a new refresh token
        
        Args:
            user_id: User ID
            session_id: Associated session ID
            ip_address: Client IP address
            user_agent: Client user agent
        
        Returns:
            Tuple of (raw_token, token_record)
        """
        # Generate raw token
        raw_token = RefreshTokenManager.generate_refresh_token()
        
        # Hash token for storage
        token_hash = RefreshTokenManager.hash_token(raw_token)
        
        # Create token record
        token_id = str(uuid.uuid4())
        now = datetime.utcnow()
        expires_at = now + timedelta(days=RefreshTokenManager.REFRESH_TOKEN_EXPIRY_DAYS)
        
        token_record = {
            'id': token_id,
            'user_id': user_id,
            'session_id': session_id,
            'token_hash': token_hash,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': now,
            'expires_at': expires_at,
            'is_active': True,
            'is_rotated': False,
            'last_used': now
        }
        
        try:
            await refresh_tokens_collection.insert_one(token_record)
            logger.info(f"Refresh token created: token_id={token_id}, user_id={user_id}")
            return raw_token, token_record
        except Exception as e:
            logger.error(f"Failed to create refresh token: {e}", exc_info=True)
            raise
    
    @staticmethod
    async def validate_refresh_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a refresh token
        
        Args:
            token: Raw refresh token
        
        Returns:
            Token record if valid, None otherwise
        """
        try:
            # Hash the provided token
            token_hash = RefreshTokenManager.hash_token(token)
            
            # Find token record
            token_record = await refresh_tokens_collection.find_one({'token_hash': token_hash})
            
            if not token_record:
                logger.warning("Refresh token not found")
                return None
            
            # Check if token is active
            if not token_record.get('is_active', False):
                logger.warning(f"Refresh token is inactive: {token_record['id']}")
                return None
            
            # Check if token has been rotated
            if token_record.get('is_rotated', False):
                logger.warning(f"Refresh token has been rotated: {token_record['id']}")
                # Security: If a rotated token is used, invalidate all user tokens
                await RefreshTokenManager.invalidate_user_tokens(token_record['user_id'])
                return None
            
            # Check if token is expired
            expires_at = token_record.get('expires_at')
            if expires_at:
                # Ensure timezone-aware comparison
                now = datetime.now(timezone.utc)
                # Convert expires_at to timezone-aware if it's naive
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                
                if now > expires_at:
                    logger.warning(f"Refresh token expired: {token_record['id']}")
                    await RefreshTokenManager.invalidate_token(token_record['id'])
                    return None
            
            # Update last used timestamp
            await refresh_tokens_collection.update_one(
                {'id': token_record['id']},
                {'$set': {'last_used': datetime.utcnow()}}
            )
            
            return token_record
            
        except Exception as e:
            logger.error(f"Failed to validate refresh token: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def rotate_refresh_token(
        old_token: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown"
    ) -> Optional[Tuple[str, str, Dict[str, Any]]]:
        """
        Rotate a refresh token (invalidate old, create new)
        
        Args:
            old_token: Old raw refresh token
            ip_address: Client IP address
            user_agent: Client user agent
        
        Returns:
            Tuple of (new_token, new_access_token, token_record) or None if invalid
        """
        try:
            # Validate old token
            old_token_record = await RefreshTokenManager.validate_refresh_token(old_token)
            
            if not old_token_record:
                logger.warning("Cannot rotate invalid refresh token")
                return None
            
            user_id = old_token_record['user_id']
            session_id = old_token_record['session_id']
            
            # Mark old token as rotated
            await refresh_tokens_collection.update_one(
                {'id': old_token_record['id']},
                {'$set': {'is_rotated': True, 'is_active': False, 'rotated_at': datetime.utcnow()}}
            )
            
            # Create new refresh token
            new_token, new_token_record = await RefreshTokenManager.create_refresh_token(
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            logger.info(f"Refresh token rotated for user: {user_id}")
            
            # Return new token and token record (access token will be created by caller)
            return new_token, new_token_record
            
        except Exception as e:
            logger.error(f"Failed to rotate refresh token: {e}", exc_info=True)
            return None
    
    @staticmethod
    async def invalidate_token(token_id: str) -> bool:
        """
        Invalidate a specific refresh token
        
        Args:
            token_id: Token ID
        
        Returns:
            True if invalidated successfully
        """
        try:
            result = await refresh_tokens_collection.update_one(
                {'id': token_id},
                {'$set': {'is_active': False, 'invalidated_at': datetime.utcnow()}}
            )
            
            if result.get('modified_count', 0) > 0:
                logger.info(f"Refresh token invalidated: {token_id}")
                return True
            
            logger.warning(f"Refresh token not found for invalidation: {token_id}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to invalidate refresh token: {e}", exc_info=True)
            return False
    
    @staticmethod
    async def invalidate_user_tokens(user_id: str) -> int:
        """
        Invalidate all refresh tokens for a user
        
        Args:
            user_id: User ID
        
        Returns:
            Number of tokens invalidated
        """
        try:
            tokens = await refresh_tokens_collection.find({'user_id': user_id, 'is_active': True})
            count = 0
            
            for token in tokens:
                if await RefreshTokenManager.invalidate_token(token['id']):
                    count += 1
            
            logger.info(f"Invalidated {count} refresh tokens for user: {user_id}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to invalidate user refresh tokens: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def invalidate_session_tokens(session_id: str) -> int:
        """
        Invalidate all refresh tokens for a session
        
        Args:
            session_id: Session ID
        
        Returns:
            Number of tokens invalidated
        """
        try:
            tokens = await refresh_tokens_collection.find({'session_id': session_id, 'is_active': True})
            count = 0
            
            for token in tokens:
                if await RefreshTokenManager.invalidate_token(token['id']):
                    count += 1
            
            logger.info(f"Invalidated {count} refresh tokens for session: {session_id}")
            return count
            
        except Exception as e:
            logger.error(f"Failed to invalidate session refresh tokens: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def cleanup_expired_tokens() -> int:
        """
        Clean up expired refresh tokens (can be run periodically)
        
        Returns:
            Number of tokens cleaned up
        """
        try:
            now = datetime.utcnow()
            expired_tokens = await refresh_tokens_collection.find({
                'expires_at': {'$lt': now},
                'is_active': True
            })
            
            count = 0
            for token in expired_tokens:
                if await RefreshTokenManager.invalidate_token(token['id']):
                    count += 1
            
            logger.info(f"Cleaned up {count} expired refresh tokens")
            return count
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired refresh tokens: {e}", exc_info=True)
            return 0
    
    @staticmethod
    async def get_user_tokens(user_id: str, active_only: bool = True) -> list:
        """
        Get all refresh tokens for a user
        
        Args:
            user_id: User ID
            active_only: Only return active tokens
        
        Returns:
            List of token records
        """
        try:
            query = {'user_id': user_id}
            if active_only:
                query['is_active'] = True
            
            return await refresh_tokens_collection.find(query)
        except Exception as e:
            logger.error(f"Failed to get user refresh tokens: {e}", exc_info=True)
            return []

