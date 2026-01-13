"""
Integration tests for authentication API endpoints
"""
import pytest
from httpx import AsyncClient
from server import app


@pytest.mark.integration
@pytest.mark.asyncio
class TestAuthAPI:
    """Test authentication API endpoints"""
    
    async def test_health_check(self):
        """Test health check endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/debug/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
    
    async def test_register_missing_fields(self):
        """Test registration with missing fields"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/auth/register", json={
                "email": "test@example.com"
            })
            assert response.status_code == 422  # Validation error
    
    async def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            })
            assert response.status_code == 401  # Unauthorized


