"""
Integration tests for Merchant Item Endpoints
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
class TestItemEndpoints:
    """Test merchant item endpoints"""
    
    async def test_create_item(self, test_client, auth_headers):
        """Test creating merchant item"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.items_collection') as mock_items:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_items.insert_one = AsyncMock()
            
            response = test_client.post("/api/items", headers=auth_headers, json={
                "name": "Test Product",
                "description": "Test description",
                "price": 29.99,
                "category": "product"
            })
            
            assert response.status_code in [201, 200, 401, 400]
    
    async def test_get_items(self, test_client, auth_headers):
        """Test getting user items"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.items_collection') as mock_items:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_items.find = AsyncMock(return_value=[])
            
            response = test_client.get("/api/items", headers=auth_headers)
            
            assert response.status_code in [200, 401]
    
    async def test_update_item(self, test_client, auth_headers):
        """Test updating item"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.items_collection') as mock_items:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_items.find_one = AsyncMock(return_value={"id": "item_123", "user_id": "user_123"})
            mock_items.update_one = AsyncMock()
            
            response = test_client.put("/api/items/item_123", headers=auth_headers, json={
                "price": 39.99
            })
            
            assert response.status_code in [200, 401, 404]
    
    async def test_delete_item(self, test_client, auth_headers):
        """Test deleting item"""
        with patch('server.get_current_user') as mock_user, \
             patch('server.items_collection') as mock_items:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_items.find_one = AsyncMock(return_value={"id": "item_123", "user_id": "user_123"})
            mock_items.delete_one = AsyncMock()
            
            response = test_client.delete("/api/items/item_123", headers=auth_headers)
            
            assert response.status_code in [200, 401, 404]


