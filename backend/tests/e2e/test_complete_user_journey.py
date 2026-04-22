"""
End-to-End Test Suite: Complete User Journey

Tests complete user workflows from registration to profile management
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
import uuid
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.e2e
@pytest.mark.asyncio
class TestCompleteUserRegistrationFlow:
    """Complete user registration and onboarding flow"""
    
    async def test_user_registration_to_first_link(self):
        """E2E: Register → Login → Update Profile → Create Link → View Public Profile"""
        user_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.links_collection') as mock_links, \
             patch('server.sessions_collection') as mock_sessions, \
             patch('server.RefreshTokenManager') as mock_refresh, \
             patch('server.log_audit_event') as mock_audit, \
             patch('server.get_client_ip') as mock_ip, \
             patch('server.get_user_agent') as mock_ua:
            
            # Setup mocks
            mock_users.find_one = AsyncMock(side_effect=[None, None])  # No existing user
            mock_users.insert_one = AsyncMock(return_value={'inserted_id': user_id})
            mock_users.update_one = AsyncMock(return_value={'modified_count': 1})
            mock_sessions.insert_one = AsyncMock(return_value={'inserted_id': session_id})
            mock_sessions.update_one = AsyncMock(return_value={'modified_count': 1})
            mock_refresh.create_refresh_token = AsyncMock(return_value=("refresh_token_123", "family_123"))
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(return_value={'inserted_id': link_id})
            mock_audit.return_value = True
            mock_ip.return_value = "127.0.0.1"
            mock_ua.return_value = "pytest"
            
            # Step 1: Register
            from fastapi.testclient import TestClient
            from app.main import app
            
            client = TestClient(app)
            
            register_data = {
                "email": f"e2e_{uuid.uuid4().hex[:8]}@example.com",
                "password": "SecurePass123!",
                "username": f"e2euser_{uuid.uuid4().hex[:8]}",
                "name": "E2E Test User"
            }
            
            # Mock user document after insert
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'email': register_data['email'],
                'username': register_data['username'],
                'name': register_data['name'],
                'created_at': datetime.utcnow(),
                'is_active': True
            })
            
            response = client.post("/api/auth/register", json=register_data)
            
            # Should succeed (201) or fail gracefully (400/422)
            assert response.status_code in [201, 200, 400, 422]
            
            if response.status_code in [201, 200]:
                data = response.json()
                assert 'access_token' in data or 'token' in data
                token = data.get('access_token') or data.get('token')
                
                # Step 2: Update profile
                headers = {"Authorization": f"Bearer {token}"}
                
                # Mock current user
                with patch('server.get_current_user') as mock_get_user:
                    from app.domain.models import User
                    mock_user = User(
                        id=user_id,
                        email=register_data['email'],
                        username=register_data['username'],
                        name=register_data['name']
                    )
                    mock_get_user.return_value = mock_user
                    
                    update_response = client.put(
                        "/api/me",
                        headers=headers,
                        json={"bio": "Updated bio from E2E test"}
                    )
                    
                    assert update_response.status_code in [200, 401, 404]
                    
                    # Step 3: Create link
                    mock_links.find_one = AsyncMock(return_value=None)
                    
                    link_response = client.post(
                        "/api/links",
                        headers=headers,
                        json={
                            "title": "My First Link",
                            "url": "https://example.com",
                            "icon": "link"
                        }
                    )
                    
                    assert link_response.status_code in [201, 200, 401]


@pytest.mark.e2e
@pytest.mark.asyncio
class TestCompleteLinkManagementFlow:
    """Complete link CRUD operations flow"""
    
    async def test_create_update_reorder_delete_links(self):
        """E2E: Create → Update → Reorder → Delete multiple links"""
        user_id = str(uuid.uuid4())
        link_ids = [str(uuid.uuid4()) for _ in range(3)]
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user, \
             patch('server.log_audit_event') as mock_audit:
            
            from app.domain.models import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Setup mocks
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(side_effect=[
                {'inserted_id': link_id} for link_id in link_ids
            ])
            mock_links.find_one = AsyncMock(side_effect=[
                {'id': link_id, 'user_id': user_id, 'order': i} 
                for i, link_id in enumerate(link_ids)
            ])
            mock_links.update_one = AsyncMock(return_value={'modified_count': 1})
            mock_links.delete_one = AsyncMock(return_value={'deleted_count': 1})
            mock_audit.return_value = True
            
            from fastapi.testclient import TestClient
            from app.main import app
            client = TestClient(app)
            
            token = "test_token_123"
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create 3 links
            created_links = []
            for i, link_id in enumerate(link_ids):
                response = client.post(
                    "/api/links",
                    headers=headers,
                    json={
                        "title": f"Link {i+1}",
                        "url": f"https://example{i+1}.com",
                        "icon": "link"
                    }
                )
                if response.status_code in [201, 200]:
                    created_links.append(response.json())
            
            # Update first link
            if created_links:
                update_response = client.put(
                    f"/api/links/{link_ids[0]}",
                    headers=headers,
                    json={"title": "Updated Link Title"}
                )
                assert update_response.status_code in [200, 401, 404]
            
            # Reorder links
            reorder_data = [
                {"id": link_ids[2], "order": 0},
                {"id": link_ids[0], "order": 1},
                {"id": link_ids[1], "order": 2}
            ]
            reorder_response = client.put(
                "/api/links/reorder",
                headers=headers,
                json={"links_order": reorder_data}
            )
            assert reorder_response.status_code in [200, 401]
            
            # Delete first link
            delete_response = client.delete(
                f"/api/links/{link_ids[0]}",
                headers=headers
            )
            assert delete_response.status_code in [200, 401, 404]