"""
Unit tests for refresh_token_utils.py
Tests token creation, verification, rotation, and revocation
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from backend.refresh_token_utils import (
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    revoke_all_user_refresh_tokens,
    detect_token_reuse,
    cleanup_expired_refresh_tokens
)
import secrets


@pytest.fixture
def mock_refresh_tokens_collection():
    """Mock Firestore refresh_tokens collection"""
    collection = MagicMock()
    collection.insert_one = AsyncMock()
    collection.find_one = AsyncMock()
    collection.update_one = AsyncMock()
    collection.update_many = AsyncMock()
    collection.delete_many = AsyncMock()
    return collection


@pytest.mark.asyncio
async def test_create_refresh_token(mock_refresh_tokens_collection):
    """Test creating a new refresh token"""
    user_id = "user_123"
    session_id = "session_123"
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        token = await create_refresh_token(user_id, session_id)
        
        # Verify token is a valid string
        assert isinstance(token, str)
        assert len(token) > 32  # URL-safe token should be reasonably long
        
        # Verify database insertion
        assert mock_refresh_tokens_collection.insert_one.called
        call_args = mock_refresh_tokens_collection.insert_one.call_args[0][0]
        
        assert call_args['user_id'] == user_id
        assert call_args['session_id'] == session_id
        assert call_args['is_revoked'] is False
        assert 'token_hash' in call_args
        assert 'family_id' in call_args
        assert 'created_at' in call_args
        assert 'expires_at' in call_args


@pytest.mark.asyncio
async def test_verify_refresh_token_valid(mock_refresh_tokens_collection):
    """Test verifying a valid refresh token"""
    token = secrets.token_urlsafe(32)
    user_id = "user_123"
    
    # Mock a valid token in database
    mock_token_doc = {
        'user_id': user_id,
        'token_hash': token,  # In real implementation, this would be hashed
        'is_revoked': False,
        'expires_at': datetime.utcnow() + timedelta(days=7),
        'family_id': 'family_123'
    }
    
    mock_refresh_tokens_collection.find_one.return_value = mock_token_doc
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        result = await verify_refresh_token(token, user_id)
        
        assert result == mock_token_doc


@pytest.mark.asyncio
async def test_verify_refresh_token_revoked(mock_refresh_tokens_collection):
    """Test verifying a revoked token returns None"""
    token = secrets.token_urlsafe(32)
    user_id = "user_123"
    
    mock_token_doc = {
        'user_id': user_id,
        'token_hash': token,
        'is_revoked': True,  # Token is revoked
        'expires_at': datetime.utcnow() + timedelta(days=7)
    }
    
    mock_refresh_tokens_collection.find_one.return_value = mock_token_doc
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        result = await verify_refresh_token(token, user_id)
        
        assert result is None


@pytest.mark.asyncio
async def test_verify_refresh_token_expired(mock_refresh_tokens_collection):
    """Test verifying an expired token returns None"""
    token = secrets.token_urlsafe(32)
    user_id = "user_123"
    
    mock_token_doc = {
        'user_id': user_id,
        'token_hash': token,
        'is_revoked': False,
        'expires_at': datetime.utcnow() - timedelta(days=1)  # Expired
    }
    
    mock_refresh_tokens_collection.find_one.return_value = mock_token_doc
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        result = await verify_refresh_token(token, user_id)
        
        assert result is None


@pytest.mark.asyncio
async def test_revoke_refresh_token(mock_refresh_tokens_collection):
    """Test revoking a refresh token"""
    token = secrets.token_urlsafe(32)
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        await revoke_refresh_token(token)
        
        mock_refresh_tokens_collection.update_one.assert_called_once()
        call_args = mock_refresh_tokens_collection.update_one.call_args[0]
        
        assert 'token_hash' in call_args[0]
        assert call_args[1]['$set']['is_revoked'] is True
        assert 'revoked_at' in call_args[1]['$set']


@pytest.mark.asyncio
async def test_revoke_all_user_refresh_tokens(mock_refresh_tokens_collection):
    """Test revoking all refresh tokens for a user"""
    user_id = "user_123"
    mock_refresh_tokens_collection.update_many.return_value = MagicMock(modified_count=5)
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        count = await revoke_all_user_refresh_tokens(user_id)
        
        assert count == 5
        mock_refresh_tokens_collection.update_many.assert_called_once()
        call_args = mock_refresh_tokens_collection.update_many.call_args[0]
        
        assert call_args[0] == {'user_id': user_id, 'is_revoked': False}
        assert call_args[1]['$set']['is_revoked'] is True


@pytest.mark.asyncio
async def test_detect_token_reuse(mock_refresh_tokens_collection):
    """Test detecting token reuse (security feature)"""
    family_id = "family_123"
    
    # Mock: Token family has other revoked tokens (indicating reuse)
    mock_refresh_tokens_collection.find_one.return_value = {
        'family_id': family_id,
        'is_revoked': True
    }
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        is_reused = await detect_token_reuse(family_id)
        
        assert is_reused is True


@pytest.mark.asyncio
async def test_detect_token_reuse_none(mock_refresh_tokens_collection):
    """Test no token reuse detected"""
    family_id = "family_123"
    
    mock_refresh_tokens_collection.find_one.return_value = None
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        is_reused = await detect_token_reuse(family_id)
        
        assert is_reused is False


@pytest.mark.asyncio
async def test_cleanup_expired_refresh_tokens(mock_refresh_tokens_collection):
    """Test cleaning up expired refresh tokens"""
    mock_refresh_tokens_collection.delete_many.return_value = MagicMock(deleted_count=10)
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        deleted_count = await cleanup_expired_refresh_tokens()
        
        assert deleted_count == 10
        mock_refresh_tokens_collection.delete_many.assert_called_once()
        call_args = mock_refresh_tokens_collection.delete_many.call_args[0][0]
        
        assert 'expires_at' in call_args
        assert '$lt' in call_args['expires_at']


@pytest.mark.asyncio
async def test_token_family_chain(mock_refresh_tokens_collection):
    """Test that token rotation maintains family chain"""
    user_id = "user_123"
    session_id = "session_123"
    
    with patch('backend.refresh_token_utils.refresh_tokens_collection', mock_refresh_tokens_collection):
        # Create first token
        token1 = await create_refresh_token(user_id, session_id)
        first_call_args = mock_refresh_tokens_collection.insert_one.call_args[0][0]
        family_id = first_call_args['family_id']
        
        # Create second token in same family (rotation)
        token2 = await create_refresh_token(user_id, session_id, family_id=family_id)
        second_call_args = mock_refresh_tokens_collection.insert_one.call_args[0][0]
        
        # Verify both tokens share the same family_id
        assert first_call_args['family_id'] == second_call_args['family_id']
