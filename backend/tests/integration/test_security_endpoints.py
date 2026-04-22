"""
Integration tests for Security Endpoints

SECURITY: Tests for security-related endpoints (token revocation, ring revocation, etc.)
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock, MagicMock
import sys
from pathlib import Path
import jwt
from datetime import datetime, timedelta

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.integration
@pytest.mark.asyncio
class TestSecurityEndpoints:
    """Test security endpoints"""
    
    async def test_revoke_token_endpoint(self, test_client, auth_headers):
        """Test token revocation endpoint"""
        # Create a mock JWT token
        from config import settings
        JWT_SECRET = settings.JWT_SECRET
        JWT_ALGORITHM = "HS256"
        test_token = jwt.encode({
            "user_id": "user_123",
            "session_id": "session_123",
            "exp": datetime.utcnow() + timedelta(hours=1)
        }, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        with patch('server.sessions_collection') as mock_sessions, \
             patch('server.get_current_admin') as mock_admin, \
             patch('server.RefreshTokenManager') as mock_refresh, \
             patch('server.log_audit_event') as mock_audit:
            
            # Mock admin
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "super_admin"
            mock_admin.return_value = mock_admin_obj
            
            # Mock session
            mock_sessions.find_one = AsyncMock(return_value={
                "id": "session_123",
                "user_id": "user_123",
                "is_active": True
            })
            mock_sessions.update_one = AsyncMock()
            
            # Mock refresh token manager
            mock_refresh.invalidate_session_tokens = AsyncMock(return_value=2)
            
            # Mock audit log
            mock_audit.return_value = None
            
            # Make request
            response = await test_client.post(
                "/api/security/revoke-token",
                headers=auth_headers,
                json={
                    "token": test_token,
                    "reason": "security_breach"
                }
            )
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "revoked"
            assert "revoked_at" in data
            assert data["session_id"] == "session_123"
            
            # Verify session was revoked
            mock_sessions.update_one.assert_called_once()
            call_args = mock_sessions.update_one.call_args
            assert call_args[0][0]["id"] == "session_123"
            assert "$set" in call_args[0][1]
            assert call_args[0][1]["$set"]["is_active"] is False
    
    async def test_revoke_ring_endpoint(self, test_client, auth_headers):
        """Test ring revocation endpoint"""
        with patch('server.get_current_admin') as mock_admin, \
             patch('server.rings_collection') as mock_rings, \
             patch('server.users_collection') as mock_users, \
             patch('server.track_ring_event') as mock_track, \
             patch('server.log_audit_event') as mock_audit:
            
            # Mock admin
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "super_admin"
            mock_admin.return_value = mock_admin_obj
            
            # Mock ring
            mock_rings.find_one = AsyncMock(return_value={
                "ring_id": "RING_123",
                "user_id": "user_123",
                "is_active": True
            })
            mock_rings.update_one = AsyncMock()
            
            # Mock user
            mock_users.update_one = AsyncMock()
            
            # Mock tracking and audit
            mock_track.return_value = None
            mock_audit.return_value = None
            
            # Make request
            response = await test_client.post(
                "/api/security/revoke-ring",
                headers=auth_headers,
                json={
                    "ring_id": "RING_123",
                    "reason": "stolen_ring"
                }
            )
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "revoked"
            assert data["ring_id"] == "RING_123"
            assert "revoked_at" in data
            
            # Verify ring was revoked
            mock_rings.update_one.assert_called_once()
            call_args = mock_rings.update_one.call_args
            assert call_args[0][0]["ring_id"] == "RING_123"
            assert "$set" in call_args[0][1]
            assert call_args[0][1]["$set"]["is_active"] is False
            assert call_args[0][1]["$set"]["status"] == "revoked"
    
    async def test_force_logout_endpoint(self, test_client, auth_headers):
        """Test forced logout endpoint"""
        with patch('server.get_current_admin') as mock_admin, \
             patch('server.sessions_collection') as mock_sessions, \
             patch('server.users_collection') as mock_users, \
             patch('server.RefreshTokenManager') as mock_refresh, \
             patch('server.log_audit_event') as mock_audit:
            
            # Mock admin
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "super_admin"
            mock_admin.return_value = mock_admin_obj
            
            # Mock user
            mock_users.find_one = AsyncMock(return_value={
                "id": "user_123",
                "email": "user@example.com"
            })
            
            # Mock sessions
            mock_sessions.find = AsyncMock(return_value=[
                {"id": "session_1", "user_id": "user_123", "is_active": True},
                {"id": "session_2", "user_id": "user_123", "is_active": True},
                {"id": "session_3", "user_id": "user_123", "is_active": True}
            ])
            mock_sessions.update_one = AsyncMock()
            
            # Mock refresh token manager
            mock_refresh.invalidate_session_tokens = AsyncMock(return_value=1)
            mock_refresh.invalidate_user_tokens = AsyncMock(return_value=3)
            
            # Mock audit log
            mock_audit.return_value = None
            
            # Make request
            response = await test_client.post(
                "/api/security/force-logout",
                headers=auth_headers,
                json={
                    "user_id": "user_123",
                    "reason": "account_compromise"
                }
            )
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "logged_out"
            assert data["sessions_revoked"] == 3
            assert "revoked_at" in data
            assert data["user_id"] == "user_123"
            
            # Verify sessions were revoked
            assert mock_sessions.update_one.call_count == 3
    
    async def test_revoke_token_requires_super_admin(self, test_client, auth_headers):
        """Test that token revocation requires super_admin role"""
        with patch('server.get_current_admin') as mock_admin:
            # Mock admin with regular admin role
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "admin"  # Not super_admin
            mock_admin.return_value = mock_admin_obj
            
            response = await test_client.post(
                "/api/security/revoke-token",
                headers=auth_headers,
                json={
                    "token": "test_token",
                    "reason": "security_breach"
                }
            )
            
            assert response.status_code == 403
            assert "super_admin" in response.json()["detail"].lower()
    
    async def test_revoke_ring_requires_super_admin(self, test_client, auth_headers):
        """Test that ring revocation requires super_admin role"""
        with patch('server.get_current_admin') as mock_admin:
            # Mock admin with regular admin role
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "admin"  # Not super_admin
            mock_admin.return_value = mock_admin_obj
            
            response = await test_client.post(
                "/api/security/revoke-ring",
                headers=auth_headers,
                json={
                    "ring_id": "RING_123",
                    "reason": "stolen_ring"
                }
            )
            
            assert response.status_code == 403
            assert "super_admin" in response.json()["detail"].lower()
    
    async def test_force_logout_requires_super_admin(self, test_client, auth_headers):
        """Test that force logout requires super_admin role"""
        with patch('server.get_current_admin') as mock_admin:
            # Mock admin with regular admin role
            mock_admin_obj = MagicMock()
            mock_admin_obj.id = "admin_123"
            mock_admin_obj.role = "admin"  # Not super_admin
            mock_admin.return_value = mock_admin_obj
            
            response = await test_client.post(
                "/api/security/force-logout",
                headers=auth_headers,
                json={
                    "user_id": "user_123",
                    "reason": "account_compromise"
                }
            )
            
            assert response.status_code == 403
            assert "super_admin" in response.json()["detail"].lower()

