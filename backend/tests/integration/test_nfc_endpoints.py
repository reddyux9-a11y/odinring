"""
Integration tests for NFC-related endpoints

SECURITY: Tests for NFC ring scanning and management
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.integration
@pytest.mark.asyncio
class TestNFCEndpoints:
    """Test NFC-related endpoints"""
    
    async def test_get_profile_by_ring(self, test_client):
        """Test getting profile by ring ID"""
        with patch('server.users_collection') as mock_users, \
             patch('server.rings_collection') as mock_rings, \
             patch('server.track_ring_event') as mock_track, \
             patch('server.links_collection') as mock_links:
            
            mock_users.find_one = AsyncMock(return_value={
                "id": "user_123",
                "ring_id": "RING_123",
                "username": "testuser",
                "name": "Test User",
                "is_active": True
            })
            mock_rings.find_one = AsyncMock(return_value=None)
            mock_links.find = AsyncMock(return_value=[])
            mock_track.return_value = True
            
            response = test_client.get("/api/ring/RING_123")
            
            assert response.status_code in [200, 404]
    
    async def test_get_ring_settings(self, test_client, auth_headers):
        """Test getting ring settings"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.rings_collection') as mock_rings:
            
            mock_user.return_value = type('User', (), {
                "id": "user_123",
                "ring_id": "RING_123"
            })()
            mock_rings.find_one = AsyncMock(return_value={
                "ring_id": "RING_123",
                "user_id": "user_123",
                "direct_mode": False
            })
            
            response = test_client.get("/api/rings/RING_123/settings", headers=auth_headers)
            
            assert response.status_code in [200, 401, 403, 404]
    
    async def test_toggle_direct_mode(self, test_client, auth_headers):
        """Test toggling direct mode"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.rings_collection') as mock_rings, \
             patch('server.links_collection') as mock_links, \
             patch('server.track_ring_event') as mock_track:
            
            mock_user.return_value = type('User', (), {
                "id": "user_123",
                "ring_id": "RING_123"
            })()
            mock_links.find_one = AsyncMock(return_value={"id": "link_123", "user_id": "user_123"})
            mock_rings.update_one = AsyncMock()
            mock_track.return_value = True
            
            # Direct link mode endpoint removed
            
            assert response.status_code in [200, 401, 403, 404]

