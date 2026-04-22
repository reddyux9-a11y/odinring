"""
Unit tests for authentication functions
"""
import pytest
from app.core.security import hash_password, verify_password, create_jwt_token, verify_jwt_token


class TestAuthentication:
    """Test authentication-related functions"""
    
    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert hashed != password
        assert isinstance(hashed, bytes)
        assert verify_password(password, hashed)
        assert not verify_password("wrong_password", hashed)
    
    def test_jwt_token_creation(self):
        """Test JWT token creation"""
        user_id = "test-user-123"
        token = create_jwt_token(user_id)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50
    
    def test_jwt_token_verification(self):
        """Test JWT token verification"""
        user_id = "test-user-123"
        token = create_jwt_token(user_id)
        
        verified_user_id = verify_jwt_token(token)
        assert verified_user_id == user_id
    
    def test_jwt_token_invalid(self):
        """Test invalid JWT token"""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException):
            verify_jwt_token("invalid.token.here")
    
    def test_password_hashing_consistency(self):
        """Test that same password produces different hashes (salt)"""
        password = "test_password_123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Different salts mean different hashes
        assert hash1 != hash2
        # But both should verify the password
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


