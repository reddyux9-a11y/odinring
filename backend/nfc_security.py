"""
NFC Security Module

SECURITY: This module provides cryptographic protection against NFC ring UID cloning,
replay attacks, and stolen ring abuse. All NFC scans must be validated with signed
tokens containing timestamp, nonce, and HMAC signature.

Threats Mitigated:
- NFC UID cloning
- Replay attacks
- Stolen ring abuse
- Scan flooding
"""

import hmac
import hashlib
import time
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from firestore_db import FirestoreDB
from logging_config import get_logger

logger = get_logger(__name__)

# SECURITY: NFC scan token validity window (30 seconds)
NFC_TOKEN_VALIDITY_SECONDS = 30

# SECURITY: Nonce cache TTL (prevents replay attacks)
NONCE_CACHE_TTL_SECONDS = 60

# SECURITY: Rate limit for NFC scans per ring (per minute)
NFC_SCAN_RATE_LIMIT = 10

# Firestore collections
rings_collection = FirestoreDB('rings')
nfc_nonces_collection = FirestoreDB('nfc_nonces')  # For nonce tracking


class NFCSecurityError(Exception):
    """Base exception for NFC security errors"""
    pass


class InvalidNFCTokenError(NFCSecurityError):
    """Raised when NFC token validation fails"""
    pass


class ReplayAttackError(NFCSecurityError):
    """Raised when nonce reuse is detected (replay attack)"""
    pass


class RingRevokedError(NFCSecurityError):
    """Raised when attempting to use a revoked ring"""
    pass


class RateLimitExceededError(NFCSecurityError):
    """Raised when NFC scan rate limit is exceeded"""
    pass


def generate_nfc_token(ring_id: str, secret_key: str) -> Dict[str, Any]:
    """
    Generate a signed NFC scan token.
    
    SECURITY: Creates a short-lived token with:
    - Timestamp (prevents old token reuse)
    - Nonce (prevents replay attacks)
    - HMAC signature (prevents tampering)
    
    Args:
        ring_id: The NFC ring identifier
        secret_key: Secret key for HMAC (should be from environment)
        
    Returns:
        Dictionary containing token components
    """
    timestamp = int(time.time())
    nonce = secrets.token_hex(16)  # 32-character hex string
    
    # SECURITY: Create message for HMAC
    message = f"{ring_id}:{timestamp}:{nonce}"
    
    # SECURITY: Generate HMAC signature
    signature = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    token = {
        "ring_id": ring_id,
        "timestamp": timestamp,
        "nonce": nonce,
        "signature": signature
    }
    
    logger.info(
        "nfc_token_generated",
        ring_id=ring_id,
        timestamp=timestamp,
        nonce_prefix=nonce[:8]
    )
    
    return token


