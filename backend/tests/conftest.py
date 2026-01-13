"""
Pytest configuration and shared fixtures for backend tests
"""
import pytest
import sys
import os
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime, timedelta
import uuid

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import additional patches for environment and file access
# This must be done before any other imports
try:
    from tests.conftest_env_patch import patch_pydantic_settings, patch_pathlib_open
    patch_pydantic_settings()
    patch_pathlib_open()
except ImportError:
    # If patch module doesn't exist, continue without it
    pass

# Set test environment before any imports
os.environ['ENV'] = 'test'
os.environ['FIREBASE_PROJECT_ID'] = 'test-project'
os.environ['JWT_SECRET'] = 'test-secret-key-minimum-32-characters-long-for-testing'
os.environ['NFC_SECRET_KEY'] = 'test-nfc-secret-key-for-testing'

# Mock dotenv BEFORE any imports to prevent .env file access
# This prevents PermissionError when trying to read .env file
mock_dotenv = MagicMock()
mock_dotenv.load_dotenv = MagicMock(return_value=True)
mock_dotenv.dotenv_values = MagicMock(return_value={})
sys.modules['dotenv'] = mock_dotenv
sys.modules['python_dotenv'] = mock_dotenv
sys.modules['dotenv.main'] = MagicMock()
sys.modules['dotenv.main'].load_dotenv = MagicMock(return_value=True)
sys.modules['dotenv.main'].dotenv_values = MagicMock(return_value={})

# Mock Firebase and related modules BEFORE any imports
# This prevents SSL certificate access issues
mock_firebase_admin = MagicMock()
mock_firestore = MagicMock()
mock_credentials = MagicMock()

# Create mock structure
mock_firebase_admin.firestore = mock_firestore
mock_firebase_admin.credentials = mock_credentials
mock_firebase_admin.initialize_app = MagicMock()

sys.modules['firebase_admin'] = mock_firebase_admin
sys.modules['firebase_admin.firestore'] = mock_firestore
sys.modules['firebase_admin.credentials'] = mock_credentials
sys.modules['google.auth'] = MagicMock()
sys.modules['google.auth.transport'] = MagicMock()
sys.modules['google.auth.transport.requests'] = MagicMock()
sys.modules['google.oauth2'] = MagicMock()
sys.modules['google.oauth2.credentials'] = MagicMock()
sys.modules['googleapiclient'] = MagicMock()
sys.modules['googleapiclient.discovery'] = MagicMock()

# Mock requests module to prevent SSL issues
# This prevents SSL certificate loading which causes permission errors
mock_requests = MagicMock()
mock_requests.get = MagicMock()
mock_requests.post = MagicMock()
mock_requests.put = MagicMock()
mock_requests.delete = MagicMock()
sys.modules['requests'] = mock_requests
sys.modules['requests.adapters'] = MagicMock()
sys.modules['requests.sessions'] = MagicMock()
sys.modules['requests.api'] = MagicMock()
sys.modules['requests.packages'] = MagicMock()
sys.modules['requests.packages.urllib3'] = MagicMock()
sys.modules['requests.packages.urllib3.util'] = MagicMock()
sys.modules['requests.packages.urllib3.util.ssl_'] = MagicMock()

# Mock urllib3 to prevent SSL context loading
sys.modules['urllib3'] = MagicMock()
sys.modules['urllib3.util'] = MagicMock()
sys.modules['urllib3.util.ssl_'] = MagicMock()
sys.modules['urllib3.poolmanager'] = MagicMock()
sys.modules['urllib3.connectionpool'] = MagicMock()

# Mock ssl module to prevent certificate access
sys.modules['ssl'] = MagicMock()
sys.modules['_ssl'] = MagicMock()

# Mock FirestoreDB class before any imports
# This prevents Firebase initialization during import
mock_firestore_db_class = MagicMock()
mock_firestore_db_instance = MagicMock()
mock_firestore_db_class.return_value = mock_firestore_db_instance

# Mock FirestoreDB module
sys.modules['firestore_db'] = MagicMock()
sys.modules['firestore_db'].FirestoreDB = mock_firestore_db_class

# Mock firebase_config module
sys.modules['firebase_config'] = MagicMock()
sys.modules['firebase_config'].initialize_firebase = MagicMock(return_value=mock_firestore_db_instance)
sys.modules['firebase_config'].get_firestore_client = MagicMock(return_value=mock_firestore_db_instance)

# Mock cache_service
sys.modules['cache_service'] = MagicMock()
sys.modules['cache_service'].get_cache = MagicMock(return_value=None)
sys.modules['cache_service'].CACHE_TTL = 300

# Mock slowapi/Limiter BEFORE any server imports
# This prevents Limiter initialization errors during server import
mock_limiter = MagicMock()
mock_get_remote_address = MagicMock(return_value="127.0.0.1")
mock_rate_limit_exceeded = MagicMock()
mock_rate_limit_handler = MagicMock()

# Create mock Limiter class that returns mock instance
class MockLimiter:
    def __init__(self, *args, **kwargs):
        pass
    def limit(self, *args, **kwargs):
        def decorator(func):
            return func
        return decorator

# Set up slowapi module structure to match what server.py imports
mock_slowapi_extension = MagicMock()
mock_slowapi_extension.Limiter = MockLimiter

