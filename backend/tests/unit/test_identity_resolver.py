"""
Unit tests for identity_resolver.py
Tests identity context resolution for Phase 2 features
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from backend.services.identity_resolver import IdentityResolver
from backend.models.identity_models import (
    AccountType,
    SubscriptionStatus,
    SubscriptionPlan
)


@pytest.fixture
def mock_collections():
    """Mock all Firestore collections needed for identity resolution"""
    users_collection = MagicMock()
    businesses_collection = MagicMock()
    organizations_collection = MagicMock()
    memberships_collection = MagicMock()
    subscriptions_collection = MagicMock()
    
    users_collection.find_one = AsyncMock()
    businesses_collection.find_one = AsyncMock()
    organizations_collection.find_one = AsyncMock()
    memberships_collection.find_one = AsyncMock()
    subscriptions_collection.find_one = AsyncMock()
    
    return {
        'users': users_collection,
        'businesses': businesses_collection,
        'organizations': organizations_collection,
        'memberships': memberships_collection,
        'subscriptions': subscriptions_collection
    }


@pytest.fixture
def identity_resolver(mock_collections):
    """Create IdentityResolver instance with mocked collections"""
    return IdentityResolver(
        users_collection=mock_collections['users'],
        businesses_collection=mock_collections['businesses'],
        organizations_collection=mock_collections['organizations'],
        memberships_collection=mock_collections['memberships'],
        subscriptions_collection=mock_collections['subscriptions']
    )


@pytest.mark.asyncio
async def test_resolve_personal_account(identity_resolver, mock_collections):
    """Test resolving identity for a personal account"""
    user_id = "user_123"
    
    # Mock: User exists, no business or org membership
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'user@example.com'}
    mock_collections['businesses'].find_one.return_value = None
    mock_collections['memberships'].find_one.return_value = None
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_123',
        'owner_id': user_id,
        'owner_type': 'personal',
        'plan': 'personal',
        'status': 'trial',
        'created_at': datetime.utcnow()
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.authenticated is True
    assert context.account_type == AccountType.PERSONAL
    assert context.profile_id == user_id
    assert context.business_id is None
    assert context.organization_id is None
    assert context.subscription is not None
    assert context.subscription.status == SubscriptionStatus.TRIAL
    assert context.next_route == "/dashboard/personal"


@pytest.mark.asyncio
async def test_resolve_business_solo_account(identity_resolver, mock_collections):
    """Test resolving identity for a solo business account"""
    user_id = "user_123"
    business_id = "business_456"
    
    # Mock: User owns a business
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'owner@example.com'}
    mock_collections['businesses'].find_one.return_value = {
        'id': business_id,
        'owner_id': user_id,
        'name': 'My Business'
    }
    mock_collections['memberships'].find_one.return_value = None
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_456',
        'owner_id': business_id,
        'owner_type': 'business_solo',
        'plan': 'solo',
        'status': 'active',
        'created_at': datetime.utcnow(),
        'end_date': datetime.utcnow() + timedelta(days=30)
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.authenticated is True
    assert context.account_type == AccountType.BUSINESS_SOLO
    assert context.profile_id == user_id
    assert context.business_id == business_id
    assert context.organization_id is None
    assert context.subscription.status == SubscriptionStatus.ACTIVE
    assert context.next_route == "/dashboard/business"


@pytest.mark.asyncio
async def test_resolve_organization_account(identity_resolver, mock_collections):
    """Test resolving identity for an organization account"""
    user_id = "user_123"
    org_id = "org_789"
    
    # Mock: User is member of an organization
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'member@example.com'}
    mock_collections['businesses'].find_one.return_value = None
    mock_collections['memberships'].find_one.return_value = {
        'id': 'membership_123',
        'user_id': user_id,
        'organization_id': org_id,
        'role': 'member'
    }
    mock_collections['organizations'].find_one.return_value = {
        'id': org_id,
        'owner_id': 'owner_456',
        'name': 'My Organization'
    }
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_789',
        'owner_id': org_id,
        'owner_type': 'organization',
        'plan': 'org',
        'status': 'active',
        'created_at': datetime.utcnow(),
        'end_date': datetime.utcnow() + timedelta(days=30)
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.authenticated is True
    assert context.account_type == AccountType.ORGANIZATION
    assert context.profile_id == user_id
    assert context.business_id is None
    assert context.organization_id == org_id
    assert context.subscription.status == SubscriptionStatus.ACTIVE
    assert context.next_route == "/dashboard/organization"


@pytest.mark.asyncio
async def test_resolve_expired_subscription(identity_resolver, mock_collections):
    """Test resolving identity with an expired subscription"""
    user_id = "user_123"
    
    # Mock: User with expired subscription
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'user@example.com'}
    mock_collections['businesses'].find_one.return_value = None
    mock_collections['memberships'].find_one.return_value = None
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_123',
        'owner_id': user_id,
        'owner_type': 'personal',
        'plan': 'personal',
        'status': 'expired',
        'created_at': datetime.utcnow() - timedelta(days=60),
        'end_date': datetime.utcnow() - timedelta(days=30)
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.subscription.status == SubscriptionStatus.EXPIRED
    assert context.next_route == "/billing"


@pytest.mark.asyncio
async def test_resolve_no_subscription(identity_resolver, mock_collections):
    """Test resolving identity with no subscription"""
    user_id = "user_123"
    
    # Mock: User with no subscription
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'user@example.com'}
    mock_collections['businesses'].find_one.return_value = None
    mock_collections['memberships'].find_one.return_value = None
    mock_collections['subscriptions'].find_one.return_value = None
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.subscription is None or context.subscription.status == SubscriptionStatus.NONE
    assert context.next_route == "/onboarding"


@pytest.mark.asyncio
async def test_resolve_user_not_found(identity_resolver, mock_collections):
    """Test resolving identity for non-existent user"""
    user_id = "nonexistent_user"
    
    # Mock: User not found
    mock_collections['users'].find_one.return_value = None
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    assert context.authenticated is False
    assert context.next_route == "/auth"


@pytest.mark.asyncio
async def test_resolve_organization_owner(identity_resolver, mock_collections):
    """Test resolving identity for organization owner"""
    user_id = "owner_123"
    org_id = "org_456"
    
    # Mock: User is organization owner
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'owner@example.com'}
    mock_collections['businesses'].find_one.return_value = None
    mock_collections['memberships'].find_one.return_value = {
        'id': 'membership_123',
        'user_id': user_id,
        'organization_id': org_id,
        'role': 'owner'
    }
    mock_collections['organizations'].find_one.return_value = {
        'id': org_id,
        'owner_id': user_id,
        'name': 'My Organization'
    }
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_456',
        'owner_id': org_id,
        'owner_type': 'organization',
        'plan': 'org',
        'status': 'expired',
        'created_at': datetime.utcnow() - timedelta(days=60),
        'end_date': datetime.utcnow() - timedelta(days=1)
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    # Owner should still be able to access billing even with expired subscription
    assert context.account_type == AccountType.ORGANIZATION
    assert context.organization_id == org_id
    assert context.subscription.status == SubscriptionStatus.EXPIRED
    # Owner can access billing to renew
    assert context.next_route == "/billing"


@pytest.mark.asyncio
async def test_resolve_priority_business_over_org(identity_resolver, mock_collections):
    """Test that business account takes priority over organization if user has both"""
    user_id = "user_123"
    business_id = "business_456"
    
    # Mock: User has both business and org membership (edge case)
    mock_collections['users'].find_one.return_value = {'id': user_id, 'email': 'user@example.com'}
    mock_collections['businesses'].find_one.return_value = {
        'id': business_id,
        'owner_id': user_id,
        'name': 'My Business'
    }
    # Even though org membership exists, business should take priority
    mock_collections['memberships'].find_one.return_value = {
        'id': 'membership_123',
        'user_id': user_id,
        'organization_id': 'org_789',
        'role': 'member'
    }
    mock_collections['subscriptions'].find_one.return_value = {
        'id': 'sub_456',
        'owner_id': business_id,
        'owner_type': 'business_solo',
        'plan': 'solo',
        'status': 'active',
        'created_at': datetime.utcnow()
    }
    
    context = await identity_resolver.resolve_identity_context(user_id)
    
    # Business should take priority
    assert context.account_type == AccountType.BUSINESS_SOLO
    assert context.business_id == business_id
