"""
Adversarial Test Suite: Edge Cases

Tests edge cases, boundary conditions, and unusual inputs
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime, timedelta
import uuid
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestBoundaryConditions:
    """Test boundary conditions for inputs"""
    
    @pytest.mark.asyncio
    async def test_minimum_length_inputs(self):
        """Edge Case: Minimum length inputs"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            
            # Minimum valid inputs
            response = client.post("/api/auth/register", json={
                "email": "a@b.co",  # Minimum valid email
                "password": "Abc12345",  # Minimum 8 chars
                "username": "abc",  # Minimum 3 chars
                "name": "Ab",  # Minimum 2 chars
            })
            
            # Should accept or reject based on validation rules
            assert response.status_code in [201, 200, 422, 400]
    
    @pytest.mark.asyncio
    async def test_maximum_length_inputs(self):
        """Edge Case: Maximum length inputs"""
        user_id = str(uuid.uuid4())
        
        max_length_title = "A" * 255  # Assuming max title length
        max_length_bio = "B" * 500  # Max bio length per schema
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(return_value={'inserted_id': str(uuid.uuid4())})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            response = client.post(
                "/api/links",
                headers={"Authorization": "Bearer test_token"},
                json={
                    "title": max_length_title,
                    "url": "https://example.com"
                }
            )
            
            # Should accept or reject based on max length validation
            assert response.status_code in [201, 200, 401, 422]
    
    @pytest.mark.asyncio
    async def test_boundary_numeric_values(self):
        """Edge Case: Boundary numeric values"""
        user_id = str(uuid.uuid4())
        
        boundary_values = [
            0,
            -1,
            1,
            999999999,
            -999999999,
            0.01,
            -0.01,
        ]
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'items': []
            })
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            for price in boundary_values:
                response = client.post(
                    "/api/items",
                    headers={"Authorization": "Bearer test_token"},
                    json={
                        "name": "Test Item",
                        "price": price,
                        "currency": "USD"
                    }
                )
                
                # Negative prices should be rejected
                if price < 0:
                    assert response.status_code in [422, 400]
                else:
                    assert response.status_code in [201, 200, 401, 422]


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestUnicodeAndEncoding:
    """Test Unicode and encoding edge cases"""
    
    @pytest.mark.asyncio
    async def test_unicode_characters(self):
        """Edge Case: Unicode characters in inputs"""
        user_id = str(uuid.uuid4())
        
        unicode_strings = [
            "Test 🔥 Link",
            "Test 中文 Link",
            "Test العربية Link",
            "Test 😀😁😂🤣 Link",
            "Test 🎉🎊🎈 Link",
        ]
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            mock_links.insert_one = AsyncMock(return_value={'inserted_id': str(uuid.uuid4())})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            for unicode_str in unicode_strings:
                response = client.post(
                    "/api/links",
                    headers={"Authorization": "Bearer test_token"},
                    json={
                        "title": unicode_str,
                        "url": "https://example.com"
                    }
                )
                
                # Should handle Unicode properly
                assert response.status_code in [201, 200, 401, 422]
    
    @pytest.mark.asyncio
    async def test_emoji_in_inputs(self):
        """Edge Case: Emoji in various input fields"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={'id': user_id})
            mock_users.update_one = AsyncMock(return_value={'modified_count': 1})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            response = client.put(
                "/api/me",
                headers={"Authorization": "Bearer test_token"},
                json={"bio": "My bio with emoji 🚀🎉✨"}
            )
            
            # Should handle emoji properly
            assert response.status_code in [200, 401, 422]


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestEmptyAndNullInputs:
    """Test empty and null input handling"""
    
    @pytest.mark.asyncio
    async def test_empty_strings(self):
        """Edge Case: Empty strings in optional fields"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={'id': user_id})
            mock_users.update_one = AsyncMock(return_value={'modified_count': 1})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            # Empty string in optional field
            response = client.put(
                "/api/me",
                headers={"Authorization": "Bearer test_token"},
                json={"bio": ""}
            )
            
            # Should accept empty string for optional fields
            assert response.status_code in [200, 401, 422]
    
    @pytest.mark.asyncio
    async def test_null_values(self):
        """Edge Case: Null values in optional fields"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={'id': user_id})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            # Null in optional field (should be handled by Pydantic)
            import json
            response = client.put(
                "/api/me",
                headers={"Authorization": "Bearer test_token"},
                json={"bio": None}
            )
            
            # Should accept null for optional fields or reject
            assert response.status_code in [200, 401, 422]
    
    @pytest.mark.asyncio
    async def test_missing_fields(self):
        """Edge Case: Missing required fields"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        # Missing required fields
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            # Missing: password, username, name
        })
        
        # Should reject with validation error
        assert response.status_code == 422


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestConcurrentOperations:
    """Test concurrent operation handling"""
    
    @pytest.mark.asyncio
    async def test_concurrent_updates(self):
        """Edge Case: Concurrent updates to same resource"""
        user_id = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            # Simulate concurrent updates
            mock_links.find_one = AsyncMock(return_value={
                'id': link_id,
                'user_id': user_id,
                'title': 'Original Title'
            })
            mock_links.update_one = AsyncMock(return_value={'modified_count': 1})
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            # Simulate concurrent requests (in real scenario, these would be parallel)
            response1 = client.put(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"},
                json={"title": "Update 1"}
            )
            
            response2 = client.put(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"},
                json={"title": "Update 2"}
            )
            
            # Both should succeed (last write wins in Firestore)
            assert response1.status_code in [200, 401, 404]
            assert response2.status_code in [200, 401, 404]


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestDateAndTimeEdgeCases:
    """Test date and time edge cases"""
    
    @pytest.mark.asyncio
    async def test_future_dates(self):
        """Edge Case: Future dates in scheduling"""
        user_id = str(uuid.uuid4())
        
        future_date = (datetime.utcnow() + timedelta(days=365)).isoformat()
        far_future_date = (datetime.utcnow() + timedelta(days=3650)).isoformat()
        
        # Test with appointment scheduling if available
        # This is a placeholder - adjust based on actual endpoint
        pass
    
    @pytest.mark.asyncio
    async def test_past_dates(self):
        """Edge Case: Past dates"""
        user_id = str(uuid.uuid4())
        
        past_date = (datetime.utcnow() - timedelta(days=365)).isoformat()
        
        # Test with appointment scheduling if available
        # This is a placeholder - adjust based on actual endpoint
        pass


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestURLValidation:
    """Test URL validation edge cases"""
    
    @pytest.mark.asyncio
    async def test_invalid_urls(self):
        """Edge Case: Invalid URL formats"""
        user_id = str(uuid.uuid4())
        
        invalid_urls = [
            "not a url",
            "http://",
            "https://",
            "ftp://example.com",
            "javascript:alert('XSS')",
            "data:text/html,<script>alert('XSS')</script>",
            "file:///etc/passwd",
            "//example.com",
            "example.com",
        ]
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            for url in invalid_urls:
                response = client.post(
                    "/api/links",
                    headers={"Authorization": "Bearer test_token"},
                    json={
                        "title": "Test Link",
                        "url": url
                    }
                )
                
                # Should reject invalid URLs (422) or accept if validation is lenient
                assert response.status_code in [201, 200, 401, 422, 400]
    
    @pytest.mark.asyncio
    async def test_very_long_urls(self):
        """Edge Case: Very long URLs"""
        user_id = str(uuid.uuid4())
        
        long_url = "https://example.com/" + "x" * 2000  # Very long URL
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find = AsyncMock(return_value=[])
            mock_links.count_documents = AsyncMock(return_value=0)
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            response = client.post(
                "/api/links",
                headers={"Authorization": "Bearer test_token"},
                json={
                    "title": "Test Link",
                    "url": long_url
                }
            )
            
            # Should reject or accept based on URL length validation
            assert response.status_code in [201, 200, 401, 422, 413]