mock_slowapi_util = MagicMock()
mock_slowapi_util.get_remote_address = mock_get_remote_address

mock_slowapi_errors = MagicMock()
mock_slowapi_errors.RateLimitExceeded = mock_rate_limit_exceeded

# Create main slowapi module with all expected attributes
mock_slowapi = MagicMock()
mock_slowapi.Limiter = MockLimiter
mock_slowapi._rate_limit_exceeded_handler = mock_rate_limit_handler

sys.modules['slowapi'] = mock_slowapi
sys.modules['slowapi.extension'] = mock_slowapi_extension
sys.modules['slowapi.util'] = mock_slowapi_util
sys.modules['slowapi.errors'] = mock_slowapi_errors


@pytest.fixture
def mock_firestore_db():
    """Mock Firestore database"""
    mock_db = Mock()
    mock_collection = Mock()
    mock_doc = Mock()
    
    # Setup mock chain
    mock_db.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_doc
    mock_collection.where.return_value = mock_collection
    mock_collection.order_by.return_value = mock_collection
    mock_collection.limit.return_value = mock_collection
    mock_collection.get.return_value = []
    
    return mock_db


@pytest.fixture
def sample_user():
    """Sample user for testing"""
    return {
        'id': str(uuid.uuid4()),
        'email': 'test@example.com',
        'username': 'testuser',
        'name': 'Test User',
        'password': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5ND4cjT3VJ/3e',  # "password"
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'is_active': True
    }


@pytest.fixture
def sample_session(sample_user):
    """Sample session for testing"""
    return {
        'id': str(uuid.uuid4()),
        'user_id': sample_user['id'],
        'token': 'sample_jwt_token',
        'ip_address': '127.0.0.1',
        'user_agent': 'pytest',
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24),
        'is_active': True,
        'last_activity': datetime.utcnow()
    }


@pytest.fixture
def sample_refresh_token(sample_user, sample_session):
    """Sample refresh token for testing"""
    return {
        'id': str(uuid.uuid4()),
        'user_id': sample_user['id'],
        'session_id': sample_session['id'],
        'token_hash': 'sample_hash',
        'family_id': str(uuid.uuid4()),
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(days=7),
        'is_revoked': False
    }


@pytest.fixture
def sample_link(sample_user):
    """Sample link for testing"""
    return {
        'id': str(uuid.uuid4()),
        'user_id': sample_user['id'],
        'title': 'Test Link',
        'url': 'https://example.com',
        'icon': 'link',
        'order': 0,
        'is_active': True,
        'clicks': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


@pytest.fixture
def sample_business(sample_user):
    """Sample business for testing"""
    return {
        'id': str(uuid.uuid4()),
        'owner_id': sample_user['id'],
        'name': 'Test Business',
        'description': 'A test business',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


@pytest.fixture
def sample_organization(sample_user):
    """Sample organization for testing"""
    return {
        'id': str(uuid.uuid4()),
        'owner_id': sample_user['id'],
        'name': 'Test Organization',
        'description': 'A test organization',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


@pytest.fixture
def sample_subscription(sample_user):
    """Sample subscription for testing"""
    return {
        'id': str(uuid.uuid4()),
        'owner_id': sample_user['id'],
        'owner_type': 'personal',
        'plan': 'personal',
        'status': 'trial',
        'start_date': datetime.utcnow(),
        'end_date': datetime.utcnow() + timedelta(days=14),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }


@pytest.fixture
def mock_jwt_token():
    """Mock JWT token"""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwic2Vzc2lvbl9pZCI6IjQ1NiIsImV4cCI6OTk5OTk5OTk5OX0.test"


@pytest.fixture
def mock_firebase_token():
    """Mock Firebase ID token"""
    return {
        'uid': 'firebase_uid_123',
        'email': 'firebase@example.com',
        'email_verified': True,
        'name': 'Firebase User',
        'picture': 'https://example.com/photo.jpg'
    }


@pytest.fixture
def mock_collection():
    """Mock Firestore collection"""
    from unittest.mock import MagicMock, AsyncMock
    mock = MagicMock()
    mock.find_one = AsyncMock(return_value=None)
    mock.find = AsyncMock(return_value=[])
    mock.insert_one = AsyncMock()
    mock.update_one = AsyncMock()
    mock.delete_one = AsyncMock()
    mock.count_documents = AsyncMock(return_value=0)
    return mock


@pytest.fixture
def test_client(mock_collection):
    """Test client for API testing"""
    from fastapi.testclient import TestClient
    from unittest.mock import patch, MagicMock, AsyncMock
    from fastapi import FastAPI
    
    # Create a minimal test app to avoid import issues
    # In real tests, we'll mock the server imports
    test_app = FastAPI()
    
    @test_app.get("/api/debug/health")
    async def health():
        return {"status": "ok"}
    
    client = TestClient(test_app)
    yield client


@pytest.fixture
def auth_headers(mock_jwt_token):
    """Authentication headers for testing"""
    return {
        'Authorization': f'Bearer {mock_jwt_token}'
    }


@pytest.fixture
def mock_request():
    """Mock FastAPI request object"""
    mock_req = Mock()
    mock_req.client.host = '127.0.0.1'
    mock_req.headers = {'user-agent': 'pytest'}
    return mock_req

