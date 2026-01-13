"""
Identity and Subscription Models
Phase 2: Account type resolution and subscription management

These models are additive and do not modify existing user models.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


# ==================== ACCOUNT TYPE ENUMS ====================

class AccountType:
    """Account type constants"""
    PERSONAL = "personal"
    BUSINESS_SOLO = "business_solo"
    ORGANIZATION = "organization"


class SubscriptionStatus:
    """Subscription status constants"""
    ACTIVE = "active"
    TRIAL = "trial"
    EXPIRED = "expired"
    NONE = "none"


class SubscriptionPlan:
    """Subscription plan constants"""
    PERSONAL = "personal"
    SOLO = "solo"
    ORGANIZATION = "org"


class OrganizationRole:
    """Organization role constants"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


# ==================== BUSINESS MODEL ====================

class Business(BaseModel):
    """
    Solo business / micro enterprise container
    
    Represents a single-person business or micro enterprise.
    One-to-one relationship with user (owner).
    """
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str  # References users.id
    business_name: str
    business_email: Optional[EmailStr] = None
    business_phone: Optional[str] = None
    business_address: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class BusinessCreate(BaseModel):
    """Business creation payload"""
    business_name: str
    business_email: Optional[EmailStr] = None
    business_phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None


# ==================== ORGANIZATION MODEL ====================

class Organization(BaseModel):
    """
    Multi-department organization container
    
    Represents a company or organization with multiple members.
    Can have multiple departments and members with roles.
    """
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str  # References users.id (organization creator)
    organization_name: str
    organization_email: Optional[EmailStr] = None
    organization_phone: Optional[str] = None
    organization_address: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Settings
    max_members: int = 10  # Based on subscription plan
    max_departments: int = 5
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class OrganizationCreate(BaseModel):
    """Organization creation payload"""
    organization_name: str
    organization_email: Optional[EmailStr] = None
    organization_phone: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    max_members: int = 10


# ==================== DEPARTMENT MODEL ====================

class Department(BaseModel):
    """
    Logical or permission-based grouping within an organization
    
    Departments organize members within an organization.
    Used for access control and reporting.
    """
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str  # References organizations.id
    department_name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None  # For nested departments
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class DepartmentCreate(BaseModel):
    """Department creation payload"""
    department_name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None


# ==================== MEMBERSHIP MODEL ====================

class Membership(BaseModel):
    """
    Organization role mapping
    
    Links users to organizations with specific roles.
    One user can belong to multiple organizations.
    """
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str  # References organizations.id
    user_id: str  # References users.id
    department_id: Optional[str] = None  # References departments.id
    role: str = OrganizationRole.MEMBER  # owner, admin, member
    
    # Permissions (for future use)
    permissions: Dict[str, Any] = Field(default_factory=dict)
    
    # Status
    invited_at: Optional[datetime] = None
    joined_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MembershipCreate(BaseModel):
    """Membership creation payload"""
    user_id: str
    department_id: Optional[str] = None
    role: str = OrganizationRole.MEMBER


# ==================== SUBSCRIPTION MODEL ====================

class Subscription(BaseModel):
    """
    Plan + billing state
    
    Tracks subscription status for users, businesses, or organizations.
    Determines feature access and dashboard routing.
    """
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Subscriber (one of these will be set)
    user_id: Optional[str] = None  # For personal accounts
    business_id: Optional[str] = None  # For business accounts
    organization_id: Optional[str] = None  # For organization accounts
    
    # Subscription details
    plan: str = SubscriptionPlan.PERSONAL  # personal, solo, org
    status: str = SubscriptionStatus.NONE  # active, trial, expired, none
    
    # Billing
    billing_cycle: str = "monthly"  # monthly, yearly
    amount: float = 0.0
    currency: str = "USD"
    
    # Dates
    trial_start_date: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Payment integration
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    transaction_id: Optional[str] = None  # Payment transaction ID from payment gateway
    checkout_details: Optional[Dict[str, Any]] = None  # Checkout/payment details
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class SubscriptionCreate(BaseModel):
    """Subscription creation payload"""
    plan: str
    billing_cycle: str = "monthly"
    trial_days: int = 14


# ==================== IDENTITY CONTEXT MODEL ====================

class IdentityContext(BaseModel):
    """
    Server-resolved identity context
    
    Returned by /me/context endpoint.
    Determines dashboard routing and permissions.
    """
    authenticated: bool
    account_type: str  # personal, business_solo, organization
    
    # Profile IDs
    user_id: Optional[str] = None
    profile_id: Optional[str] = None
    business_id: Optional[str] = None
    organization_id: Optional[str] = None
    department_id: Optional[str] = None
    
    # Role (for organization members)
    role: Optional[str] = None
    
    # Subscription
    subscription: Dict[str, Any] = Field(default_factory=lambda: {
        "status": SubscriptionStatus.NONE,
        "plan": None
    })
    
    # Routing decision
    next_route: str  # /dashboard, /onboarding, /billing, etc.
    
    # Additional context
    needs_onboarding: bool = False
    needs_billing: bool = False


# ==================== ONBOARDING MODELS ====================

class AccountTypeSelection(BaseModel):
    """Account type selection during onboarding"""
    account_type: str  # personal, business_solo, organization
    
    # Personal account data (if account_type = personal)
    personal_data: Optional[Dict[str, Any]] = None
    
    # Business account data (if account_type = business_solo)
    business_data: Optional[BusinessCreate] = None
    
    # Organization account data (if account_type = organization)
    organization_data: Optional[OrganizationCreate] = None


class OnboardingStatus(BaseModel):
    """Onboarding completion status"""
    completed: bool
    account_type: str
    profile_id: str
    business_id: Optional[str] = None
    organization_id: Optional[str] = None
    next_route: str

