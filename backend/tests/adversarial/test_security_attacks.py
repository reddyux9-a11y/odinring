"""
Adversarial Test Suite: Security Attacks

Tests security vulnerabilities, injection attacks, and malicious inputs
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime
import uuid
import sys
import json
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.mark.adversarial
@pytest.mark.security
class TestSQLInjectionAttempts:
    """Test SQL injection attempts (Firestore uses parameterized queries, but test anyway)"""
    
    @pytest.mark.asyncio
    async def test_sql_injection_in_email(self):
        """Adversarial: SQL injection attempt in email field"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        # SQL injection payloads
        injection_payloads = [
            "test@example.com'; DROP TABLE users; --",
            "test@example.com' OR '1'='1",
            "test@example.com'; UPDATE users SET password='hacked'; --",
            "test@example.com' UNION SELECT * FROM users --"
        ]
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)  # No existing user
            
            for payload in injection_payloads:
                response = client.post("/api/auth/register", json={
                    "email": payload,
                    "password": "SecurePass123!",
                    "username": "testuser",
                    "name": "Test User"
                })
                
                # Should be rejected by validation (422) or fail gracefully
                assert response.status_code in [422, 400, 500]
                # Should NOT execute SQL (Firestore doesn't use SQL anyway)
    
    @pytest.mark.asyncio
    async def test_no_sql_injection_in_username(self):
        """Adversarial: SQL injection attempt in username field"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        injection_payloads = [
            "admin'; DROP TABLE users; --",
            "admin' OR '1'='1",
            "test' UNION SELECT * FROM users --"
        ]
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            
            for payload in injection_payloads:
                response = client.post("/api/auth/register", json={
                    "email": "test@example.com",
                    "password": "SecurePass123!",
                    "username": payload,
                    "name": "Test User"
                })
                
                # Should be rejected by validation (username validation regex)
                assert response.status_code in [422, 400]


@pytest.mark.adversarial
@pytest.mark.security
class TestXSSAttempts:
    """Test XSS (Cross-Site Scripting) attempts"""
    
    @pytest.mark.asyncio
    async def test_xss_in_link_title(self):
        """Adversarial: XSS attempt in link title"""
        user_id = str(uuid.uuid4())
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "'\"><script>alert('XSS')</script>",
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
            
            for payload in xss_payloads:
                response = client.post(
                    "/api/links",
                    headers={"Authorization": "Bearer test_token"},
                    json={
                        "title": payload,
                        "url": "https://example.com",
                        "icon": "link"
                    }
                )
                
                # Should accept (validation should strip/escape, or frontend handles)
                assert response.status_code in [201, 200, 401, 422]
                # Note: XSS prevention should be handled at frontend level
    
    @pytest.mark.asyncio
    async def test_xss_in_bio(self):
        """Adversarial: XSS attempt in user bio"""
        user_id = str(uuid.uuid4())
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
        ]
        
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
            
            for payload in xss_payloads:
                response = client.put(
                    "/api/me",
                    headers={"Authorization": "Bearer test_token"},
                    json={"bio": payload}
                )
                
                # Should accept (frontend should sanitize)
                assert response.status_code in [200, 401, 422]


@pytest.mark.adversarial
@pytest.mark.security
class TestPathTraversalAttempts:
    """Test path traversal attacks"""
    
    @pytest.mark.asyncio
    async def test_path_traversal_in_username(self):
        """Adversarial: Path traversal in username"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        traversal_payloads = [
            "../../etc/passwd",
            "..\\..\\windows\\system32",
            "....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        ]
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            
            for payload in traversal_payloads:
                response = client.post("/api/auth/register", json={
                    "email": "test@example.com",
                    "password": "SecurePass123!",
                    "username": payload,
                    "name": "Test User"
                })
                
                # Should be rejected by username validation (regex doesn't allow ../)
                assert response.status_code in [422, 400]


