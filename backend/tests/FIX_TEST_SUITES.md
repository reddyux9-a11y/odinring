# Test Suites Fix Guide

This document outlines the fixes needed to achieve 100% test pass rate.

## Common Issues and Fixes

### 1. Test Client Setup
**Issue:** Tests need to use TestClient with proper mocking
**Fix:** Import app at module level with proper patches, or use fixture properly

### 2. Mock Setup
**Issue:** All dependencies need to be mocked before app import
**Fix:** Use context managers for patches, ensure AsyncMock for async functions

### 3. Authentication Dependencies
**Issue:** get_current_user and get_current_admin need to be patched
**Fix:** Patch these dependencies using @patch decorator or context manager

### 4. Session and Token Management
**Issue:** SessionManager and RefreshTokenManager need proper mocking
**Fix:** Mock their methods using AsyncMock

### 5. Collection Mocking
**Issue:** Firestore collections need AsyncMock methods
**Fix:** Use AsyncMock for all collection methods (find_one, insert_one, etc.)

## Patterns to Follow

Based on existing working tests (test_api_endpoints.py, test_item_endpoints.py):

1. Use `test_client` fixture from conftest
2. Patch `server.*` modules (e.g., `server.users_collection`, `server.get_current_user`)
3. Use `AsyncMock` for async functions
4. Use `type('User', (), {...})()` for mock user objects
5. Use context managers for patches (`with patch(...) as mock:`)
6. Assert status codes with ranges (e.g., `in [200, 401]`)

## Test Structure Pattern

```python
@pytest.mark.e2e
@pytest.mark.asyncio
class TestSomething:
    async def test_something(self, test_client, auth_headers):
        with patch('server.get_current_user') as mock_user, \
             patch('server.some_collection') as mock_collection:
            
            mock_user.return_value = type('User', (), {"id": "user_123"})()
            mock_collection.find_one = AsyncMock(return_value={...})
            mock_collection.insert_one = AsyncMock(return_value={...})
            
            response = test_client.post("/api/endpoint", headers=auth_headers, json={...})
            
            assert response.status_code in [201, 200, 401]
```
