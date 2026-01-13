"""
Unit tests for NFC Security Module

SECURITY: Tests for NFC token generation, validation, and security features
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import time
import hmac
import hashlib
import secrets
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Import NFC security functions (FirestoreDB is mocked in conftest.py)
from nfc_security import (
    generate_nfc_token,
    validate_nfc_token,
    check_nonce_uniqueness,
    check_ring_status,
    update_ring_last_scan,
    check_nfc_rate_limit,
    get_nfc_secret_key,
    NFCSecurityError,
    InvalidNFCTokenError,
    ReplayAttackError,
    RingRevokedError,
    RateLimitExceededError
)


class TestNFCTokenGeneration:
    """Test NFC token generation"""
    
    def test_generate_nfc_token(self):
        """Test basic token generation"""
        ring_id = "RING_123"
        secret_key = "test-secret-key-for-nfc-token-generation"
        
        token = generate_nfc_token(ring_id, secret_key)
        
        assert "ring_id" in token
        assert "timestamp" in token
        assert "nonce" in token
        assert "signature" in token
        assert token["ring_id"] == ring_id
        assert isinstance(token["timestamp"], int)
        assert len(token["nonce"]) == 32  # 16 bytes hex = 32 chars
        assert len(token["signature"]) == 64  # SHA256 hex = 64 chars
    
    def test_generate_nfc_token_unique_nonces(self):
        """Test that each token has unique nonce"""
        ring_id = "RING_123"
        secret_key = "test-secret-key"
        
        token1 = generate_nfc_token(ring_id, secret_key)
        token2 = generate_nfc_token(ring_id, secret_key)
        
        assert token1["nonce"] != token2["nonce"]
    
    def test_generate_nfc_token_timestamp(self):
        """Test token timestamp is current"""
        ring_id = "RING_123"
        secret_key = "test-secret-key"
        
        before = int(time.time())
        token = generate_nfc_token(ring_id, secret_key)
        after = int(time.time())
        
        assert before <= token["timestamp"] <= after


class TestNFCTokenValidation:
    """Test NFC token validation"""
    
    def test_validate_nfc_token_valid(self):
        """Test validation of valid token"""
        ring_id = "RING_123"
        secret_key = "test-secret-key-for-validation"
        
        token = generate_nfc_token(ring_id, secret_key)
        validated = validate_nfc_token(token, secret_key, ring_id)
        
        assert validated["ring_id"] == ring_id
        assert validated["timestamp"] == token["timestamp"]
        assert validated["nonce"] == token["nonce"]
    
    def test_validate_nfc_token_missing_fields(self):
        """Test validation fails with missing fields"""
        secret_key = "test-secret-key"
        
        # Missing ring_id
        with pytest.raises(InvalidNFCTokenError):
            validate_nfc_token({"timestamp": 123, "nonce": "abc", "signature": "def"}, secret_key)
        
        # Missing timestamp
        with pytest.raises(InvalidNFCTokenError):
            validate_nfc_token({"ring_id": "RING_123", "nonce": "abc", "signature": "def"}, secret_key)
    
    def test_validate_nfc_token_expired_timestamp(self):
        """Test validation fails with expired timestamp"""
        ring_id = "RING_123"
        secret_key = "test-secret-key"
        
        # Create token with old timestamp
        old_timestamp = int(time.time()) - 60  # 60 seconds ago
        nonce = secrets.token_hex(16)
        message = f"{ring_id}:{old_timestamp}:{nonce}"
        signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        token = {
            "ring_id": ring_id,
            "timestamp": old_timestamp,
            "nonce": nonce,
            "signature": signature
        }
        
        with pytest.raises(InvalidNFCTokenError):
            validate_nfc_token(token, secret_key, ring_id)
    
    def test_validate_nfc_token_invalid_signature(self):
        """Test validation fails with invalid signature"""
        ring_id = "RING_123"
        secret_key = "test-secret-key"
        
        token = generate_nfc_token(ring_id, secret_key)
        token["signature"] = "invalid_signature"
        
        with pytest.raises(InvalidNFCTokenError):
            validate_nfc_token(token, secret_key, ring_id)
    
    def test_validate_nfc_token_ring_id_mismatch(self):
        """Test validation fails with ring ID mismatch"""
        ring_id = "RING_123"
        secret_key = "test-secret-key"
        
        token = generate_nfc_token(ring_id, secret_key)
        
        with pytest.raises(InvalidNFCTokenError):
            validate_nfc_token(token, secret_key, "RING_456")


@pytest.mark.asyncio
class TestNFCSecurityAsync:
    """Test async NFC security functions"""
    
    async def test_check_nonce_uniqueness_new(self):
        """Test nonce uniqueness check for new nonce"""
        # Mock FirestoreDB collection
        with patch('nfc_security.nfc_nonces_collection') as mock_collection:
            mock_collection.find_one = AsyncMock(return_value=None)
            mock_collection.insert_one = AsyncMock()
            
            result = await check_nonce_uniqueness("new_nonce_123", "RING_123")
            
            assert result is True
            mock_collection.insert_one.assert_called_once()
    
    async def test_check_nonce_uniqueness_replay(self):
        """Test nonce uniqueness check detects replay"""
        # Mock FirestoreDB with existing nonce
        with patch('nfc_security.nfc_nonces_collection') as mock_collection:
            mock_collection.find_one = AsyncMock(return_value={"nonce": "existing_nonce"})
            
            result = await check_nonce_uniqueness("existing_nonce", "RING_123")
            
            assert result is False
    
    async def test_check_ring_status_active(self):
        """Test ring status check for active ring"""
        with patch('nfc_security.rings_collection') as mock_rings:
            mock_rings.find_one = AsyncMock(return_value={
                "ring_id": "RING_123",
                "status": "active"
            })
            
            status = await check_ring_status("RING_123")
            
            assert status["status"] == "active"
            assert status["ring_id"] == "RING_123"
    
    async def test_check_ring_status_revoked(self):
        """Test ring status check for revoked ring"""
        with patch('nfc_security.rings_collection') as mock_rings:
            mock_rings.find_one = AsyncMock(return_value={
                "ring_id": "RING_123",
                "status": "revoked"
            })
            
            with pytest.raises(RingRevokedError):
                await check_ring_status("RING_123")
    
    async def test_update_ring_last_scan(self):
        """Test updating ring last scan timestamp"""
        with patch('nfc_security.rings_collection') as mock_rings:
            mock_rings.update_one = AsyncMock()
            
            await update_ring_last_scan("RING_123")
            
            mock_rings.update_one.assert_called_once()
            call_args = mock_rings.update_one.call_args
            assert call_args[0][0] == {"ring_id": "RING_123"}
    
    async def test_check_nfc_rate_limit_within_limit(self):
        """Test rate limit check when within limit"""
        with patch('nfc_security.check_ring_status') as mock_status:
            mock_status.return_value = {
                "ring_id": "RING_123",
                "status": "active",
                "last_scan_at": datetime.utcnow() - timedelta(seconds=10)
            }
            
            result = await check_nfc_rate_limit("RING_123")
            
            assert result is True
    
    async def test_check_nfc_rate_limit_exceeded(self):
        """Test rate limit check when exceeded"""
        with patch('nfc_security.check_ring_status') as mock_status:
            mock_status.return_value = {
                "ring_id": "RING_123",
                "status": "active",
                "last_scan_at": datetime.utcnow() - timedelta(seconds=2)  # Too recent
            }
            
            result = await check_nfc_rate_limit("RING_123")
            
            assert result is False


class TestNFCSecretKey:
    """Test NFC secret key retrieval"""
    
    def test_get_nfc_secret_key_from_env(self):
        """Test getting secret key from environment"""
        import os
        os.environ["NFC_SECRET_KEY"] = "test-nfc-secret-key"
        
        try:
            key = get_nfc_secret_key()
            assert key == "test-nfc-secret-key"
        finally:
            del os.environ["NFC_SECRET_KEY"]
    
    def test_get_nfc_secret_key_fallback_to_jwt(self):
        """Test fallback to JWT_SECRET if NFC_SECRET_KEY not set"""
        import os
        os.environ["JWT_SECRET"] = "test-jwt-secret-key"
        
        try:
            if "NFC_SECRET_KEY" in os.environ:
                del os.environ["NFC_SECRET_KEY"]
            key = get_nfc_secret_key()
            assert key == "test-jwt-secret-key"
        finally:
            if "JWT_SECRET" in os.environ:
                del os.environ["JWT_SECRET"]
    
    def test_get_nfc_secret_key_missing(self):
        """Test error when no secret key available"""
        import os
        if "NFC_SECRET_KEY" in os.environ:
            del os.environ["NFC_SECRET_KEY"]
        if "JWT_SECRET" in os.environ:
            del os.environ["JWT_SECRET"]
        
        with pytest.raises(ValueError):
            get_nfc_secret_key()