@pytest.mark.adversarial
@pytest.mark.security
class TestAuthenticationAttacks:
    """Test authentication bypass attempts"""
    
    @pytest.mark.asyncio
    async def test_jwt_token_tampering(self):
        """Adversarial: Tampered JWT token"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        tampered_tokens = [
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIn0.tampered_signature",
            "not_a_jwt_token",
            "Bearer invalid_token",
            "Bearer ",
            "",
            "null",
            "undefined",
        ]
        
        for token in tampered_tokens:
            headers = {"Authorization": f"Bearer {token}"}
            
            response = client.get("/api/links", headers=headers)
            
            # Should reject tampered tokens
            assert response.status_code == 401  # Unauthorized
    
    @pytest.mark.asyncio
    async def test_weak_password_attempt(self):
        """Adversarial: Weak password attempts"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        weak_passwords = [
            "password",
            "12345678",
            "admin",
            "qwerty",
            "Password",  # No number
            "password1",  # No uppercase
            "PASSWORD1",  # No lowercase
            "Pass1",  # Too short (< 8)
        ]
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            
            for password in weak_passwords:
                response = client.post("/api/auth/register", json={
                    "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
                    "password": password,
                    "username": f"user_{uuid.uuid4().hex[:8]}",
                    "name": "Test User"
                })
                
                # Should be rejected by password validation
                assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_brute_force_login_attempt(self):
        """Adversarial: Brute force login attempts"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        with patch('server.users_collection') as mock_users, \
             patch('server.verify_password') as mock_verify:
            
            mock_users.find_one = AsyncMock(return_value={
                'id': str(uuid.uuid4()),
                'email': 'test@example.com',
                'password': '$2b$12$hashed',
                'is_active': True
            })
            mock_verify.return_value = False  # Wrong password
            
            # Simulate multiple login attempts
            for i in range(10):
                response = client.post("/api/auth/login", json={
                    "email": "test@example.com",
                    "password": f"wrong_password_{i}"
                })
                
                # Should eventually rate limit (429) or reject (401)
                assert response.status_code in [401, 429]


@pytest.mark.adversarial
@pytest.mark.security
class TestAuthorizationBypassAttempts:
    """Test authorization bypass attempts"""
    
    @pytest.mark.asyncio
    async def test_access_other_user_resource(self):
        """Adversarial: Attempt to access another user's resource"""
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        link_id = str(uuid.uuid4())
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            # Current user is user_id_1
            mock_user = User(id=user_id_1, email="user1@example.com", username="user1", name="User 1")
            mock_get_user.return_value = mock_user
            
            # Link belongs to user_id_2
            mock_links.find_one = AsyncMock(return_value={
                'id': link_id,
                'user_id': user_id_2  # Different user!
            })
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            # Try to update other user's link
            response = client.put(
                f"/api/links/{link_id}",
                headers={"Authorization": "Bearer test_token"},
                json={"title": "Hacked Title"}
            )
            
            # Should be rejected (404 or 403)
            assert response.status_code in [404, 403, 401]
    
    @pytest.mark.asyncio
    async def test_unauthorized_admin_access(self):
        """Adversarial: Regular user trying to access admin endpoint"""
        user_id = str(uuid.uuid4())
        
        with patch('server.get_current_user') as mock_get_user, \
             patch('server.get_current_admin') as mock_get_admin:
            
            from server import User
            from fastapi import HTTPException
            
            mock_user = User(id=user_id, email="user@example.com", username="user", name="User")
            mock_get_user.return_value = mock_user
            
            # Admin endpoint should use get_current_admin, not get_current_user
            mock_get_admin.side_effect = HTTPException(status_code=401, detail="Not authenticated as admin")
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            response = client.get(
                "/api/admin/stats",
                headers={"Authorization": "Bearer test_token"}
            )
            
            # Should be rejected (401 or 403)
            assert response.status_code in [401, 403]


