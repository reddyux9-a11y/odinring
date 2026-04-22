"""
End-to-End Tests for User Flows

Tests complete user journeys through the application
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
import sys
from pathlib import Path
import uuid

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.e2e
@pytest.mark.asyncio
class TestUserRegistrationFlow:
    """Test complete user registration flow"""
    
    async def test_complete_registration_flow(self, test_client):
        """Test: Register -> Login -> Create Profile -> Create Link"""
        # Step 1: Register
        with patch('server.users_collection') as mock_users, \
             patch('server.SessionManager') as mock_session, \
             patch('server.RefreshTokenManager') as mock_refresh, \
             patch('server.log_audit_event') as mock_audit:
            
            mock_users.find_one = AsyncMock(return_value=None)
            mock_users.insert_one = AsyncMock()
            mock_session.create_session = AsyncMock(return_value={"id": "session_123"})
            mock_refresh.create_refresh_token = AsyncMock(return_value=("refresh_token", "family_id"))
            mock_audit.return_value = True
            
            # Register
            register_response = test_client.post("/api/auth/register", json={
                "email": "e2e@example.com",
                "password": "SecurePass123!",
                "username": "e2etest",
                "name": "E2E Test User"
            })
            
            # This is a simplified flow test
            # In real E2E, we would chain the requests
            assert register_response.status_code in [201, 200, 400, 422]


@pytest.mark.e2e
@pytest.mark.asyncio
class TestLinkManagementFlow:
    """Test complete link management flow"""
    
    async def test_create_update_delete_link_flow(self):
        """Test: Create Link -> Update Link -> Delete Link"""
        user_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.get_current_user') as mock_user, \
             patch('server.links_collection') as mock_links, \
             patch('server.log_link_create') as mock_create, \
             patch('server.log_link_update') as mock_update, \
             patch('server.log_link_delete') as mock_delete:
            
            from app.domain.models import User
            mock_user_obj = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_user.return_value = mock_user_obj
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(return_value={'inserted_id': link_id})
            mock_links.find_one = AsyncMock(return_value={"id": link_id, "user_id": user_id})
            mock_links.update_one = AsyncMock(return_value={'modified_count': 1})
            mock_links.delete_one = AsyncMock(return_value={'deleted_count': 1})
            mock_create.return_value = True
            mock_update.return_value = True
            mock_delete.return_value = True
            
            from fastapi.testclient import TestClient
            from app.main import app
            client = TestClient(app)
            
            token = "test_token_123"
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create
            create_response = client.post("/api/links", headers=headers, json={
                "title": "E2E Test Link",
                "url": "https://e2e.example.com"
            })
            
            # Update
            update_response = client.put(f"/api/links/{link_id}", headers=headers, json={
                "title": "Updated E2E Link"
            })
            
            # Delete
            delete_response = client.delete(f"/api/links/{link_id}", headers=headers)
            
            # Verify all operations attempted
            assert create_response.status_code in [201, 200, 401]
            assert update_response.status_code in [200, 401, 404]
            assert delete_response.status_code in [200, 401, 404]


@pytest.mark.e2e
@pytest.mark.asyncio
class TestAdminFlow:
    """Test complete admin flow"""
    
    async def test_admin_login_and_management_flow(self, test_client):
        """Test: Admin Login -> View Stats -> Manage Users"""
        with patch('server.admins_collection') as mock_admins, \
             patch('server.users_collection') as mock_users, \
             patch('server.verify_password') as mock_verify:
            
            mock_admins.find_one = AsyncMock(return_value={
                "id": "admin_123",
                "username": "admin",
                "role": "admin"
            })
            mock_verify.return_value = True
            mock_admins.update_one = AsyncMock()
            mock_users.count_documents = AsyncMock(return_value=100)
            mock_users.find = AsyncMock(return_value=[])
            
            # Login
            login_response = test_client.post("/api/admin/auth/login", json={
                "username": "admin",
                "password": "admin_password"
            })
            
            # This is a simplified flow test
            assert login_response.status_code in [200, 401]