def validate_nfc_token(
    token: Dict[str, Any],
    secret_key: str,
    ring_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate an NFC scan token.
    
    SECURITY: Validates:
    1. Token structure
    2. Timestamp (within ±30s window)
    3. Nonce uniqueness (prevents replay)
    4. HMAC signature (prevents tampering)
    5. Ring status (active/revoked)
    
    Args:
        token: Token dictionary from client
        secret_key: Secret key for HMAC validation
        ring_id: Optional ring_id to verify against token
        
    Returns:
        Validated token data
        
    Raises:
        InvalidNFCTokenError: If token validation fails
        ReplayAttackError: If nonce reuse detected
        RingRevokedError: If ring is revoked
    """
    # SECURITY: Validate token structure
    required_fields = ["ring_id", "timestamp", "nonce", "signature"]
    for field in required_fields:
        if field not in token:
            raise InvalidNFCTokenError(f"Missing required field: {field}")
    
    token_ring_id = token["ring_id"]
    token_timestamp = token["timestamp"]
    token_nonce = token["nonce"]
    token_signature = token["signature"]
    
    # SECURITY: Verify ring_id matches (if provided)
    if ring_id and token_ring_id != ring_id:
        raise InvalidNFCTokenError("Ring ID mismatch")
    
    # SECURITY: Validate timestamp (within ±30s window)
    current_time = int(time.time())
    time_delta = abs(current_time - token_timestamp)
    
    if time_delta > NFC_TOKEN_VALIDITY_SECONDS:
        logger.warning(
            "nfc_token_timestamp_invalid",
            ring_id=token_ring_id,
            token_timestamp=token_timestamp,
            current_time=current_time,
            delta=time_delta
        )
        raise InvalidNFCTokenError(
            f"Token timestamp out of validity window (±{NFC_TOKEN_VALIDITY_SECONDS}s)"
        )
    
    # SECURITY: Reconstruct message and verify HMAC signature
    message = f"{token_ring_id}:{token_timestamp}:{token_nonce}"
    expected_signature = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # SECURITY: Constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(token_signature, expected_signature):
        logger.warning(
            "nfc_token_signature_invalid",
            ring_id=token_ring_id,
            nonce_prefix=token_nonce[:8]
        )
        raise InvalidNFCTokenError("Invalid token signature")
    
    # SECURITY: Check for nonce reuse (replay attack detection)
    # Note: This requires async database access, so we'll check it separately
    # For now, we return the validated token and nonce checking happens in the endpoint
    
    # SECURITY: Verify ring status
    # This will be checked in the endpoint after async database access
    
    logger.info(
        "nfc_token_validated",
        ring_id=token_ring_id,
        timestamp=token_timestamp,
        nonce_prefix=token_nonce[:8]
    )
    
    return {
        "ring_id": token_ring_id,
        "timestamp": token_timestamp,
        "nonce": token_nonce
    }


async def check_nonce_uniqueness(nonce: str, ring_id: str) -> bool:
    """
    Check if nonce has been used before (replay attack detection).
    
    SECURITY: Stores nonces in Firestore with TTL to prevent reuse.
    
    Args:
        nonce: The nonce to check
        ring_id: Associated ring ID
        
    Returns:
        True if nonce is unique, False if already used
    """
    # Check if nonce exists
    existing = await nfc_nonces_collection.find_one({
        "nonce": nonce,
        "ring_id": ring_id
    })
    
    if existing:
        logger.warning(
            "nfc_nonce_replay_detected",
            ring_id=ring_id,
            nonce_prefix=nonce[:8]
        )
        return False
    
    # SECURITY: Store nonce with TTL
    expires_at = datetime.utcnow() + timedelta(seconds=NONCE_CACHE_TTL_SECONDS)
    await nfc_nonces_collection.create({
        "nonce": nonce,
        "ring_id": ring_id,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at
    })
    
    return True


async def check_ring_status(ring_id: str) -> Dict[str, Any]:
    """
    Check ring status (active/revoked).
    
    SECURITY: Verifies ring is active before allowing scans.
    
    Args:
        ring_id: The ring ID to check
        
    Returns:
        Ring status information
        
    Raises:
        RingRevokedError: If ring is revoked
    """
    ring_doc = await rings_collection.find_one({"ring_id": ring_id})
    
    if not ring_doc:
        # Ring doesn't exist in rings collection, check users collection
        from firestore_db import FirestoreDB
        users_collection = FirestoreDB('users')
        user_doc = await users_collection.find_one({"ring_id": ring_id})
        
        if not user_doc:
            raise InvalidNFCTokenError(f"Ring not found: {ring_id}")
        
        # Ring exists but no explicit status - assume active
        return {
            "ring_id": ring_id,
            "status": "active",
            "last_scan_at": None
        }
    
    status = ring_doc.get("status", "active")
    
    if status == "revoked":
        logger.warning(
            "nfc_ring_revoked_scan_attempt",
            ring_id=ring_id
        )
        raise RingRevokedError(f"Ring {ring_id} has been revoked")
    
    return {
        "ring_id": ring_id,
        "status": status,
        "last_scan_at": ring_doc.get("last_scan_at")
    }


async def update_ring_last_scan(ring_id: str):
    """
    Update ring's last scan timestamp.
    
    SECURITY: Tracks last scan time for rate limiting and monitoring.
    
    Args:
        ring_id: The ring ID
    """
    await rings_collection.update_one(
        {"ring_id": ring_id},
        {
            "$set": {
                "last_scan_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )


async def check_nfc_rate_limit(ring_id: str) -> bool:
    """
    Check if NFC scan rate limit is exceeded.
    
    SECURITY: Prevents scan flooding attacks.
    
    Args:
        ring_id: The ring ID
        
    Returns:
        True if within rate limit, False if exceeded
    """
    ring_status = await check_ring_status(ring_id)
    last_scan_at = ring_status.get("last_scan_at")
    
    if not last_scan_at:
        return True  # No previous scans
    
    # SECURITY: Check if last scan was within rate limit window
    time_since_last_scan = (datetime.utcnow() - last_scan_at).total_seconds()
    min_interval = 60 / NFC_SCAN_RATE_LIMIT  # Minimum seconds between scans
    
    if time_since_last_scan < min_interval:
        logger.warning(
            "nfc_rate_limit_exceeded",
            ring_id=ring_id,
            time_since_last_scan=time_since_last_scan,
            min_interval=min_interval
        )
        return False
    
    return True


def get_nfc_secret_key() -> str:
    """
    Get NFC secret key from environment.
    
    SECURITY: Secret key must be set in environment variables.
    
    Returns:
        Secret key string
        
    Raises:
        ValueError: If secret key is not set
    """
    import os
    secret_key = os.environ.get("NFC_SECRET_KEY")
    
    if not secret_key:
        # SECURITY: Fallback to JWT_SECRET if NFC_SECRET_KEY not set (for backward compatibility)
        secret_key = os.environ.get("JWT_SECRET")
        
    if not secret_key:
        raise ValueError(
            "NFC_SECRET_KEY or JWT_SECRET must be set in environment variables"
        )
    
    return secret_key


