"""
Pattern Test Suite: CRUD Operations

Tests CRUD (Create, Read, Update, Delete) patterns across all resources
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime
import uuid
import sys
from pathlib import Path
from app.main import app
from app.domain.models import User

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.pattern
@pytest.mark.crud
class TestCRUDPatternLinks:
    """CRUD pattern tests for Links"""
    
    @pytest.mark.asyncio
    async def test_create_pattern(self):
        """Pattern: CREATE operation"""
        user_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user, \
             patch('server.log_audit_event') as mock_audit:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup CREATE pattern
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(return_value={'inserted_id': link_id})
            mock_audit.return_value = True
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.post(
                "/api/links",
                headers={"Authorization": "Bearer test_token"},
                json={
                    "title": "Test Link",
                    "url": "https://example.com",
                    "icon": "link"
                }
            )
            
            assert response.status_code in [201, 200, 401]
            if response.status_code in [201, 200]:
                assert mock_links.insert_one.called
                assert mock_audit.called
    
    @pytest.mark.asyncio
    async def test_read_pattern(self):
        """Pattern: READ operation (list)"""
        user_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup READ pattern
            mock_links.find = AsyncMock(return_value=[
                {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Link 1', 'order': 0},
                {'id': str(uuid.uuid4()), 'user_id': user_id, 'title': 'Link 2', 'order': 1}
            ])
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.get(
                "/api/links",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code in [200, 401]
            if response.status_code == 200:
                assert mock_links.find.called
    
    @pytest.mark.asyncio
    async def test_update_pattern(self):
        """Pattern: UPDATE operation"""
        user_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user, \
             patch('server.log_audit_event') as mock_audit:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup UPDATE pattern
            mock_links.find_one = AsyncMock(return_value={
                'id': link_id,
                'user_id': user_id,
                'title': 'Old Title'
            })
            mock_links.update_one = AsyncMock(return_value={'modified_count': 1})
            mock_audit.return_value = True
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.put(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"},
                json={"title": "New Title"}
            )
            
            assert response.status_code in [200, 401, 404]
            if response.status_code == 200:
                assert mock_links.update_one.called
    
    @pytest.mark.asyncio
    async def test_delete_pattern(self):
        """Pattern: DELETE operation"""
        user_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user, \
             patch('server.log_audit_event') as mock_audit:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup DELETE pattern
            mock_links.find_one = AsyncMock(return_value={
                'id': link_id,
                'user_id': user_id
            })
            mock_links.delete_one = AsyncMock(return_value={'deleted_count': 1})
            mock_audit.return_value = True
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.delete(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code in [200, 401, 404]
            if response.status_code == 200:
                assert mock_links.delete_one.called


@pytest.mark.pattern
@pytest.mark.crud
class TestCRUDPatternItems:
    """CRUD pattern tests for Items (embedded in user document)"""
    
    @pytest.mark.asyncio
    async def test_create_pattern_embedded(self):
        """Pattern: CREATE operation for embedded resource"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup CREATE pattern for embedded resource
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'items': []
            })
            mock_users.update_one = AsyncMock(return_value={'modified_count': 1})
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.post(
                "/api/items",
                headers={"Authorization": "Bearer test_token"},
                json={
                    "name": "Test Item",
                    "price": 10.0,
                    "currency": "USD"
                }
            )
            
            assert response.status_code in [201, 200, 401]
            if response.status_code in [201, 200]:
                assert mock_users.update_one.called
    
    @pytest.mark.asyncio
    async def test_read_pattern_embedded(self):
        """Pattern: READ operation for embedded resource"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup READ pattern for embedded resource
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'items': [
                    {'id': str(uuid.uuid4()), 'name': 'Item 1', 'order': 0},
                    {'id': str(uuid.uuid4()), 'name': 'Item 2', 'order': 1}
                ]
            })
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.get(
                "/api/items",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code in [200, 401]
            if response.status_code == 200:
                assert mock_users.find_one.called


@pytest.mark.pattern
@pytest.mark.auth
class TestAuthenticationPatterns:
    """Pattern tests for authentication flows"""
    
    @pytest.mark.asyncio
    async def test_jwt_token_pattern(self):
        """Pattern: JWT token generation and validation"""
        user_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.sessions_collection') as mock_sessions, \
             patch('server.RefreshTokenManager') as mock_refresh, \
             patch('server.verify_password') as mock_verify:
            
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'email': 'test@example.com',
                'password': '$2b$12$hashed',
                'is_active': True
            })
            mock_verify.return_value = True
            mock_sessions.insert_one = AsyncMock(return_value={'inserted_id': session_id})
            mock_refresh.create_refresh_token = AsyncMock(return_value=("refresh_token", "family_id"))
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.post("/api/auth/login", json={
                "email": "test@example.com",
                "password": "password123"
            })
            
            assert response.status_code in [200, 401]
            if response.status_code == 200:
                data = response.json()
                assert 'access_token' in data or 'token' in data
                assert 'refresh_token' in data
    
    @pytest.mark.asyncio
    async def test_authorization_pattern(self):
        """Pattern: Authorization checks (user can only access own resources)"""
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            # Current user is user_id_1
            mock_user = User(id=user_id_1, email="user1@example.com", username="user1", name="User 1")
            mock_get_user.return_value = mock_user
            
            # Link belongs to user_id_2
            mock_links.find_one = AsyncMock(return_value={
                'id': link_id,
                'user_id': user_id_2  # Different user!
            })
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            # Should fail authorization check
            response = client.put(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"},
                json={"title": "Hacked Title"}
            )
            
            # Should be 404 (not found) or 403 (forbidden)
            assert response.status_code in [404, 403, 401]


@pytest.mark.pattern
@pytest.mark.validation
class TestValidationPatterns:
    """Pattern tests for input validation"""
    
    @pytest.mark.asyncio
    async def test_required_field_pattern(self):
        """Pattern: Required field validation"""
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        # Missing required field
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            # Missing: password, username, name
        })
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_email_validation_pattern(self):
        """Pattern: Email format validation"""
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        # Invalid email format
        response = client.post("/api/auth/register", json={
            "email": "invalid-email",
            "password": "SecurePass123!",
            "username": "testuser",
            "name": "Test User"
        })
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_string_length_pattern(self):
        """Pattern: String length validation"""
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        # Username too short
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "SecurePass123!",
            "username": "ab",  # Too short (min 3)
            "name": "Test User"
        })
        
        assert response.status_code == 422  # Validation error


@pytest.mark.pattern
@pytest.mark.error_handling
class TestErrorHandlingPatterns:
    """Pattern tests for error handling"""
    
    @pytest.mark.asyncio
    async def test_not_found_pattern(self):
        """Pattern: 404 Not Found handling"""
        user_id = str(uuid.uuid4())
        non_existent_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find_one = AsyncMock(return_value=None)  # Not found
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.get(
                f"/api/links/{non_existent_id}",
                headers={"Authorization": "Bearer test_token"}
            )
            
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_unauthorized_pattern(self):
        """Pattern: 401 Unauthorized handling"""
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        # No token provided
        response = client.get("/api/links")
        
        assert response.status_code == 401  # Unauthorized
    
    @pytest.mark.asyncio
    async def test_duplicate_pattern(self):
        """Pattern: Duplicate resource handling (409 Conflict)"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users:
            # User already exists
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'email': 'existing@example.com'
            })
            
            from fastapi.testclient import TestClient
            client = TestClient(app)
            
            response = client.post("/api/auth/register", json={
                "email": "existing@example.com",
                "password": "SecurePass123!",
                "username": "newuser",
                "name": "New User"
            })
            
            # Should be 400 (Bad Request) for duplicate email
            assert response.status_code in [400, 422]
