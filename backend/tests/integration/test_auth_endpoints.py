"""
Integration tests for authentication endpoints
Tests complete auth flows including session and token management
"""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from backend.server import app
from datetime import datetime, timedelta
import bcrypt


@pytest.fixture
async def client():
    """Create async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_firestore_collections():
    """Mock all Firestore collections"""
    with patch('backend.server.users_collection') as users_col, \
         patch('backend.server.sessions_collection') as sessions_col, \
         patch('backend.server.refresh_tokens_collection') as tokens_col, \
         patch('backend.server.audit_logs_collection') as audit_col:
        
        users_col.find_one = AsyncMock()
        users_col.insert_one = AsyncMock()
        users_col.update_one = AsyncMock()
        
        sessions_col.find_one = AsyncMock()
        sessions_col.insert_one = AsyncMock()
        sessions_col.update_one = AsyncMock()
        
        tokens_col.find_one = AsyncMock()
        tokens_col.insert_one = AsyncMock()
        tokens_col.update_one = AsyncMock()
        
        audit_col.insert_one = AsyncMock()
        
        yield {
            'users': users_col,
            'sessions': sessions_col,
            'tokens': tokens_col,
            'audit': audit_col
        }


@pytest.mark.asyncio
async def test_register_endpoint(client, mock_firestore_collections):
    """Test user registration creates session and refresh token"""
    # Mock: User doesn't exist
    mock_firestore_collections['users'].find_one.return_value = None
    
    registration_data = {
        "email": "newuser@example.com",
        "username": "newuser",
        "name": "New User",
        "password": "SecurePassword123!"
    }
    
    response = await client.post("/api/auth/register", json=registration_data)
    
    assert response.status_code == 201
    data = response.json()
    
    # Verify response contains token and user
    assert 'token' in data
    assert 'refresh_token' in data
    assert 'user' in data
    assert data['user']['email'] == registration_data['email']
    
    # Verify user was created
    assert mock_firestore_collections['users'].insert_one.called
    
    # Verify session was created
    assert mock_firestore_collections['sessions'].insert_one.called
    
    # Verify refresh token was created
    assert mock_firestore_collections['tokens'].insert_one.called
    
    # Verify audit log was created
    assert mock_firestore_collections['audit'].insert_one.called


@pytest.mark.asyncio
async def test_login_endpoint(client, mock_firestore_collections):
    """Test user login creates session and returns tokens"""
    # Mock: User exists
    hashed_password = bcrypt.hashpw("TestPassword123!".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'username': 'testuser',
        'name': 'Test User',
        'password': hashed_password
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    login_data = {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }
    
    response = await client.post("/api/auth/login", json=login_data)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify tokens returned
    assert 'token' in data
    assert 'refresh_token' in data
    assert 'user' in data
    
    # Verify session created
    assert mock_firestore_collections['sessions'].insert_one.called
    
    # Verify refresh token created
    assert mock_firestore_collections['tokens'].insert_one.called
    
    # Verify audit log
    assert mock_firestore_collections['audit'].insert_one.called


@pytest.mark.asyncio
async def test_login_invalid_credentials(client, mock_firestore_collections):
    """Test login with invalid credentials returns 401"""
    # Mock: User exists but password is wrong
    hashed_password = bcrypt.hashpw("CorrectPassword".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'password': hashed_password
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    login_data = {
        "email": "test@example.com",
        "password": "WrongPassword"
    }
    
    response = await client.post("/api/auth/login", json=login_data)
    
    assert response.status_code == 401
    assert 'token' not in response.json()


@pytest.mark.asyncio
async def test_logout_endpoint(client, mock_firestore_collections):
    """Test logout invalidates session and refresh token"""
    # Mock: Valid session exists
    mock_session = {
        'session_id': 'session_123',
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    mock_firestore_collections['sessions'].find_one.return_value = mock_session
    
    # Mock: User exists
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'username': 'testuser'
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    # Create a mock JWT token
    with patch('backend.server.create_jwt_token') as mock_jwt:
        mock_jwt.return_value = "mock_access_token"
        
        logout_data = {
            "refresh_token": "mock_refresh_token"
        }
        
        # Mock authenticated request
        headers = {"Authorization": "Bearer mock_access_token"}
        response = await client.post("/api/auth/logout", json=logout_data, headers=headers)
        
        assert response.status_code == 200
        
        # Verify session was invalidated
        assert mock_firestore_collections['sessions'].update_one.called
        
        # Verify refresh token was revoked
        assert mock_firestore_collections['tokens'].update_one.called
        
        # Verify audit log
        assert mock_firestore_collections['audit'].insert_one.called


@pytest.mark.asyncio
async def test_refresh_token_endpoint(client, mock_firestore_collections):
    """Test token refresh rotates tokens correctly"""
    # Mock: Valid refresh token exists
    mock_refresh_token = {
        'user_id': 'user_123',
        'session_id': 'session_123',
        'is_revoked': False,
        'expires_at': datetime.utcnow() + timedelta(days=7),
        'family_id': 'family_123'
    }
    mock_firestore_collections['tokens'].find_one.return_value = mock_refresh_token
    
    # Mock: User exists
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'username': 'testuser'
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    # Mock: Session exists
    mock_session = {
        'session_id': 'session_123',
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    mock_firestore_collections['sessions'].find_one.return_value = mock_session
    
    refresh_data = {
        "refresh_token": "mock_refresh_token"
    }
    
    response = await client.post("/api/auth/refresh", json=refresh_data)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify new tokens returned
    assert 'access_token' in data
    assert 'refresh_token' in data
    
    # Verify old refresh token was revoked
    assert mock_firestore_collections['tokens'].update_one.called
    
    # Verify new refresh token was created
    assert mock_firestore_collections['tokens'].insert_one.called
    
    # Verify audit log
    assert mock_firestore_collections['audit'].insert_one.called


@pytest.mark.asyncio
async def test_refresh_token_with_revoked_token(client, mock_firestore_collections):
    """Test refresh with revoked token returns 401"""
    # Mock: Revoked refresh token
    mock_refresh_token = {
        'user_id': 'user_123',
        'is_revoked': True,  # Token is revoked
        'expires_at': datetime.utcnow() + timedelta(days=7)
    }
    mock_firestore_collections['tokens'].find_one.return_value = mock_refresh_token
    
    refresh_data = {
        "refresh_token": "revoked_token"
    }
    
    response = await client.post("/api/auth/refresh", json=refresh_data)
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_with_expired_token(client, mock_firestore_collections):
    """Test refresh with expired token returns 401"""
    # Mock: Expired refresh token
    mock_refresh_token = {
        'user_id': 'user_123',
        'is_revoked': False,
        'expires_at': datetime.utcnow() - timedelta(days=1)  # Expired
    }
    mock_firestore_collections['tokens'].find_one.return_value = mock_refresh_token
    
    refresh_data = {
        "refresh_token": "expired_token"
    }
    
    response = await client.post("/api/auth/refresh", json=refresh_data)
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_endpoint_with_valid_session(client, mock_firestore_collections):
    """Test accessing protected endpoint with valid session"""
    # Mock: Valid session
    mock_session = {
        'session_id': 'session_123',
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    mock_firestore_collections['sessions'].find_one.return_value = mock_session
    
    # Mock: User exists
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'username': 'testuser',
        'name': 'Test User'
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    with patch('backend.server.create_jwt_token') as mock_jwt, \
         patch('backend.server.verify_jwt_token') as mock_verify:
        mock_jwt.return_value = "mock_access_token"
        mock_verify.return_value = {
            'sub': 'user_123',
            'session_id': 'session_123'
        }
        
        headers = {"Authorization": "Bearer mock_access_token"}
        response = await client.get("/api/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == 'test@example.com'


@pytest.mark.asyncio
async def test_protected_endpoint_with_expired_session(client, mock_firestore_collections):
    """Test accessing protected endpoint with expired session returns 401"""
    # Mock: Expired session
    mock_session = {
        'session_id': 'session_123',
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() - timedelta(hours=1)  # Expired
    }
    mock_firestore_collections['sessions'].find_one.return_value = mock_session
    
    with patch('backend.server.verify_jwt_token') as mock_verify:
        mock_verify.return_value = {
            'sub': 'user_123',
            'session_id': 'session_123'
        }
        
        headers = {"Authorization": "Bearer mock_access_token"}
        response = await client.get("/api/me", headers=headers)
        
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_gdpr_export_endpoint(client, mock_firestore_collections):
    """Test GDPR data export endpoint"""
    # Mock: User exists
    mock_user = {
        'id': 'user_123',
        'email': 'test@example.com',
        'username': 'testuser',
        'name': 'Test User'
    }
    mock_firestore_collections['users'].find_one.return_value = mock_user
    
    # Mock: Valid session
    mock_session = {
        'session_id': 'session_123',
        'user_id': 'user_123',
        'is_active': True,
        'expires_at': datetime.utcnow() + timedelta(hours=1)
    }
    mock_firestore_collections['sessions'].find_one.return_value = mock_session
    
    with patch('backend.server.verify_jwt_token') as mock_verify, \
         patch('backend.server.links_collection') as links_col, \
         patch('backend.server.analytics_collection') as analytics_col:
        
        mock_verify.return_value = {
            'sub': 'user_123',
            'session_id': 'session_123'
        }
        
        links_col.find = AsyncMock(return_value=[])
        analytics_col.find = AsyncMock(return_value=[])
        
        headers = {"Authorization": "Bearer mock_access_token"}
        response = await client.get("/api/users/export", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify export contains expected data
        assert 'user_profile' in data
        assert 'links' in data
        assert 'analytics' in data
        assert 'exported_at' in data
        
        # Verify audit log was created
        assert mock_firestore_collections['audit'].insert_one.called
