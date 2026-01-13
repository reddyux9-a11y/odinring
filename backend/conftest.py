"""
Pytest configuration and fixtures
"""
import pytest
import asyncio
from firestore_db import FirestoreDB
from firebase_config import initialize_firebase


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def firebase_db():
    """Initialize Firebase for tests"""
    db = initialize_firebase()
    yield db


@pytest.fixture
async def users_collection():
    """Get users collection for testing"""
    return FirestoreDB('users')


@pytest.fixture
async def links_collection():
    """Get links collection for testing"""
    return FirestoreDB('links')


@pytest.fixture
async def test_user():
    """Create a test user"""
    from datetime import datetime
    import uuid
    
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": f"test_{user_id}@test.com",
        "username": f"testuser_{user_id[:8]}",
        "name": "Test User",
        "bio": "Test bio",
        "created_at": datetime.utcnow(),
        "is_test": True
    }
    
    users_col = FirestoreDB('users')
    await users_col.insert_one(user_data)
    
    yield user_data
    
    # Cleanup
    await users_col.delete_one({"id": user_id})


@pytest.fixture
async def test_link(test_user):
    """Create a test link"""
    import uuid
    from datetime import datetime
    
    link_id = str(uuid.uuid4())
    link_data = {
        "id": link_id,
        "user_id": test_user["id"],
        "title": "Test Link",
        "url": "https://example.com",
        "order": 0,
        "clicks": 0,
        "active": True,
        "created_at": datetime.utcnow()
    }
    
    links_col = FirestoreDB('links')
    await links_col.insert_one(link_data)
    
    yield link_data
    
    # Cleanup
    await links_col.delete_one({"id": link_id})


