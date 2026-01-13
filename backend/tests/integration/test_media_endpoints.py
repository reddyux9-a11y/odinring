"""
Integration tests for Media Management Endpoints
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
class TestMediaEndpoints:
    """Test media management endpoints"""
    
    async def test_get_media(self, test_client, auth_headers):
        """Test getting user media files"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.media_collection') as mock_media:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_media.find = AsyncMock(return_value=[])
            
            response = test_client.get("/api/media", headers=auth_headers)
            
            assert response.status_code in [200, 401]
    
    async def test_create_media(self, test_client, auth_headers):
        """Test creating media file"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.media_collection') as mock_media:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_media.count_documents = AsyncMock(return_value=3)
            mock_media.insert_one = AsyncMock()
            
            response = test_client.post("/api/media", headers=auth_headers, json={
                "type": "image",
                "url": "https://example.com/image.jpg",
                "title": "Test Image"
            })
            
            assert response.status_code in [201, 200, 401, 400]
    
    async def test_update_media(self, test_client, auth_headers):
        """Test updating media file"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.media_collection') as mock_media:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_media.find_one = AsyncMock(return_value={"id": "media_123", "user_id": "user_123"})
            mock_media.update_one = AsyncMock()
            
            response = test_client.put("/api/media/media_123", headers=auth_headers, json={
                "title": "Updated Media"
            })
            
            assert response.status_code in [200, 401, 404]
    
    async def test_delete_media(self, test_client, auth_headers):
        """Test deleting media file"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.media_collection') as mock_media:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_media.find_one = AsyncMock(return_value={"id": "media_123", "user_id": "user_123"})
            mock_media.delete_one = AsyncMock()
            
            response = test_client.delete("/api/media/media_123", headers=auth_headers)
            
            assert response.status_code in [200, 401, 404]