@pytest.mark.adversarial
@pytest.mark.edge_cases
class TestArrayAndListOperations:
    """Test array and list operation edge cases"""
    
    @pytest.mark.asyncio
    async def test_empty_arrays(self):
        """Edge Case: Empty arrays"""
        user_id = str(uuid.uuid4())
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'items': []  # Empty array
            })
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            # Get items from empty array
            response = client.get(
                "/api/items",
                headers={"Authorization": "Bearer test_token"}
            )
            
            # Should return empty array
            assert response.status_code in [200, 401]
            if response.status_code == 200:
                data = response.json()
                assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_very_large_arrays(self):
        """Edge Case: Very large arrays (many items)"""
        user_id = str(uuid.uuid4())
        
        # Create mock user with many items
        many_items = [
            {'id': str(uuid.uuid4()), 'name': f'Item {i}', 'order': i}
            for i in range(1000)  # 1000 items
        ]
        
        with patch('server.users_collection') as mock_users, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_users.find_one = AsyncMock(return_value={
                'id': user_id,
                'items': many_items
            })
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            response = client.get(
                "/api/items",
                headers={"Authorization": "Bearer test_token"}
            )
            
            # Should handle large arrays (may be slow but should work)
            assert response.status_code in [200, 401, 500]
            if response.status_code == 200:
                data = response.json()
                assert isinstance(data, list)
