"""
Unit tests for session_utils.py
Tests session creation, validation, invalidation, and cleanup
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from backend.session_utils import (
    create_session,
    get_session,
    invalidate_session,
    cleanup_expired_sessions,
    get_active_sessions,
    invalidate_all_user_sessions
)


@pytest.fixture
def mock_sessions_collection():
    """Mock Firestore sessions collection"""
    collection = MagicMock()
    collection.insert_one = AsyncMock()
    collection.find_one = AsyncMock()
    collection.update_one = AsyncMock()
    collection.find = AsyncMock()
    collection.delete_many = AsyncMock()
    return collection


@pytest.mark.asyncio
async def test_create_session(mock_sessions_collection):
    """Test creating a new session"""
    user_id = "test_user_123"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        session_id = await create_session(user_id, ip_address, user_agent)
        
        # Verify session was inserted
        assert mock_sessions_collection.insert_one.called
        call_args = mock_sessions_collection.insert_one.call_args[0][0]
        
        assert call_args['user_id'] == user_id
        assert call_args['ip_address'] == ip_address
        assert call_args['user_agent'] == user_agent
        assert call_args['is_active'] is True
        assert 'session_id' in call_args
        assert 'created_at' in call_args
        assert 'expires_at' in call_args
        assert session_id == call_args['session_id']


@pytest.mark.asyncio
async def test_get_session_valid(mock_sessions_collection):
    """Test getting a valid active session"""
    session_id = "session_123"
    mock_session = {
        'session_id': session_id,
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    
    mock_sessions_collection.find_one.return_value = mock_session
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        result = await get_session(session_id)
        
        assert result == mock_session
        mock_sessions_collection.find_one.assert_called_once_with({
            'session_id': session_id,
            'is_active': True
        })


@pytest.mark.asyncio
async def test_get_session_expired(mock_sessions_collection):
    """Test getting an expired session returns None"""
    session_id = "expired_session_123"
    mock_session = {
        'session_id': session_id,
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() - timedelta(hours=1)  # Expired
    }
    
    mock_sessions_collection.find_one.return_value = mock_session
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        result = await get_session(session_id)
        
        assert result is None


@pytest.mark.asyncio
async def test_get_session_not_found(mock_sessions_collection):
    """Test getting a non-existent session"""
    mock_sessions_collection.find_one.return_value = None
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        result = await get_session("nonexistent_session")
        
        assert result is None


@pytest.mark.asyncio
async def test_invalidate_session(mock_sessions_collection):
    """Test invalidating a session"""
    session_id = "session_to_invalidate"
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        await invalidate_session(session_id)
        
        mock_sessions_collection.update_one.assert_called_once()
        call_args = mock_sessions_collection.update_one.call_args
        
        assert call_args[0][0] == {'session_id': session_id}
        assert call_args[0][1]['$set']['is_active'] is False
        assert 'last_activity' in call_args[0][1]['$set']


@pytest.mark.asyncio
async def test_cleanup_expired_sessions(mock_sessions_collection):
    """Test cleaning up expired sessions"""
    mock_sessions_collection.delete_many.return_value = MagicMock(deleted_count=5)
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        deleted_count = await cleanup_expired_sessions()
        
        assert deleted_count == 5
        mock_sessions_collection.delete_many.assert_called_once()
        call_args = mock_sessions_collection.delete_many.call_args[0][0]
        
        assert 'expires_at' in call_args
        assert '$lt' in call_args['expires_at']


@pytest.mark.asyncio
async def test_get_active_sessions(mock_sessions_collection):
    """Test getting all active sessions for a user"""
    user_id = "user_123"
    mock_sessions = [
        {'session_id': 'session_1', 'user_id': user_id, 'is_active': True},
        {'session_id': 'session_2', 'user_id': user_id, 'is_active': True}
    ]
    
    mock_sessions_collection.find.return_value = mock_sessions
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        result = await get_active_sessions(user_id)
        
        assert result == mock_sessions
        mock_sessions_collection.find.assert_called_once_with({
            'user_id': user_id,
            'is_active': True
        })


@pytest.mark.asyncio
async def test_invalidate_all_user_sessions(mock_sessions_collection):
    """Test invalidating all sessions for a user"""
    user_id = "user_123"
    mock_sessions_collection.update_many = AsyncMock(return_value=MagicMock(modified_count=3))
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        count = await invalidate_all_user_sessions(user_id)
        
        assert count == 3
        mock_sessions_collection.update_many.assert_called_once()
        call_args = mock_sessions_collection.update_many.call_args[0]
        
        assert call_args[0] == {'user_id': user_id, 'is_active': True}
        assert call_args[1]['$set']['is_active'] is False


@pytest.mark.asyncio
async def test_create_session_custom_expiry(mock_sessions_collection):
    """Test creating a session with custom expiry"""
    user_id = "test_user"
    custom_expiry_minutes = 60
    
    with patch('backend.session_utils.sessions_collection', mock_sessions_collection):
        session_id = await create_session(
            user_id, 
            "127.0.0.1", 
            "TestAgent",
            expiry_minutes=custom_expiry_minutes
        )
        
        call_args = mock_sessions_collection.insert_one.call_args[0][0]
        expires_at = call_args['expires_at']
        created_at = call_args['created_at']
        
        # Verify expiry is approximately 60 minutes from creation
        expected_expires = created_at + timedelta(minutes=custom_expiry_minutes)
        time_diff = abs((expires_at - expected_expires).total_seconds())
        
        assert time_diff < 5  # Within 5 seconds tolerance