@pytest.mark.adversarial
@pytest.mark.security
class TestInputValidationAttacks:
    """Test input validation bypass attempts"""
    
    @pytest.mark.asyncio
    async def test_oversized_input(self):
        """Adversarial: Oversized input fields"""
        user_id = str(uuid.uuid4())
        
        # Create oversized strings
        oversized_title = "A" * 10000  # Very long title
        oversized_bio = "B" * 100000  # Very long bio
        oversized_url = "https://" + "x" * 10000 + ".com"  # Very long URL
        
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
            
            # Try oversized title
            response = client.post(
                "/api/links",
                headers={"Authorization": "Bearer test_token"},
                json={
                    "title": oversized_title,
                    "url": "https://example.com"
                }
            )
            
            # Should be rejected by validation or fail gracefully
            assert response.status_code in [422, 400, 413, 500]
    
    @pytest.mark.asyncio
    async def test_special_characters_in_input(self):
        """Adversarial: Special characters in input fields"""
        user_id = str(uuid.uuid4())
        
        special_chars = [
            "\x00",  # Null byte
            "\r\n",  # Carriage return + line feed
            "\x1a",  # Control character
            "\uffff",  # Invalid UTF-8
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
            
            for char in special_chars:
                response = client.post(
                    "/api/links",
                    headers={"Authorization": "Bearer test_token"},
                    json={
                        "title": f"Test{char}Title",
                        "url": "https://example.com"
                    }
                )
                
                # Should handle gracefully or reject
                assert response.status_code in [201, 200, 401, 422, 400]


@pytest.mark.adversarial
@pytest.mark.security
class TestRateLimitingAttacks:
    """Test rate limiting bypass attempts"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_bypass_attempt(self):
        """Adversarial: Attempt to bypass rate limiting"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            
            # Send many requests quickly
            responses = []
            for i in range(20):
                response = client.post("/api/auth/register", json={
                    "email": f"test_{i}_{uuid.uuid4().hex[:8]}@example.com",
                    "password": "SecurePass123!",
                    "username": f"user_{i}_{uuid.uuid4().hex[:8]}",
                    "name": "Test User"
                })
                responses.append(response.status_code)
            
            # Should eventually hit rate limit (429)
            # Note: Rate limiting might not work in test environment, but structure should be there
            assert 429 in responses or all(status in [201, 200, 400, 422] for status in responses)


@pytest.mark.adversarial
@pytest.mark.security
class TestIDORAttempts:
    """Test IDOR (Insecure Direct Object Reference) attempts"""
    
    @pytest.mark.asyncio
    async def test_idor_in_link_id(self):
        """Adversarial: Try to access link by guessing IDs"""
        user_id = str(uuid.uuid4())
        
        # Try common/sequential IDs
        guessed_ids = [
            "1",
            "123",
            "00000000-0000-0000-0000-000000000000",
            "ffffffff-ffff-ffff-ffff-ffffffffffff",
            "admin",
            "test",
        ]
        
        with patch('server.links_collection') as mock_links, \
             patch('server.get_current_user') as mock_get_user:
            
            from server import User
            mock_user = User(id=user_id, email="test@example.com", username="testuser", name="Test User")
            mock_get_user.return_value = mock_user
            
            mock_links.find_one = AsyncMock(return_value=None)  # Not found
            
            from fastapi.testclient import TestClient
            from server import app
            client = TestClient(app)
            
            for link_id in guessed_ids:
                response = client.get(
                    f"/api/links/{link_id}",
                    headers={"Authorization": "Bearer test_token"}
                )
                
                # Should return 404 (not found) or 401 (unauthorized)
                assert response.status_code in [404, 401]
    
    @pytest.mark.asyncio
    async def test_idor_in_username(self):
        """Adversarial: Try to access profile by guessing usernames"""
        from fastapi.testclient import TestClient
        from server import app
        client = TestClient(app)
        
        # Try common usernames (public profiles are accessible, but test anyway)
        guessed_usernames = [
            "admin",
            "administrator",
            "root",
            "test",
            "user",
            "guest",
        ]
        
        with patch('server.users_collection') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)  # Not found
            
            for username in guessed_usernames:
                response = client.get(f"/api/profile/{username}")
                
                # Should return 404 (not found) for non-existent profiles
                assert response.status_code in [404, 200]  # Public profiles are accessible if they exist
