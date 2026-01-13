"""
Unit tests for audit_log_utils.py
Tests audit logging functionality for GDPR compliance
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from audit_log_utils import (
    log_event,
    log_login,
    log_profile_update,
    log_link_action,
    log_ring_action,
    log_admin_action
)


@pytest.fixture
def mock_audit_logs_collection():
    """Mock Firestore audit_logs collection"""
    collection = MagicMock()
    collection.insert_one = AsyncMock()
    return collection


@pytest.mark.asyncio
async def test_log_event(mock_audit_logs_collection):
    """Test logging a generic event"""
    actor_id = "user_123"
    action = "test_action"
    entity_type = "test_entity"
    entity_id = "entity_123"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    metadata = {"key": "value"}
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_event(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata
        )
        
        # Verify log was inserted
        assert mock_audit_logs_collection.insert_one.called
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == actor_id
        assert call_args['action'] == action
        assert call_args['entity_type'] == entity_type
        assert call_args['entity_id'] == entity_id
        assert call_args['ip_address'] == ip_address
        assert call_args['user_agent'] == user_agent
        assert call_args['metadata'] == metadata
        assert 'timestamp' in call_args
        assert isinstance(call_args['timestamp'], datetime)


@pytest.mark.asyncio
async def test_log_login(mock_audit_logs_collection):
    """Test logging a login event"""
    user_id = "user_123"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    method = "email"
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_login(user_id, ip_address, user_agent, method)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == user_id
        assert call_args['action'] == 'login'
        assert call_args['entity_type'] == 'user'
        assert call_args['entity_id'] == user_id
        assert call_args['metadata']['method'] == method


@pytest.mark.asyncio
async def test_log_profile_update(mock_audit_logs_collection):
    """Test logging a profile update event"""
    user_id = "user_123"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    updated_fields = {"name": "New Name", "bio": "New Bio"}
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_profile_update(user_id, updated_fields, ip_address, user_agent)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == user_id
        assert call_args['action'] == 'profile_update'
        assert call_args['entity_type'] == 'user'
        assert call_args['entity_id'] == user_id
        assert call_args['metadata']['updated_fields'] == updated_fields


@pytest.mark.asyncio
async def test_log_link_action_create(mock_audit_logs_collection):
    """Test logging a link creation"""
    user_id = "user_123"
    link_id = "link_456"
    action = "create"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    link_data = {"title": "My Link", "url": "https://example.com"}
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_link_action(user_id, link_id, action, ip_address, user_agent, link_data)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == user_id
        assert call_args['action'] == 'link_create'
        assert call_args['entity_type'] == 'link'
        assert call_args['entity_id'] == link_id
        assert call_args['metadata']['link_data'] == link_data


@pytest.mark.asyncio
async def test_log_link_action_update(mock_audit_logs_collection):
    """Test logging a link update"""
    user_id = "user_123"
    link_id = "link_456"
    action = "update"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    updated_fields = {"title": "Updated Title"}
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_link_action(user_id, link_id, action, ip_address, user_agent, updated_fields)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['action'] == 'link_update'
        assert call_args['metadata']['link_data'] == updated_fields


@pytest.mark.asyncio
async def test_log_link_action_delete(mock_audit_logs_collection):
    """Test logging a link deletion"""
    user_id = "user_123"
    link_id = "link_456"
    action = "delete"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_link_action(user_id, link_id, action, ip_address, user_agent)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['action'] == 'link_delete'


@pytest.mark.asyncio
async def test_log_ring_action_assign(mock_audit_logs_collection):
    """Test logging a ring assignment"""
    admin_id = "admin_123"
    ring_id = "ring_456"
    user_id = "user_789"
    action = "assign"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_ring_action(admin_id, ring_id, action, ip_address, user_agent, user_id)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == admin_id
        assert call_args['action'] == 'ring_assign'
        assert call_args['entity_type'] == 'ring'
        assert call_args['entity_id'] == ring_id
        assert call_args['metadata']['assigned_user'] == user_id


@pytest.mark.asyncio
async def test_log_ring_action_unassign(mock_audit_logs_collection):
    """Test logging a ring unassignment"""
    admin_id = "admin_123"
    ring_id = "ring_456"
    action = "unassign"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_ring_action(admin_id, ring_id, action, ip_address, user_agent)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['action'] == 'ring_unassign'


@pytest.mark.asyncio
async def test_log_admin_action(mock_audit_logs_collection):
    """Test logging an admin action"""
    admin_id = "admin_123"
    action = "user_delete"
    target_id = "user_456"
    ip_address = "192.168.1.1"
    user_agent = "Mozilla/5.0"
    details = {"reason": "policy violation"}
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_admin_action(admin_id, action, target_id, ip_address, user_agent, details)
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == admin_id
        assert call_args['action'] == f'admin_{action}'
        assert call_args['entity_type'] == 'admin_action'
        assert call_args['entity_id'] == target_id
        assert call_args['metadata'] == details


@pytest.mark.asyncio
async def test_log_event_without_optional_params(mock_audit_logs_collection):
    """Test logging an event without optional parameters"""
    actor_id = "user_123"
    action = "test_action"
    entity_type = "test_entity"
    entity_id = "entity_123"
    
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_event(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        
        assert call_args['actor_id'] == actor_id
        assert call_args['action'] == action
        assert call_args['entity_type'] == entity_type
        assert call_args['entity_id'] == entity_id
        assert call_args.get('ip_address') is None
        assert call_args.get('user_agent') is None
        assert call_args.get('metadata', {}) == {}


@pytest.mark.asyncio
async def test_audit_log_timestamp_format(mock_audit_logs_collection):
    """Test that audit log timestamps are properly formatted"""
    with patch('backend.audit_log_utils.audit_logs_collection', mock_audit_logs_collection):
        await log_event(
            actor_id="user_123",
            action="test",
            entity_type="test",
            entity_id="123"
        )
        
        call_args = mock_audit_logs_collection.insert_one.call_args[0][0]
        timestamp = call_args['timestamp']
        
        # Verify timestamp is a datetime object
        assert isinstance(timestamp, datetime)
        
        # Verify timestamp is recent (within last minute)
        now = datetime.utcnow()
        time_diff = (now - timestamp).total_seconds()
        assert time_diff < 60  # Within 1 minute
