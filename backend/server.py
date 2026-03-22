from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response, RedirectResponse, JSONResponse
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, field_validator, EmailStr, ValidationInfo
from typing import List, Optional, Dict, Any
import uuid
import re
from datetime import datetime, timedelta, timezone
import time
import jwt
from jwt.exceptions import InvalidTokenError, DecodeError, ExpiredSignatureError
import bcrypt
import base64
import qrcode
from qrcode.image.svg import SvgPathImage
import io
import hashlib
import secrets
import requests

# Load environment variables BEFORE importing config
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Lightweight in-process cache for expensive analytics computations.
# This avoids repeated Firestore reads when the dashboard polls/re-renders.
_ANALYTICS_CACHE: Dict[str, Dict[str, Any]] = {}
_ANALYTICS_CACHE_TTL_SECONDS = 15

# Configuration (must be imported first for validation)
from config import settings

# Logging configuration (import early)
from logging_config import setup_logging, get_logger

# Error handling utilities
from error_handling import (
    handle_database_error,
    handle_authentication_error,
    handle_generic_error,
    ErrorCode,
    create_http_exception
)

# Setup logging
setup_logging()
logger = get_logger(__name__)

# Firebase/Firestore imports (replaces MongoDB)
from firebase_config import initialize_firebase
from firestore_db import FirestoreDB, DatabaseUnavailableError

# Security and compliance utilities
from audit_log_utils import (
    log_audit_event, log_login, log_logout, log_profile_update,
    log_link_create, log_link_update, log_link_delete,
    log_ring_assign, log_ring_unassign, log_admin_action,
    get_client_ip, get_user_agent
)
from session_utils import SessionManager
from refresh_token_utils import RefreshTokenManager

# Optional imports - only load if needed
try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False
    logger.warning("pillow_not_available", message="Image processing disabled")

# Google Calendar integration removed

# Environment variables for Vercel serverless functions
# Note: load_dotenv() is called earlier, before config import
# These might be loaded after module import, so we'll handle them carefully
def get_env_var(key, default=None):
    """Get environment variable with fallback for serverless environments"""
    value = os.environ.get(key)
    if value is None and default is not None:
        logger.warning(f"Environment variable {key} not found during import, using default: {default}")
        return default
    return value

# Detect if we're running in test mode
# Skip initialization in test mode - tests will use mocks
_IS_TEST_MODE = (
    'pytest' in sys.modules or
    'PYTEST_CURRENT_TEST' in os.environ or
    os.environ.get('TESTING', '').lower() in ('true', '1', 'yes')
)

# Initialize Firebase/Firestore (replaces MongoDB)
# SECURITY: Use lazy initialization to prevent Vercel 404 errors
# If env vars are missing, we log the error but don't raise during import
# This allows the app to start and return helpful error messages via health endpoint
_db = None
_db_initialization_error = None

def get_firestore_db():
    """
    Lazy initialization of Firestore database.
    
    This prevents Vercel 404 errors by allowing the app to import successfully
    even if Firebase initialization fails. The app can still respond to requests
    and provide helpful error messages via the health endpoint.
    """
    global _db, _db_initialization_error
    
    if _IS_TEST_MODE:
        return None
    
    # Return cached instance if already initialized
    if _db is not None:
        return _db
    
    # Return None if we already tried and failed (don't retry on every request)
    if _db_initialization_error is not None:
        return None
    
    # SECURITY: Validate required environment variables before initialization
    # For local dev, FIREBASE_SERVICE_ACCOUNT_JSON can be loaded from file
    service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
    service_account_file = Path(__file__).parent / 'firebase-service-account.json'
    has_firebase_creds = service_account_json or service_account_file.exists()
    
    required_env_vars = {
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'JWT_SECRET': os.getenv('JWT_SECRET')
    }
    
    missing_vars = [var for var, value in required_env_vars.items() if not value]
    if not has_firebase_creds:
        missing_vars.append('FIREBASE_SERVICE_ACCOUNT_JSON (or firebase-service-account.json file)')
    
    if missing_vars:
        error_msg = (
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            f"Set them in your environment or Vercel project settings."
        )
        logger.error(error_msg)
        _db_initialization_error = error_msg
        return None
    
    try:
        logger.info("firebase_init_start")
        _db = initialize_firebase()
        logger.info("firebase_init_success")
        return _db
    except Exception as e:
        error_msg = f"Firebase initialization failed: {str(e)}"
        logger.error("firebase_init_failed", error=str(e), exc_info=True)
        _db_initialization_error = error_msg
        # Don't raise - let app start so health endpoint can report the issue
        return None

# For backward compatibility, try to initialize on import (but don't fail if it doesn't work)
# This allows existing code that references 'db' to continue working
db = get_firestore_db()

# Firestore Collections (replaces MongoDB collections)
# SECURITY: Collections are initialized with error handling to prevent import failures
# If Firebase initialization fails, collections will be None and routes will handle gracefully
if not _IS_TEST_MODE:
    try:
        # Try to create collections - if Firebase isn't initialized, this will work
        # because FirestoreDB will call get_firestore_client() which handles initialization
        users_collection = FirestoreDB('users')
        links_collection = FirestoreDB('links')
        items_collection = FirestoreDB('items')  # Merchant items
        media_collection = FirestoreDB('media')  # User media files (images/videos)
        rings_collection = FirestoreDB('rings')
        analytics_collection = FirestoreDB('analytics')
        admins_collection = FirestoreDB('admins')
        ring_analytics_collection = FirestoreDB('ring_analytics')
        qr_scans_collection = FirestoreDB('qr_scans')
        appointments_collection = FirestoreDB('appointments')
        availability_collection = FirestoreDB('availability')
        status_checks_collection = FirestoreDB('status_checks')
        sessions_collection = FirestoreDB('sessions')
        
        # Phase 2 Collections (Identity & Subscriptions)
        businesses_collection = FirestoreDB('businesses')
        organizations_collection = FirestoreDB('organizations')
        departments_collection = FirestoreDB('departments')
        memberships_collection = FirestoreDB('memberships')
        subscriptions_collection = FirestoreDB('subscriptions')
    except Exception as e:
        # If collection creation fails (e.g., Firebase not initialized),
        # create mock collections so the app can still start
        logger.warning(f"Failed to create Firestore collections: {e}. App will start but database operations will fail.")
        from unittest.mock import MagicMock
        users_collection = MagicMock()
        links_collection = MagicMock()
        items_collection = MagicMock()
        media_collection = MagicMock()
        rings_collection = MagicMock()
        analytics_collection = MagicMock()
        admins_collection = MagicMock()
        ring_analytics_collection = MagicMock()
        qr_scans_collection = MagicMock()
        appointments_collection = MagicMock()
        availability_collection = MagicMock()
        status_checks_collection = MagicMock()
        sessions_collection = MagicMock()
        businesses_collection = MagicMock()
        organizations_collection = MagicMock()
        departments_collection = MagicMock()
        memberships_collection = MagicMock()
        subscriptions_collection = MagicMock()
else:
    # In test mode, create placeholder objects that will be replaced by mocks
    from unittest.mock import MagicMock
    users_collection = MagicMock()
    links_collection = MagicMock()
    items_collection = MagicMock()
    media_collection = MagicMock()
    rings_collection = MagicMock()
    analytics_collection = MagicMock()
    admins_collection = MagicMock()
    ring_analytics_collection = MagicMock()
    qr_scans_collection = MagicMock()
    appointments_collection = MagicMock()
    availability_collection = MagicMock()
    status_checks_collection = MagicMock()
    sessions_collection = MagicMock()
    businesses_collection = MagicMock()
    organizations_collection = MagicMock()
    departments_collection = MagicMock()
    memberships_collection = MagicMock()
    subscriptions_collection = MagicMock()

# Function to get current environment variables (for runtime checking)
def get_current_env_vars():
    """Get current environment variables - useful for debugging serverless issues"""
    # SECURITY: File-based credentials eliminated - use FIREBASE_SERVICE_ACCOUNT_JSON only
    return {
        'FIREBASE_PROJECT_ID': os.environ.get('FIREBASE_PROJECT_ID', 'NOT_SET'),
        'FIREBASE_SERVICE_ACCOUNT_JSON': 'SET' if os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON') else 'NOT_SET',
        # SECURITY: Never expose any part of JWT_SECRET value
        # Only report whether it is configured or not
        'JWT_SECRET': 'SET' if os.environ.get('JWT_SECRET') else 'NOT_SET',
        'CORS_ORIGINS': os.environ.get('CORS_ORIGINS', 'NOT_SET')
    }

# JWT Configuration - use validated settings
# SECURITY: JWT_SECRET must be at least 32 characters and stored in environment variables only
# DO NOT hardcode JWT_SECRET in code - always use environment variables
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = settings.JWT_EXPIRATION  # from settings (default 168 hours = 7 days)

# Initialize rate limiter
# In test mode, use a mock limiter - tests will replace it
if not _IS_TEST_MODE:
    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
else:
    # In test mode, create a mock limiter that doesn't actually limit
    from unittest.mock import MagicMock
    mock_limiter = MagicMock()
    # Make limit decorator return the function unchanged
    def limit_decorator(limit_str):
        def decorator(func):
            return func
        return decorator
    mock_limiter.limit = limit_decorator
    limiter = mock_limiter

# Lifespan context manager for startup/shutdown (recommended for Vercel)
# SECURITY: Keep startup minimal to prevent FUNCTION_INVOCATION_FAILED
# Database initialization is deferred to first request to avoid blocking startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown lifecycle management.
    SECURITY: Minimal startup logic to prevent blocking app initialization.
    Database operations are deferred to request handlers.
    This is the recommended approach for Vercel serverless functions.
    """
    # Minimal startup - just log that we're starting
    # Don't access collections or database during startup to avoid failures
    logger.info("🚀 Application starting...")
    
    # Yield immediately - app is ready to handle requests
    # Database initialization will happen on first request if needed
    yield
    
    # Shutdown (minimal for serverless - connections are managed per-request)
    logger.info("🛑 Application shutting down...")

# Create the main app without a prefix with enhanced OpenAPI metadata
app = FastAPI(
    lifespan=lifespan,
    title="OdinRing API",
    description="""
# OdinRing API Documentation

## Overview
Complete API for OdinRing - Smart Bio Link Platform with Physical Ring Integration

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Google Sign-In: `POST /api/auth/google-signin`

## Rate Limiting
- **Auth endpoints**: 5-10 requests/minute
- **General endpoints**: 100 requests/minute
- **Public endpoints**: 60 requests/minute

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

## Base URL
- **Production**: https://odinring.com/api
- **Development**: http://localhost:8000/api

## Response Formats
All responses are in JSON format.

### Success Response
```json
{
  "data": {},
  "message": "Success"
}
```

### Error Response
```json
{
  "detail": "Error message"
}
```

## Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `422`: Validation Error
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
""",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "OdinRing Support",
        "email": "support@odinring.com",
        "url": "https://odinring.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://odinring.com/terms"
    }
)
app.state.limiter = limiter


async def _database_unavailable_handler(request: Request, exc: DatabaseUnavailableError):
    """Return 503 when Firestore was not initialized (missing/invalid Firebase env on host)."""
    return JSONResponse(status_code=503, content={"detail": str(exc)})


# RateLimitExceeded handler only when not in test mode (needs real RateLimitExceeded class)
if not _IS_TEST_MODE:
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(DatabaseUnavailableError, _database_unavailable_handler)


def custom_openapi():
    """Custom OpenAPI schema with additional metadata"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="OdinRing API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )
    
    # Add logo
    openapi_schema["info"]["x-logo"] = {
        "url": "https://odinring.com/logo.png",
        "altText": "OdinRing Logo"
    }
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token obtained from /auth/login or /auth/register"
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Note: No middleware needed for Firestore - it handles connections automatically

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr  # Use Pydantic's EmailStr for proper validation
    password: str

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        if len(v.strip()) > 100:
            raise ValueError('Name must be 100 characters or less')
        return v.strip()

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        if not re.match(r'^[a-zA-Z0-9_-]{3,20}$', v):
            raise ValueError('Username must be 3-20 characters, alphanumeric, dashes, underscores only')
        return v.lower().strip()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if not v or len(v) < 1:
            raise ValueError('Password is required')
        return v

class User(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields like password from MongoDB
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    username: str
    email: str
    bio: Optional[str] = "Digital creator building the future one link at a time."
    avatar: Optional[str] = ""
    ring_id: Optional[str] = None
    theme: str = "light"
    accent_color: str = "#000000"
    background_color: str = "#ffffff"
    button_background_color: Optional[str] = None
    button_text_color: Optional[str] = None
    # Custom Branding fields
    custom_logo: Optional[str] = ""  # URL to uploaded logo
    show_footer: bool = True  # Whether to show "Powered by OdinRing" footer
    show_ring_badge: bool = True  # Whether to show "Ring Connected" badge
    phone_number: Optional[str] = None  # User's phone number for WhatsApp and Call buttons
    whatsapp_number: Optional[str] = None  # Optional WhatsApp number if different from phone_number
    items: List[Dict[str, Any]] = []  # Store items directly in user document
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    button_background_color: Optional[str] = None
    button_text_color: Optional[str] = None
    # Custom Branding fields
    custom_logo: Optional[str] = None
    show_footer: Optional[bool] = None
    show_ring_badge: Optional[bool] = None
    phone_number: Optional[str] = None
    whatsapp_number: Optional[str] = None
    # Typography
    font_family: Optional[str] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            if len(v.strip()) < 2:
                raise ValueError('Name must be at least 2 characters')
            if len(v.strip()) > 100:
                raise ValueError('Name must be 100 characters or less')
        return v.strip() if v else None
    
    @field_validator('bio')
    @classmethod
    def validate_bio(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Bio must be 500 characters or less')
        return v.strip() if v else None
    
    @field_validator('avatar', 'custom_logo')
    @classmethod
    def validate_url_field(cls, v):
        if v is not None and v.strip():
            # Accept both HTTP/HTTPS URLs and base64 data URLs (data:image/...;base64,...)
            if not (re.match(r'^https?://', v, re.IGNORECASE) or re.match(r'^data:image/[^;]+;base64,', v, re.IGNORECASE)):
                raise ValueError('Must be a valid HTTP/HTTPS URL or base64 data URL')
            # Increase length limit for base64 data URLs (they can be larger than regular URLs)
            max_length = 10000000 if v.startswith('data:') else 2000
            if len(v) > max_length:
                raise ValueError(f'URL must be {max_length} characters or less')
        return v.strip() if v else None
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if v:
            if not re.match(r'^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$', v.replace(' ', '')):
                raise ValueError('Invalid phone number format')
        return v

    @field_validator('whatsapp_number')
    @classmethod
    def validate_whatsapp_number(cls, v):
        if v:
            if not re.match(r'^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$', v.replace(' ', '')):
                raise ValueError('Invalid WhatsApp number format')
        return v

class LinkCreate(BaseModel):
    title: str
    url: str
    icon: str = "Globe"
    category: str = "general"
    style: str = "default"
    color: str = "#000000"
    background_color: str = "#ffffff"
    border_radius: str = "md"
    animation: str = "none"
    description: Optional[str] = ""
    phone_number: Optional[str] = None
    scheduled: bool = False
    publish_date: Optional[datetime] = None
    unpublish_date: Optional[datetime] = None

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v.strip()) > 100:
            raise ValueError('Title must be 100 characters or less')
        return v.strip()
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        # Allow http, https, mailto, tel, sms protocols
        if not re.match(r'^(https?://|mailto:|tel:|sms:)', v, re.IGNORECASE):
            raise ValueError('URL must start with http://, https://, mailto:, tel:, or sms:')
        if len(v) > 2000:
            raise ValueError('URL must be 2000 characters or less')
        return v.strip()
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v.strip() if v else ""
    
    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if v:
            # Basic phone number validation (allows +, digits, spaces, dashes, parentheses)
            if not re.match(r'^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$', v.replace(' ', '')):
                raise ValueError('Invalid phone number format')
        return v

class Link(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    url: str
    icon: str = "Globe"
    category: str = "general"
    style: str = "default"
    color: str = "#000000"
    background_color: str = "#ffffff"
    border_radius: str = "md"
    animation: str = "none"
    description: Optional[str] = ""
    phone_number: Optional[str] = None
    active: bool = True
    clicks: int = 0
    scheduled: bool = False
    publish_date: Optional[datetime] = None
    unpublish_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    order: int = 0

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None
    style: Optional[str] = None
    color: Optional[str] = None
    background_color: Optional[str] = None
    border_radius: Optional[str] = None
    animation: Optional[str] = None
    description: Optional[str] = None
    phone_number: Optional[str] = None
    active: Optional[bool] = None
    scheduled: Optional[bool] = None
    publish_date: Optional[datetime] = None
    unpublish_date: Optional[datetime] = None
    order: Optional[int] = None

    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Title cannot be empty')
            if len(v.strip()) > 100:
                raise ValueError('Title must be 100 characters or less')
        return v.strip() if v else None
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('URL cannot be empty')
            if not re.match(r'^(https?://|mailto:|tel:|sms:)', v, re.IGNORECASE):
                raise ValueError('URL must start with http://, https://, mailto:, tel:, or sms:')
            if len(v) > 2000:
                raise ValueError('URL must be 2000 characters or less')
        return v.strip() if v else None
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v.strip() if v else None

# ==================== MERCHANT ITEM MODELS ====================

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    currency: str = "USD"
    image_url: Optional[str] = None
    tags: List[str] = []
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Item name cannot be empty')
        if len(v.strip()) > 100:
            raise ValueError('Item name must be 100 characters or less')
        return v.strip()
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price must be positive')
        if v > 1000000:
            raise ValueError('Price must be less than 1,000,000')
        return round(v, 2)
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v and len(v) > 1000:
            raise ValueError('Description must be 1000 characters or less')
        return v.strip() if v else ""
    
    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        valid_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']
        if v.upper() not in valid_currencies:
            raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
        return v.upper()

class Item(BaseModel):
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = ""
    price: float
    currency: str = "USD"
    image_url: Optional[str] = None
    tags: List[str] = []
    active: bool = True
    views: int = 0
    orders: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    order: int = 0

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    active: Optional[bool] = None
    order: Optional[int] = None

class ItemOrder(BaseModel):
    """Model for item order in reorder request"""
    id: str = Field(..., description="Item ID")
    order: int = Field(..., description="New order index")

class ItemsReorderRequest(BaseModel):
    """Request model for reordering items"""
    model_config = {"extra": "forbid"}
    items_order: List[ItemOrder] = Field(..., description="List of items with their new order")

# ==================== MEDIA MODELS ====================

class MediaCreate(BaseModel):
    title: str
    type: str  # "image" or "video"
    url: str  # URL for image or embed link for video
    media_file_url: Optional[str] = None  # Media file URL (for uploaded images or video source)
    thumbnail_url: Optional[str] = None  # Optional thumbnail for video
    description: Optional[str] = ""
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v.strip()) > 100:
            raise ValueError('Title must be 100 characters or less')
        return v.strip()
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v not in ['image', 'video']:
            raise ValueError('Type must be either "image" or "video"')
        return v.lower()
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v, info: ValidationInfo):
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        
        v_stripped = v.strip()
        
        # Get the type from the model data if available
        media_type = None
        if info.data and isinstance(info.data, dict):
            media_type = info.data.get('type')
        
        # For images: allow http://, https://, or data: URLs
        # For videos: allow http://, https://, or iframe embed code
        if media_type == 'image':
            # Allow HTTP/HTTPS URLs or data URLs (base64 encoded images)
            if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.startswith('data:')):
                raise ValueError('Image URL must start with http://, https://, or data:')
            # Increased limit for base64 data URLs (can be large)
            if len(v_stripped) > 10000000:
                raise ValueError('Image URL is too long')
        elif media_type == 'video':
            # Allow HTTP/HTTPS URLs or iframe embed code
            if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.strip().startswith('<iframe')):
                raise ValueError('Video URL must be an http:// or https:// URL, or an iframe embed code')
            # Increased limit for iframe embed code
            if len(v_stripped) > 10000:
                raise ValueError('Video embed code is too long')
        else:
            # Default: allow HTTP/HTTPS URLs or data URLs (for backward compatibility)
            if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.startswith('data:') or v_stripped.strip().startswith('<iframe')):
                raise ValueError('URL must start with http://, https://, data:, or be an iframe embed code')
            if len(v_stripped) > 10000:
                raise ValueError('URL is too long')
        
        return v_stripped
    
    @field_validator('media_file_url')
    @classmethod
    def validate_media_file_url(cls, v):
        if v:
            # Allow both HTTP/HTTPS URLs and data URLs (for base64 encoded images)
            if not (re.match(r'^https?://', v, re.IGNORECASE) or v.startswith('data:')):
                raise ValueError('Media file URL must start with http://, https://, or data:')
            if len(v) > 10000000:  # Increased limit for base64 data URLs (can be large)
                raise ValueError('Media file URL is too long')
        return v.strip() if v else None
    
    @field_validator('thumbnail_url')
    @classmethod
    def validate_thumbnail_url(cls, v):
        if v:
            # Allow HTTP/HTTPS URLs or data URLs (for base64 encoded thumbnails)
            if not (re.match(r'^https?://', v, re.IGNORECASE) or v.startswith('data:')):
                raise ValueError('Thumbnail URL must start with http://, https://, or data:')
            if len(v) > 10000000:
                raise ValueError('Thumbnail URL must be 10000000 characters or less')
        return v.strip() if v else None
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v.strip() if v else ""

class Media(BaseModel):
    model_config = {"extra": "ignore"}
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    type: str  # "image" or "video"
    url: str  # URL for image or embed link for video
    media_file_url: Optional[str] = None  # Media file URL (for uploaded images or video source)
    thumbnail_url: Optional[str] = None
    description: Optional[str] = ""
    active: bool = True
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    order: int = 0

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    url: Optional[str] = None
    media_file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Title cannot be empty')
            if len(v.strip()) > 100:
                raise ValueError('Title must be 100 characters or less')
        return v.strip() if v else None
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v is not None and v not in ['image', 'video']:
            raise ValueError('Type must be either "image" or "video"')
        return v.lower() if v else None
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v, info: ValidationInfo):
        if v is not None:
            if not v.strip():
                raise ValueError('URL cannot be empty')
            
            v_stripped = v.strip()
            
            # Get the type from the model data if available
            media_type = None
            if info.data and isinstance(info.data, dict):
                media_type = info.data.get('type')
            
            # If type is not in update data, try to get it from existing media
            # This happens when only url is being updated without type
            if not media_type and hasattr(info, 'context') and info.context:
                # Try to get from context if available
                pass
            
            # For images: allow http://, https://, or data: URLs
            # For videos: allow http://, https://, or iframe embed code
            if media_type == 'image':
                # Allow HTTP/HTTPS URLs or data URLs (base64 encoded images)
                if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.startswith('data:')):
                    raise ValueError('Image URL must start with http://, https://, or data:')
                # Increased limit for base64 data URLs (can be large)
                if len(v_stripped) > 10000000:
                    raise ValueError('Image URL is too long')
            elif media_type == 'video':
                # Allow HTTP/HTTPS URLs or iframe embed code
                if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.strip().startswith('<iframe')):
                    raise ValueError('Video URL must be an http:// or https:// URL, or an iframe embed code')
                # Increased limit for iframe embed code
                if len(v_stripped) > 10000:
                    raise ValueError('Video embed code is too long')
            else:
                # Default: allow HTTP/HTTPS URLs or data URLs (for backward compatibility)
                # This handles cases where type is not provided in the update
                if not (re.match(r'^https?://', v_stripped, re.IGNORECASE) or v_stripped.startswith('data:') or v_stripped.strip().startswith('<iframe')):
                    raise ValueError('URL must start with http://, https://, data:, or be an iframe embed code')
                if len(v_stripped) > 10000:
                    raise ValueError('URL is too long')
            
            return v_stripped
        return None
    
    @field_validator('media_file_url')
    @classmethod
    def validate_media_file_url(cls, v):
        if v is not None:
            # Allow both HTTP/HTTPS URLs and data URLs (for base64 encoded images)
            if not (re.match(r'^https?://', v, re.IGNORECASE) or v.startswith('data:')):
                raise ValueError('Media file URL must start with http://, https://, or data:')
            if len(v) > 10000000:  # Increased limit for base64 data URLs (can be large)
                raise ValueError('Media file URL is too long')
        return v.strip() if v else None
    
    @field_validator('thumbnail_url')
    @classmethod
    def validate_thumbnail_url(cls, v):
        if v:
            if not re.match(r'^https?://', v, re.IGNORECASE):
                raise ValueError('Thumbnail URL must start with http:// or https://')
            if len(v) > 2000:
                raise ValueError('Thumbnail URL must be 2000 characters or less')
        return v.strip() if v else None
    
    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v.strip() if v else None

class Ring(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ring_id: str
    user_id: Optional[str] = None
    assigned_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class PublicProfile(BaseModel):
    name: str
    username: str
    bio: str
    avatar: str
    ring_id: Optional[str]
    theme: str
    accent_color: str
    background_color: str
    button_background_color: Optional[str] = None
    button_text_color: Optional[str] = None
    # Custom Branding fields
    custom_logo: Optional[str]
    show_footer: bool
    show_ring_badge: bool = True
    email: Optional[str] = None  # User's email for mail button
    phone_number: Optional[str] = None  # User's phone number for WhatsApp/Call buttons
    whatsapp_number: Optional[str] = None  # Optional WhatsApp number (if different from phone_number)
    links: List[Link]
    media: List[Media] = []  # User's media files for public view
    items: List[Dict[str, Any]] = []  # User's items for public view
    # Subscription-related gating flags
    subscription_status: Optional[str] = None
    items_locked: bool = False
    profile_views: int
    total_clicks: int

class AnalyticsData(BaseModel):
    profile_views: int
    total_clicks: int
    total_taps: Optional[int] = None
    total_engagements: Optional[int] = None
    active_links: int
    top_link: Optional[Dict[str, Any]]
    weekly_stats: List[Dict[str, Any]]
    link_performance: List[Dict[str, Any]]

class Admin(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields like password from MongoDB
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    role: str = "admin"  # admin, super_admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

class AdminLogin(BaseModel):
    username: str
    password: str

# ==================== SECURITY REQUEST MODELS ====================

class TokenRevocationRequest(BaseModel):
    """Request model for token revocation"""
    token: str = Field(..., description="JWT token to revoke")
    reason: str = Field(..., description="Reason for revocation (e.g., 'security_breach', 'compromised')")

class RingRevocationRequest(BaseModel):
    """Request model for ring revocation"""
    ring_id: str = Field(..., description="Ring ID to revoke")
    reason: str = Field(..., description="Reason for revocation (e.g., 'stolen_ring', 'security_breach')")

class ForceLogoutRequest(BaseModel):
    """Request model for forced logout"""
    user_id: str = Field(..., description="User ID to force logout")
    reason: str = Field(..., description="Reason for forced logout (e.g., 'account_compromise', 'security_breach')")

class RingAnalytics(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ring_id: str
    event_type: str  # tap, view, click
    user_id: Optional[str] = None
    link_id: Optional[str] = None
    ip_address: str
    user_agent: str
    location: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None

class AdminStats(BaseModel):
    total_users: int
    total_rings: int
    total_links: int
    total_taps: int
    active_users_today: int
    new_users_today: int
    top_rings: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    ring_performance: List[Dict[str, Any]]

class QRScanRequest(BaseModel):
    qr_type: str  # "profile" or "link"
    target_id: str  # username for profile, link_id for link

class QRScan(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    qr_type: str  # "profile" or "link"
    target_id: str  # user_id for profile QRs, link_id for link QRs
    user_id: Optional[str] = None  # The owner of the profile/link
    ip_address: str
    user_agent: str
    location: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None

# Smart Scheduling Models
class Appointment(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # The user who owns the calendar/scheduling
    client_name: str
    client_email: str
    client_phone: Optional[str] = None
    appointment_date: datetime
    duration_minutes: int = 60
    title: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    status: str = "scheduled"  # scheduled, confirmed, cancelled, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AvailabilitySlot(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "09:00"
    end_time: str    # "17:00"
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    client_name: str
    client_email: str
    client_phone: Optional[str] = None
    appointment_date: datetime
    duration_minutes: int = 60
    title: str
    description: Optional[str] = ""
    location: Optional[str] = ""

class AvailabilityCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True
    
    @field_validator('day_of_week')
    @classmethod
    def validate_day_of_week(cls, v):
        if not 0 <= v <= 6:
            raise ValueError('day_of_week must be between 0 (Monday) and 6 (Sunday)')
        return v
    
    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        import re
        if not re.match(r'^([0-1][0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format (24-hour) with leading zeros')
        return v

# ==================== UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, session_id: Optional[str] = None, expiry_minutes: Optional[int] = None) -> str:
    """
    Create JWT access token
    
    Args:
        user_id: User ID
        session_id: Optional session ID to bind token to session
        expiry_minutes: Optional custom expiry in minutes (default: 15 min for access tokens)
    
    Returns:
        JWT token string
    """
    if expiry_minutes is None:
        expiry_minutes = settings.ACCESS_TOKEN_EXPIRY_MINUTES
    
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=expiry_minutes)
    }
    
    if session_id:
        payload["session_id"] = session_id
    
    # SECURITY: JWT_SECRET is loaded from environment variables only (never hardcoded)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get current authenticated user with session validation
    
    Args:
        credentials: HTTP bearer token credentials
    
    Returns:
        Authenticated User object
    
    Raises:
        HTTPException: If authentication or session validation fails
    """
    try:
        # Verify JWT token
        user_id = verify_jwt_token(credentials.credentials)
        
        # Decode token to get session_id if present
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            session_id = payload.get("session_id")
        except (InvalidTokenError, DecodeError, ExpiredSignatureError, Exception) as e:
            logger.debug(f"JWT decode failed in optional auth: {str(e)}")
            session_id = None
        
        # Validate session if session_id is present in token
        if session_id:
            is_valid = await SessionManager.validate_session(session_id)
            if not is_valid:
                raise HTTPException(
                    status_code=401, 
                    detail="Session expired or invalid. Please log in again."
                )
        
        # Get user from database
        user_doc = await users_collection.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 401) as-is
        raise
    except Exception as e:
        # Handle database/connection errors
        if "Database" in str(e) or "connection" in str(e).lower():
            raise handle_database_error(e, "get_current_user", "Authentication failed due to database error")
        else:
            raise handle_authentication_error(e, "get_current_user", "Authentication failed")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Admin:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("admin_id")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid admin token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        # Use Firestore collection
        admin_doc = await admins_collection.find_one({"id": admin_id})
        if not admin_doc:
            raise HTTPException(status_code=401, detail="Admin not found")
        return Admin(**admin_doc)
    except HTTPException:
        raise
    except Exception as e:
        # Handle database/connection errors
        if "Database" in str(e) or "connection" in str(e).lower():
            raise handle_database_error(e, "get_current_admin", "Admin authentication failed due to database error")
        else:
            raise handle_authentication_error(e, "get_current_admin", "Admin authentication failed")

async def track_ring_event(ring_id: str, event_type: str, user_id: str = None, link_id: str = None, ip: str = "127.0.0.1", user_agent: str = "Unknown"):
    """Track ring analytics events"""
    try:
        event = RingAnalytics(
            ring_id=ring_id,
            event_type=event_type,
            user_id=user_id,
            link_id=link_id,
            ip_address=ip,
            user_agent=user_agent,
            session_id=str(uuid.uuid4())
        )
        # Use Firestore collection for analytics
        await ring_analytics_collection.insert_one(event.model_dump())
        return event
    except Exception as e:
        logger.error(f"Database error during ring event tracking: {e}", exc_info=True)
        # Don't raise error for analytics tracking failures
        return None

def generate_ring_id() -> str:
    """Generate next available ring ID in format RING_001"""
    # For now, generate a random ID since we can't query DB reliably during startup
    # In production, this would check existing rings and increment
    import random
    return f"RING_{random.randint(settings.RING_ID_MIN, settings.RING_ID_MAX):03d}"

# ==================== ADMIN AUTHENTICATION ROUTES ====================

@api_router.post("/admin/auth/login")
@limiter.limit("5/minute")  # SECURITY: Rate limit admin login attempts
async def admin_login(request: Request, login_data: AdminLogin):
    """
    Admin login endpoint with rate limiting and error handling
    """
    try:
        # Find admin by username
        admin_doc = await admins_collection.find_one({"username": login_data.username})
        if not admin_doc or not verify_password(login_data.password, admin_doc["password"]):
            # SECURITY: Log failed login attempt
            ip_address = get_client_ip(request)
            user_agent = get_user_agent(request)
            logger.warning(
                "admin_login_failed",
                username=login_data.username,
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        # Update last login
        try:
            await admins_collection.update_one(
                {"id": admin_doc["id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        except Exception as e:
            # Don't fail login if last_login update fails
            logger.warning(f"Failed to update admin last_login: {e}")
        
        # Create JWT token with admin_id
        payload = {
            "admin_id": admin_doc["id"],
            "role": admin_doc["role"],
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Log successful admin login
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
        logger.info(
            "admin_login_success",
            admin_id=admin_doc["id"],
            role=admin_doc["role"],
            ip_address=ip_address
        )
        
        admin = Admin(**admin_doc)
        return {
            "token": token,
            "admin": admin.model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/admin/auth/create")
async def create_admin(admin_data: dict, current_admin: Admin = Depends(get_current_admin)):
    # Only super_admin can create new admins
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Check if admin already exists
    existing_admin = await admins_collection.find_one({
        "$or": [{"email": admin_data["email"]}, {"username": admin_data["username"]}]
    })
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Hash password and create admin
    hashed_password = hash_password(admin_data["password"])
    admin = Admin(
        username=admin_data["username"],
        email=admin_data["email"],
        role=admin_data.get("role", "admin")
    )
    
    # Store admin with hashed password
    admin_dict = admin.model_dump()
    admin_dict["password"] = hashed_password
    await admins_collection.insert_one(admin_dict)
    
    return {"message": "Admin created successfully", "admin": admin.model_dump()}

# ==================== ADMIN USER MANAGEMENT ====================

@api_router.delete("/admin/users/{user_id}")
async def delete_user_cascade(
    user_id: str,
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Delete a user and all associated data (cascade delete)
    Admin only - requires super_admin role
    """
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions - super_admin required")
    
    logger.info("user_deletion_initiated", user_id=user_id, admin_id=current_admin.id)
    
    try:
        # 1. Find user
        user_doc = await users_collection.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 2-5. Delete user's related data using batch operations (much faster)
        batch_operations = []
        
        # Collect all deletions
        links_cursor = await links_collection.find({"user_id": user_id})
        for link in links_cursor:
            batch_operations.append({
                'type': 'delete',
                'collection': 'links',
                'filter': {"id": link["id"]}
            })
        
        qr_scans = await qr_scans_collection.find({"user_id": user_id})
        for scan in qr_scans:
            batch_operations.append({
                'type': 'delete',
                'collection': 'qr_scans',
                'filter': {"id": scan["id"]}
            })
        
        appointments = await appointments_collection.find({"user_id": user_id})
        for appt in appointments:
            batch_operations.append({
                'type': 'delete',
                'collection': 'appointments',
                'filter': {"id": appt["id"]}
            })
        
        availability = await availability_collection.find({"user_id": user_id})
        for avail in availability:
            batch_operations.append({
                'type': 'delete',
                'collection': 'availability',
                'filter': {"id": avail["id"]}
            })
        
        # Execute batch deletions (Firestore limit: 500 per batch)
        links_deleted = len([op for op in batch_operations if op['collection'] == 'links'])
        qr_deleted = len([op for op in batch_operations if op['collection'] == 'qr_scans'])
        appts_deleted = len([op for op in batch_operations if op['collection'] == 'appointments'])
        avail_deleted = len([op for op in batch_operations if op['collection'] == 'availability'])
        
        # Process in batches of 500 (Firestore limit)
        batch_size = 500
        for i in range(0, len(batch_operations), batch_size):
            batch = batch_operations[i:i + batch_size]
            # Group by collection for batch_write
            collections = {}
            for op in batch:
                coll = op['collection']
                if coll not in collections:
                    collections[coll] = []
                collections[coll].append(op)
            
            # Execute batch for each collection
            for coll_name, ops in collections.items():
                coll = {
                    'links': links_collection,
                    'qr_scans': qr_scans_collection,
                    'appointments': appointments_collection,
                    'availability': availability_collection
                }.get(coll_name)
                if coll:
                    await coll.batch_write(ops)
        
        # 6. Unassign ring if present
        ring_unassigned = False
        if user_doc.get("ring_id"):
            await rings_collection.update_one(
                {"ring_id": user_doc["ring_id"]},
                {"$set": {"user_id": None, "assigned_at": None}}
            )
            ring_unassigned = True
        
        # 7. Delete ring analytics (batch)
        analytics = await ring_analytics_collection.find({"user_id": user_id})
        analytics_deleted = len(analytics)
        if analytics:
            analytics_ops = [
                {
                    'type': 'delete',
                    'collection': 'ring_analytics',
                    'filter': {"id": event["id"]}
                }
                for event in analytics
            ]
            # Process in batches of 500
            for i in range(0, len(analytics_ops), 500):
                batch = analytics_ops[i:i + 500]
                await ring_analytics_collection.batch_write(batch)
        
        # 8. Finally delete user
        await users_collection.delete_one({"id": user_id})
        
        logger.info(
            "user_deletion_complete",
            user_id=user_id,
            email=user_doc.get("email"),
            links_deleted=links_deleted,
            qr_deleted=qr_deleted,
            appointments_deleted=appts_deleted,
            availability_deleted=avail_deleted,
            analytics_deleted=analytics_deleted,
            ring_unassigned=ring_unassigned
        )
        
        return {
            "message": "User and all associated data deleted successfully",
            "user_email": user_doc.get("email"),
            "deleted": {
                "links": links_deleted,
                "qr_scans": qr_deleted,
                "appointments": appts_deleted,
                "availability": avail_deleted,
                "analytics": analytics_deleted,
                "ring_unassigned": ring_unassigned
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("user_deletion_failed", user_id=user_id, error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# ==================== ADMIN DASHBOARD ROUTES ====================

@api_router.get("/admin/stats")
async def get_admin_stats(current_admin: Admin = Depends(get_current_admin)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get total counts
    total_users = await users_collection.count_documents({})
    total_rings = await users_collection.count_documents({"ring_id": {"$ne": None}})
    total_links = await links_collection.count_documents({})
    
    # Get total taps from ring analytics
    total_taps = await ring_analytics_collection.count_documents({"event_type": "tap"})
    
    # Get today's stats
    active_users_today = await ring_analytics_collection.distinct("user_id", {
        "timestamp": {"$gte": today},
        "user_id": {"$ne": None}
    })
    new_users_today = await users_collection.count_documents({
        "created_at": {"$gte": today}
    })
    
    # Get top performing rings
    top_rings_pipeline = [
        {"$match": {"event_type": "tap"}},
        {"$group": {"_id": "$ring_id", "tap_count": {"$sum": 1}}},
        {"$sort": {"tap_count": -1}},
        {"$limit": 10}
    ]
    top_rings_data = await ring_analytics_collection.aggregate(top_rings_pipeline)
    
    # Enhance top rings with user info
    top_rings = []
    for ring_data in top_rings_data:
        user_doc = await users_collection.find_one({"ring_id": ring_data["_id"]})
        if user_doc:
            top_rings.append({
                "ring_id": ring_data["_id"],
                "user_name": user_doc["name"],
                "username": user_doc["username"],
                "tap_count": ring_data["tap_count"]
            })
    
    # Get recent activity
    recent_events = await ring_analytics_collection.find(
        {},
        sort=[("timestamp", -1)],
        limit=20
    )
    
    recent_activity = []
    for event in recent_events:
        user_doc = None
        if event.get("user_id"):
            user_doc = await users_collection.find_one({"id": event["user_id"]})
        
        activity = {
            "id": event["id"],
            "ring_id": event["ring_id"],
            "event_type": event["event_type"],
            "timestamp": event["timestamp"],
            "ip_address": event["ip_address"],
            "user_name": user_doc["name"] if user_doc else "Unknown",
            "username": user_doc["username"] if user_doc else "Unknown"
        }
        recent_activity.append(activity)
    
    # Get ring performance for the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    performance_pipeline = [
        {"$match": {"timestamp": {"$gte": seven_days_ago}}},
        {"$group": {
            "_id": {
                "ring_id": "$ring_id",
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}
            },
            "events": {"$sum": 1}
        }},
        {"$group": {
            "_id": "$_id.ring_id",
            "daily_stats": {"$push": {"date": "$_id.date", "events": "$events"}},
            "total_events": {"$sum": "$events"}
        }},
        {"$sort": {"total_events": -1}},
        {"$limit": 5}
    ]
    
    ring_performance = await ring_analytics_collection.aggregate(performance_pipeline)
    
    return AdminStats(
        total_users=total_users,
        total_rings=total_rings,
        total_links=total_links,
        total_taps=total_taps,
        active_users_today=len(active_users_today),
        new_users_today=new_users_today,
        top_rings=top_rings,
        recent_activity=recent_activity,
        ring_performance=ring_performance
    ).model_dump()


@api_router.get(
    "/admin/validate",
    response_model=dict,
    summary="Validate data integrity",
    description="Check for orphaned links, unassigned rings, and dangling analytics. Returns structured report without mutations.",
    responses={
        200: {
            "description": "Data validation report",
            "content": {
                "application/json": {
                    "example": {
                        "status": "completed",
                        "timestamp": "2024-01-01T00:00:00",
                        "issues_found": 5,
                        "orphaned_links": [],
                        "unassigned_rings": [],
                        "dangling_analytics": [],
                        "summary": "Found 5 issues"
                    }
                }
            }
        },
        403: {"description": "Insufficient permissions"}
    },
    tags=["Admin"]
)
async def validate_data_integrity(
    request: Request,
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Validate data integrity across collections
    
    Checks for:
    - Orphaned links: Links without valid user_id
    - Unassigned rings: Ring IDs in users collection that don't have user assignments
    - Dangling analytics: Analytics records without valid user_id or link_id
    
    Returns a structured report only (no mutations).
    Admin action is logged for compliance.
    """
    # Extract client info for audit
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        validation_report = {
            "status": "in_progress",
            "timestamp": datetime.utcnow().isoformat(),
            "orphaned_links": [],
            "unassigned_rings": [],
            "dangling_analytics": [],
            "invalid_sessions": [],
            "issues_found": 0
        }
        
        # 1. Check for orphaned links (links without valid user)
        logger.info("Checking for orphaned links...")
        all_links = await links_collection.find({})
        for link in all_links:
            user_id = link.get("user_id")
            if user_id:
                user_exists = await users_collection.find_one({"id": user_id})
                if not user_exists:
                    validation_report["orphaned_links"].append({
                        "link_id": link.get("id"),
                        "title": link.get("title"),
                        "url": link.get("url"),
                        "user_id": user_id,
                        "created_at": link.get("created_at")
                    })
        
        # 2. Check for unassigned rings (ring_ids without users)
        logger.info("Checking for unassigned rings...")
        all_users = await users_collection.find({})
        assigned_ring_ids = set()
        for user in all_users:
            ring_id = user.get("ring_id")
            if ring_id:
                assigned_ring_ids.add(ring_id)
        
        # Check ring analytics for rings not assigned to any user
        all_ring_events = await ring_analytics_collection.find({})
        unassigned_rings_set = set()
        for event in all_ring_events:
            ring_id = event.get("ring_id")
            if ring_id and ring_id not in assigned_ring_ids:
                unassigned_rings_set.add(ring_id)
        
        for ring_id in unassigned_rings_set:
            # Get stats for this ring
            event_count = await ring_analytics_collection.count_documents({"ring_id": ring_id})
            validation_report["unassigned_rings"].append({
                "ring_id": ring_id,
                "event_count": event_count
            })
        
        # 3. Check for dangling analytics (analytics without valid user or link)
        logger.info("Checking for dangling analytics...")
        all_analytics = await analytics_collection.find({})
        for analytic in all_analytics:
            user_id = analytic.get("user_id")
            link_id = analytic.get("link_id")
            
            issues = []
            if user_id:
                user_exists = await users_collection.find_one({"id": user_id})
                if not user_exists:
                    issues.append("invalid_user_id")
            
            if link_id:
                link_exists = await links_collection.find_one({"id": link_id})
                if not link_exists:
                    issues.append("invalid_link_id")
            
            if issues:
                validation_report["dangling_analytics"].append({
                    "analytic_id": analytic.get("id"),
                    "user_id": user_id,
                    "link_id": link_id,
                    "issues": issues,
                    "timestamp": analytic.get("timestamp")
                })
        
        # 4. Check for invalid sessions (sessions with expired dates but still marked active)
        logger.info("Checking for invalid sessions...")
        now = datetime.utcnow()
        expired_active_sessions = await sessions_collection.find({
            "is_active": True,
            "expires_at": {"$lt": now}
        })
        
        for session in expired_active_sessions:
            validation_report["invalid_sessions"].append({
                "session_id": session.get("id"),
                "user_id": session.get("user_id"),
                "expires_at": session.get("expires_at"),
                "created_at": session.get("created_at")
            })
        
        # Calculate total issues
        validation_report["issues_found"] = (
            len(validation_report["orphaned_links"]) +
            len(validation_report["unassigned_rings"]) +
            len(validation_report["dangling_analytics"]) +
            len(validation_report["invalid_sessions"])
        )
        
        validation_report["status"] = "completed"
        validation_report["summary"] = f"Found {validation_report['issues_found']} issues"
        
        # Log admin action
        await log_admin_action(
            admin_id=current_admin.id,
            action="data_validation",
            entity_type="system",
            entity_id="integrity_check",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={
                "issues_found": validation_report["issues_found"],
                "orphaned_links": len(validation_report["orphaned_links"]),
                "unassigned_rings": len(validation_report["unassigned_rings"]),
                "dangling_analytics": len(validation_report["dangling_analytics"]),
                "invalid_sessions": len(validation_report["invalid_sessions"])
            }
        )
        
        logger.info(f"Data validation completed: {validation_report['issues_found']} issues found")
        
        return validation_report
        
    except Exception as e:
        logger.error(f"Data validation error: {e}", exc_info=True)
        
        # Log failed validation
        await log_admin_action(
            admin_id=current_admin.id,
            action="data_validation",
            entity_type="system",
            entity_id="integrity_check",
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"error": str(e)}
        )
        
        raise HTTPException(
            status_code=500,
            detail="Failed to validate data integrity"
        )


@api_router.get("/admin/rings")
async def get_all_rings(current_admin: Admin = Depends(get_current_admin)):
    # Get all users with rings
    users_docs = await users_collection.find({"ring_id": {"$ne": None}})
    rings_data = []
    
    for user_doc in users_docs:
        # Get tap count for this ring
        tap_count = await ring_analytics_collection.count_documents({
            "ring_id": user_doc["ring_id"],
            "event_type": "tap"
        })
        
        # Get link count
        link_count = await links_collection.count_documents({"user_id": user_doc["id"]})
        
        # Get last tap
        last_tap_doc = await ring_analytics_collection.find_one(
            {"ring_id": user_doc["ring_id"], "event_type": "tap"},
            sort=[("timestamp", -1)]
        )
        
        ring_info = {
            "ring_id": user_doc["ring_id"],
            "user_id": user_doc["id"],
            "user_name": user_doc["name"],
            "username": user_doc["username"],
            "email": user_doc["email"],
            "created_at": user_doc["created_at"],
            "is_active": user_doc["is_active"],
            "tap_count": tap_count,
            "link_count": link_count,
            "last_tap": last_tap_doc["timestamp"] if last_tap_doc else None
        }
        rings_data.append(ring_info)
    
    return rings_data

@api_router.get("/admin/rings/{ring_id}/analytics")
async def get_ring_analytics(ring_id: str, current_admin: Admin = Depends(get_current_admin)):
    # Get ring owner info
    user_doc = await users_collection.find_one({"ring_id": ring_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Ring not found")
    
    # Get all analytics for this ring
    analytics_data = await ring_analytics_collection.find(
        {"ring_id": ring_id},
        sort=[("timestamp", -1)]
    )
    
    # Convert ObjectId to string for JSON serialization
    for event in analytics_data:
        if "_id" in event:
            event["_id"] = str(event["_id"])
    
    # Get summary stats
    total_events = len(analytics_data)
    tap_events = len([a for a in analytics_data if a["event_type"] == "tap"])
    view_events = len([a for a in analytics_data if a["event_type"] == "view"])
    
    # Get daily breakdown for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_pipeline = [
        {"$match": {"ring_id": ring_id, "timestamp": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "taps": {"$sum": {"$cond": [{"$eq": ["$event_type", "tap"]}, 1, 0]}},
            "views": {"$sum": {"$cond": [{"$eq": ["$event_type", "view"]}, 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    daily_stats = await ring_analytics_collection.aggregate(daily_pipeline)
    
    return {
        "ring_id": ring_id,
        "user_info": {
            "name": user_doc["name"],
            "username": user_doc["username"],
            "email": user_doc["email"]
        },
        "summary": {
            "total_events": total_events,
            "tap_events": tap_events,
            "view_events": view_events
        },
        "daily_stats": daily_stats,
        "recent_events": analytics_data[:50]  # Last 50 events
    }

@api_router.get("/admin/users")
async def get_all_users(
    page: int = 1, 
    limit: int = 50,
    search: str = None,
    current_admin: Admin = Depends(get_current_admin)
):
    skip = (page - 1) * limit
    
    # Build search query
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"ring_id": {"$regex": search, "$options": "i"}}
            ]
        }
    
    # Get users with pagination
    user_docs = await users_collection.find(
        query,
        skip=skip,
        limit=limit,
        sort=[("created_at", -1)]
    )
    users = []
    
    for user_doc in user_docs:
        # Get user stats
        link_count = await links_collection.count_documents({"user_id": user_doc["id"]})
        tap_count = 0
        if user_doc.get("ring_id"):
            tap_count = await ring_analytics_collection.count_documents({
                "ring_id": user_doc["ring_id"],
                "event_type": "tap"
            })
        
        user_info = User(**user_doc).model_dump()
        user_info["link_count"] = link_count
        user_info["tap_count"] = tap_count
        users.append(user_info)
    
    # Get total count for pagination
    total_users = await users_collection.count_documents(query)
    
    return {
        "users": users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_users,
            "pages": (total_users + limit - 1) // limit
        }
    }

@api_router.put("/admin/users/{user_id}")
async def update_user_admin(
    user_id: str, 
    update_data: dict,
    current_admin: Admin = Depends(get_current_admin)
):
    # Update user
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}}
    )
    
    modified_count = result.get('modified_count', 0) if isinstance(result, dict) else getattr(result, 'modified_count', 0)
    if modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.post("/admin/users/{user_id}/deactivate")
async def deactivate_user_admin(
    user_id: str,
    current_admin: Admin = Depends(get_current_admin)
):
    # Deactivate user
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    modified_count = result.get('modified_count', 0) if isinstance(result, dict) else getattr(result, 'modified_count', 0)
    if modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deactivated successfully"}

@api_router.post("/admin/users/{user_id}/activate")
async def activate_user_admin(
    user_id: str,
    current_admin: Admin = Depends(get_current_admin)
):
    # Activate user
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {"is_active": True, "updated_at": datetime.utcnow()}}
    )
    
    modified_count = result.get('modified_count', 0) if isinstance(result, dict) else getattr(result, 'modified_count', 0)
    if modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User activated successfully"}

@api_router.post("/admin/users/{user_id}/reset-ring")
async def reset_user_ring_admin(
    user_id: str,
    current_admin: Admin = Depends(get_current_admin)
):
    # Get current user info
    user_doc = await users_collection.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_ring_id = user_doc.get("ring_id")
    
    # Reset user's ring
    result = await users_collection.update_one(
        {"id": user_id},
        {"$unset": {"ring_id": ""}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    # Log the ring reset event
    if old_ring_id:
        await track_ring_event(old_ring_id, "reset", user_id)
    
    return {"message": "User ring reset successfully", "old_ring_id": old_ring_id}

@api_router.post("/admin/users/{user_id}/assign-ring")
async def assign_ring_to_user_admin(
    user_id: str,
    ring_data: dict,
    current_admin: Admin = Depends(get_current_admin)
):
    # Check if user exists
    user_doc = await users_collection.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    ring_id = ring_data.get("ring_id")
    if not ring_id:
        raise HTTPException(status_code=400, detail="Ring ID is required")
    
    # Check if ring is already assigned
    existing_user = await users_collection.find_one({"ring_id": ring_id})
    if existing_user:
        raise HTTPException(status_code=400, detail="Ring is already assigned to another user")
    
    # Assign ring to user
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {"ring_id": ring_id, "updated_at": datetime.utcnow()}}
    )
    
    # Log the ring assignment
    await track_ring_event(ring_id, "assigned", user_id)
    
    return {"message": "Ring assigned successfully", "ring_id": ring_id}

@api_router.get("/admin/export/users")
async def export_users_csv(current_admin: Admin = Depends(get_current_admin)):
    # Get all users
    users_docs = await users_collection.find()
    users_data = []
    
    for user_doc in users_docs:
        # Get user stats
        link_count = await links_collection.count_documents({"user_id": user_doc["id"]})
        tap_count = 0
        if user_doc.get("ring_id"):
            tap_count = await ring_analytics_collection.count_documents({
                "ring_id": user_doc["ring_id"],
                "event_type": "tap"
            })
        
        user_export = {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "username": user_doc["username"],
            "email": user_doc["email"],
            "ring_id": user_doc.get("ring_id", ""),
            "is_active": user_doc["is_active"],
            "created_at": user_doc["created_at"].isoformat(),
            "link_count": link_count,
            "tap_count": tap_count
        }
        users_data.append(user_export)
    
    return {"users": users_data, "export_type": "csv", "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/admin/export/rings")
async def export_rings_csv(current_admin: Admin = Depends(get_current_admin)):
    # Get all rings (users with ring_id)
    users_docs = await users_collection.find({"ring_id": {"$ne": None}})
    rings_data = []
    
    for user_doc in users_docs:
        # Get ring analytics
        tap_count = await ring_analytics_collection.count_documents({
            "ring_id": user_doc["ring_id"],
            "event_type": "tap"
        })
        
        view_count = await ring_analytics_collection.count_documents({
            "ring_id": user_doc["ring_id"],
            "event_type": "view"
        })
        
        # Get last activity
        last_activity_doc = await ring_analytics_collection.find_one(
            {"ring_id": user_doc["ring_id"]},
            sort=[("timestamp", -1)]
        )
        
        ring_export = {
            "ring_id": user_doc["ring_id"],
            "user_name": user_doc["name"],
            "username": user_doc["username"],
            "email": user_doc["email"],
            "assigned_date": user_doc["created_at"].isoformat(),
            "tap_count": tap_count,
            "view_count": view_count,
            "last_activity": last_activity_doc["timestamp"].isoformat() if last_activity_doc else "",
            "is_active": user_doc["is_active"]
        }
        rings_data.append(ring_export)
    
    return {"rings": rings_data, "export_type": "csv", "timestamp": datetime.utcnow().isoformat()}

@api_router.post("/admin/rings/bulk-assign")
async def bulk_assign_rings_admin(
    bulk_data: dict,
    current_admin: Admin = Depends(get_current_admin)
):
    # Only super_admin can do bulk operations
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    assignments = bulk_data.get("assignments", [])
    if not assignments:
        raise HTTPException(status_code=400, detail="No assignments provided")
    
    successful_assignments = []
    failed_assignments = []
    batch_operations = []
    valid_assignments = []
    
    # First pass: Validate all assignments
    for assignment in assignments:
        user_id = assignment.get("user_id")
        ring_id = assignment.get("ring_id")
        
        if not user_id or not ring_id:
            failed_assignments.append({
                "user_id": user_id,
                "ring_id": ring_id,
                "error": "Missing user_id or ring_id"
            })
            continue
        
        try:
            # Check if user exists
            user_doc = await users_collection.find_one({"id": user_id})
            if not user_doc:
                failed_assignments.append({
                    "user_id": user_id,
                    "ring_id": ring_id,
                    "error": "User not found"
                })
                continue
            
            # Check if ring is already assigned
            existing_user = await users_collection.find_one({"ring_id": ring_id})
            if existing_user:
                failed_assignments.append({
                    "user_id": user_id,
                    "ring_id": ring_id,
                    "error": "Ring already assigned"
                })
                continue
            
            # Valid assignment - prepare for batch update
            valid_assignments.append({
                "user_id": user_id,
                "ring_id": ring_id,
                "user_doc": user_doc
            })
            
            batch_operations.append({
                'type': 'update',
                'collection': 'users',
                'filter': {"id": user_id},
                'update': {'$set': {"ring_id": ring_id, "updated_at": datetime.utcnow()}}
            })
                
        except Exception as e:
            failed_assignments.append({
                "user_id": user_id,
                "ring_id": ring_id,
                "error": str(e)
            })
    
    # Second pass: Execute batch updates (much faster than sequential)
    if batch_operations:
        try:
            batch_result = await users_collection.batch_write(batch_operations)
            updated_ids = batch_result.get('updated', [])
            
            # Track events and build success list
            for assignment in valid_assignments:
                if assignment["user_id"] in updated_ids:
                    await track_ring_event(assignment["ring_id"], "bulk_assigned", assignment["user_id"])
                    successful_assignments.append({
                        "user_id": assignment["user_id"],
                        "ring_id": assignment["ring_id"],
                        "user_name": assignment["user_doc"]["name"]
                    })
                else:
                    failed_assignments.append({
                        "user_id": assignment["user_id"],
                        "ring_id": assignment["ring_id"],
                        "error": "Failed to update user"
                    })
        except Exception as e:
            # If batch fails, add all to failed
            for assignment in valid_assignments:
                failed_assignments.append({
                    "user_id": assignment["user_id"],
                    "ring_id": assignment["ring_id"],
                    "error": f"Batch operation failed: {str(e)}"
                })
    
    return {
        "message": f"Bulk assignment completed: {len(successful_assignments)} successful, {len(failed_assignments)} failed",
        "successful": successful_assignments,
        "failed": failed_assignments
    }

# ==================== SECURITY INCIDENT RESPONSE ENDPOINTS ====================

@api_router.post(
    "/security/revoke-token",
    response_model=dict,
    summary="Revoke JWT Token",
    description="Revoke a compromised JWT token during security incidents. Admin only.",
    responses={
        200: {
            "description": "Token revoked successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "revoked",
                        "revoked_at": "2025-01-06T12:00:00Z",
                        "session_id": "session_123"
                    }
                }
            }
        },
        400: {"description": "Invalid token"},
        403: {"description": "Insufficient permissions"},
        404: {"description": "Token or session not found"}
    },
    tags=["Security"]
)
@limiter.limit("10/minute")
async def revoke_token(
    request: Request,
    token_data: TokenRevocationRequest,
    current_admin: Admin = Depends(get_current_admin)
):
    """
    SECURITY: Revoke a compromised JWT token
    
    This endpoint is used during security incidents to revoke compromised tokens.
    Requires super_admin role.
    """
    # Only super_admin can revoke tokens
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions - super_admin required")
    
    try:
        # Decode token to get user_id and session_id
        try:
            payload = jwt.decode(token_data.token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")
            session_id = payload.get("session_id")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="Token already expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="Invalid token")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Token does not contain session_id")
        
        # Revoke session
        session_doc = await sessions_collection.find_one({"id": session_id})
        if not session_doc:
            raise HTTPException(status_code=404, detail="Session not found")
        
        await sessions_collection.update_one(
            {"id": session_id},
            {"$set": {
                "is_active": False,
                "revoked_at": datetime.utcnow(),
                "revoked_reason": token_data.reason,
                "revoked_by": current_admin.id
            }}
        )
        
        # Revoke all refresh tokens for this session
        tokens_revoked = await RefreshTokenManager.invalidate_session_tokens(session_id)
        
        # Log audit event
        await log_audit_event(
            actor_id=current_admin.id,
            action="token_revoked",
            entity_type="session",
            entity_id=session_id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            metadata={
                "reason": token_data.reason,
                "user_id": user_id,
                "tokens_revoked": tokens_revoked
            },
            status="success"
        )
        
        return {
            "status": "revoked",
            "revoked_at": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "user_id": user_id,
            "tokens_revoked": tokens_revoked
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("token_revocation_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to revoke token: {str(e)}")

@api_router.post(
    "/security/revoke-ring",
    response_model=dict,
    summary="Revoke NFC Ring",
    description="Revoke a compromised NFC ring during security incidents. Admin only.",
    responses={
        200: {
            "description": "Ring revoked successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "revoked",
                        "ring_id": "RING_123",
                        "revoked_at": "2025-01-06T12:00:00Z"
                    }
                }
            }
        },
        403: {"description": "Insufficient permissions"},
        404: {"description": "Ring not found"}
    },
    tags=["Security"]
)
@limiter.limit("10/minute")
async def revoke_ring(
    request: Request,
    ring_data: RingRevocationRequest,
    current_admin: Admin = Depends(get_current_admin)
):
    """
    SECURITY: Revoke a compromised NFC ring
    
    This endpoint is used during security incidents to revoke stolen or compromised rings.
    Requires super_admin role.
    """
    # Only super_admin can revoke rings
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions - super_admin required")
    
    try:
        # Find ring
        ring_doc = await rings_collection.find_one({"ring_id": ring_data.ring_id})
        if not ring_doc:
            raise HTTPException(status_code=404, detail="Ring not found")
        
        user_id = ring_doc.get("user_id")
        
        # Revoke ring by setting status to revoked
        await rings_collection.update_one(
            {"ring_id": ring_data.ring_id},
            {"$set": {
                "is_active": False,
                "status": "revoked",
                "revoked_at": datetime.utcnow(),
                "revoked_reason": ring_data.reason,
                "revoked_by": current_admin.id
            }}
        )
        
        # Unassign ring from user if assigned
        if user_id:
            await users_collection.update_one(
                {"id": user_id},
                {"$unset": {"ring_id": ""}, "$set": {"updated_at": datetime.utcnow()}}
            )
        
        # Track ring revocation event
        if user_id:
            await track_ring_event(
                ring_data.ring_id,
                "revoked",
                user_id,
                None,
                get_client_ip(request),
                get_user_agent(request)
            )
        
        # Log audit event
        await log_audit_event(
            actor_id=current_admin.id,
            action="ring_revoked",
            entity_type="ring",
            entity_id=ring_data.ring_id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            metadata={
                "reason": ring_data.reason,
                "user_id": user_id
            },
            status="success"
        )
        
        return {
            "status": "revoked",
            "ring_id": ring_data.ring_id,
            "revoked_at": datetime.utcnow().isoformat(),
            "user_id": user_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ring_revocation_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to revoke ring: {str(e)}")

@api_router.post(
    "/security/force-logout",
    response_model=dict,
    summary="Force Logout User",
    description="Force logout all sessions for a user during security incidents. Admin only.",
    responses={
        200: {
            "description": "User logged out successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "logged_out",
                        "sessions_revoked": 3,
                        "revoked_at": "2025-01-06T12:00:00Z"
                    }
                }
            }
        },
        403: {"description": "Insufficient permissions"},
        404: {"description": "User not found"}
    },
    tags=["Security"]
)
@limiter.limit("10/minute")
async def force_logout(
    request: Request,
    logout_data: ForceLogoutRequest,
    current_admin: Admin = Depends(get_current_admin)
):
    """
    SECURITY: Force logout all sessions for a user
    
    This endpoint is used during security incidents to force logout compromised accounts.
    Requires super_admin role.
    """
    # Only super_admin can force logout
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Insufficient permissions - super_admin required")
    
    try:
        # Verify user exists
        user_doc = await users_collection.find_one({"id": logout_data.user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find all active sessions for user
        sessions = await sessions_collection.find({
            "user_id": logout_data.user_id,
            "is_active": True
        })
        
        sessions_list = list(sessions)
        sessions_revoked = 0
        
        # Revoke all sessions
        for session in sessions_list:
            session_id = session.get("id")
            if session_id:
                await sessions_collection.update_one(
                    {"id": session_id},
                    {"$set": {
                        "is_active": False,
                        "revoked_at": datetime.utcnow(),
                        "revoked_reason": logout_data.reason,
                        "revoked_by": current_admin.id
                    }}
                )
                sessions_revoked += 1
                
                # Revoke refresh tokens for this session
                await RefreshTokenManager.invalidate_session_tokens(session_id)
        
        # Revoke all refresh tokens for user (catch any that might not have session_id)
        tokens_revoked = await RefreshTokenManager.invalidate_user_tokens(logout_data.user_id)
        
        # Log audit event
        await log_audit_event(
            actor_id=current_admin.id,
            action="force_logout",
            entity_type="user",
            entity_id=logout_data.user_id,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            metadata={
                "reason": logout_data.reason,
                "sessions_revoked": sessions_revoked,
                "tokens_revoked": tokens_revoked
            },
            status="success"
        )
        
        return {
            "status": "logged_out",
            "sessions_revoked": sessions_revoked,
            "tokens_revoked": tokens_revoked,
            "revoked_at": datetime.utcnow().isoformat(),
            "user_id": logout_data.user_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("force_logout_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to force logout: {str(e)}")

# ==================== AUTHENTICATION ROUTES ====================

@api_router.post(
    "/auth/register",
    response_model=dict,
    status_code=201,
    summary="Register new user",
    description="Create a new user account with email and password. Returns JWT access token and refresh token.",
    responses={
        201: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh_token": "secure_refresh_token_here",
                        "token_type": "bearer",
                        "expires_in": 900,
                        "user": {
                            "id": "uuid-here",
                            "email": "user@example.com",
                            "username": "username",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        400: {"description": "Email or username already exists"},
        422: {"description": "Validation error"},
        429: {"description": "Rate limit exceeded (max 5/minute)"}
    },
    tags=["Authentication"]
)
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserCreate):
    """
    Register new user and create session with refresh token
    
    - Creates new user account
    - Creates a new session
    - Generates short-lived access token (15 minutes)
    - Generates long-lived refresh token (7 days)
    - Logs audit event
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Check if user already exists (check email and username separately for Firestore)
        existing_email = await users_collection.find_one({"email": user_data.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_username = await users_collection.find_one({"username": user_data.username})
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except DatabaseUnavailableError:
        raise
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Database error during user lookup: {type(e).__name__}: {str(e)}", exc_info=True)
        
        # Check if it's a connection-related error
        error_msg = str(e).lower()
        if ("ssl" in error_msg or "tls" in error_msg or "handshake" in error_msg or
            "connection" in error_msg or "timeout" in error_msg or "server selection" in error_msg):
            raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail=f"Database error: {type(e).__name__}: {str(e)}")
    
    try:
        # Hash password and create user
        hashed_password = hash_password(user_data.password)
        ring_id = generate_ring_id()
        user = User(
            name=user_data.name,
            username=user_data.username,
            email=user_data.email,
            ring_id=ring_id
        )

        # Store user with hashed password
        user_dict = user.model_dump()
        user_dict["password"] = hashed_password
        await users_collection.insert_one(user_dict)

        # Track ring assignment (don't fail if analytics fails)
        try:
            await track_ring_event(ring_id, "assigned", user.id)
            await log_ring_assign(
                user_id=user.id,
                ring_id=ring_id,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception as e:
            logger.warning(f"Analytics tracking warning: {e}", exc_info=True)
            # Continue even if analytics fails

        # Create default Standard plan subscription with 14-day trial
        try:
            from services.subscription_service import SubscriptionService
            from models.identity_models import SubscriptionCreate, SubscriptionPlan
            
            subscription_data = SubscriptionCreate(
                plan=SubscriptionPlan.SOLO,  # Default to Standard plan
                billing_cycle="yearly",
                trial_days=14  # 14-day trial period from signup
            )
            
            await SubscriptionService.create_subscription(
                subscription_data=subscription_data,
                user_id=user.id,
                actor_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            logger.info(f"Created default Standard plan subscription for new user: {user.id}")
        except Exception as e:
            logger.warning(f"Failed to create default subscription for user {user.id}: {e}")
            # Don't fail registration if subscription creation fails

        # Create session
        session = await SessionManager.create_session(
            user_id=user.id,
            token="temp",  # Will update with actual token
            ip_address=ip_address,
            user_agent=user_agent,
            expires_in_hours=settings.REFRESH_TOKEN_EXPIRY_DAYS * 24
        )
        
        session_id = session['id']
        
        # Create access token with session binding
        access_token = create_jwt_token(
            user_id=user.id,
            session_id=session_id,
            expiry_minutes=settings.ACCESS_TOKEN_EXPIRY_MINUTES
        )
        
        # Update session with actual access token
        await sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'token': access_token}}
        )
        
        # Create refresh token
        refresh_token, _ = await RefreshTokenManager.create_refresh_token(
            user_id=user.id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log successful registration (also counts as login)
        await log_login(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            method="email_register",
            status="success"
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRY_MINUTES * 60,  # seconds
            "user": user.model_dump(),
            # Legacy support
            "token": access_token
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except DatabaseUnavailableError:
        raise
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Database error during user creation: {type(e).__name__}: {str(e)}", exc_info=True)
        
        # Check if it's a connection-related error
        error_msg = str(e).lower()
        if ("ssl" in error_msg or "tls" in error_msg or "handshake" in error_msg or
            "connection" in error_msg or "timeout" in error_msg or "server selection" in error_msg):
            raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail=f"Database error: {type(e).__name__}: {str(e)}")

@api_router.post(
    "/auth/login",
    response_model=dict,
    summary="Login user",
    description="Authenticate user with email and password. Returns JWT access token and refresh token.",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh_token": "secure_refresh_token_here",
                        "token_type": "bearer",
                        "expires_in": 900,
                        "user": {
                            "id": "uuid-here",
                            "email": "user@example.com",
                            "username": "username",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        401: {"description": "Invalid credentials"},
        429: {"description": "Rate limit exceeded (max 10/minute)"}
    },
    tags=["Authentication"]
)
@limiter.limit("10/minute")
async def login(request: Request, login_data: UserLogin):
    """
    Authenticate user and create session with refresh token
    
    - Creates a new session
    - Generates short-lived access token (15 minutes)
    - Generates long-lived refresh token (7 days)
    - Logs audit event
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Find user by email
        user_doc = await users_collection.find_one({"email": login_data.email})
        if not user_doc or not verify_password(login_data.password, user_doc["password"]):
            # Log failed login attempt
            if user_doc:
                await log_login(
                    user_id=user_doc["id"],
                    ip_address=ip_address,
                    user_agent=user_agent,
                    method="email",
                    status="failure"
                )
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = User(**user_doc)
        
        # Create session (before creating tokens)
        session = await SessionManager.create_session(
            user_id=user.id,
            token="temp",  # Will update with actual token
            ip_address=ip_address,
            user_agent=user_agent,
            expires_in_hours=settings.REFRESH_TOKEN_EXPIRY_DAYS * 24
        )
        
        session_id = session['id']
        
        # Create access token with session binding
        access_token = create_jwt_token(
            user_id=user.id,
            session_id=session_id,
            expiry_minutes=settings.ACCESS_TOKEN_EXPIRY_MINUTES
        )
        
        # Update session with actual access token
        await sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'token': access_token}}
        )
        
        # Create refresh token
        refresh_token, _ = await RefreshTokenManager.create_refresh_token(
            user_id=user.id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log successful login
        await log_login(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            method="email",
            status="success"
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRY_MINUTES * 60,  # seconds
            "user": user.model_dump(),
            # Legacy support
            "token": access_token
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 401) as-is
        raise
    except Exception as e:
        # Log the actual error for debugging
        logger.error(f"Login error: {type(e).__name__}: {str(e)}", exc_info=True)
        
        # Check if it's a connection-related error
        error_msg = str(e).lower()
        if ("ssl" in error_msg or "tls" in error_msg or "handshake" in error_msg or
            "connection" in error_msg or "timeout" in error_msg or "server selection" in error_msg):
            raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")
        else:
            raise HTTPException(status_code=500, detail=f"Database error: {type(e).__name__}: {str(e)}")

# Google Sign-In model
class GoogleSignInRequest(BaseModel):
    firebase_token: str
    email: str
    name: str
    photo_url: Optional[str] = None
    uid: str
    google_access_token: Optional[str] = None  # OAuth access token for Google APIs

@api_router.post(
    "/auth/google-signin",
    response_model=dict,
    summary="Google Sign-In",
    description="Authenticate or create user with Google OAuth. Returns JWT token.",
    responses={
        200: {
            "description": "Google sign-in successful",
            "content": {
                "application/json": {
                    "example": {
                        "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "user": {
                            "id": "uuid-here",
                            "email": "user@gmail.com",
                            "username": "username",
                            "name": "User Name"
                        }
                    }
                }
            }
        },
        400: {"description": "Invalid Firebase token"},
        429: {"description": "Rate limit exceeded (max 10/minute)"}
    },
    tags=["Authentication"]
)
@limiter.limit("10/minute")
async def google_signin(request: Request, google_data: GoogleSignInRequest):
    """
    Handle Google Sign-In authentication with session and refresh token support
    Verifies Firebase token and creates/updates user in Firestore
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Import Firebase Admin SDK
        from firebase_admin import auth as firebase_auth
        
        # Verify the Firebase ID token
        try:
            decoded_token = firebase_auth.verify_id_token(google_data.firebase_token)
            firebase_uid = decoded_token['uid']
            
            # Verify the UID matches
            if firebase_uid != google_data.uid:
                raise HTTPException(status_code=401, detail="Invalid Firebase token")
                
        except Exception as e:
            logger.error(f"Firebase token verification failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
        
        # Check if user already exists
        user_doc = await users_collection.find_one({"email": google_data.email})
        
        is_new_user = False
        if user_doc:
            # Update existing user with Google info
            update_data = {
                "google_id": google_data.uid,
                "profile_photo": google_data.photo_url,
                "name": google_data.name,
                "updated_at": datetime.utcnow()
            }
            
            # Store Google access token if provided (for Google API calls)
            if google_data.google_access_token:
                update_data["google_access_token"] = google_data.google_access_token
            
            await users_collection.update_one(
                {"email": google_data.email},
                {"$set": update_data}
            )
            user = User(**user_doc)
        else:
            # Create new user
            is_new_user = True
            user_id = str(uuid.uuid4())
            username = google_data.email.split('@')[0]  # Generate username from email
            
            # Make username unique if it already exists
            base_username = username
            counter = 1
            while await users_collection.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
            
            ring_id = generate_ring_id()
            
            new_user = {
                "id": user_id,
                "email": google_data.email,
                "username": username,
                "name": google_data.name,
                "google_id": google_data.uid,
                "profile_photo": google_data.photo_url,
                "ring_id": ring_id,
                "password": "",  # No password for Google users
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Store Google access token if provided (for Google API calls)
            if google_data.google_access_token:
                new_user["google_access_token"] = google_data.google_access_token
            
            await users_collection.insert_one(new_user)
            user = User(**new_user)
            
            # Track ring assignment for new user
            try:
                await track_ring_event(ring_id, "assigned", user.id)
                await log_ring_assign(
                    user_id=user.id,
                    ring_id=ring_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                logger.warning(f"Analytics tracking warning: {e}")
            
            # Create default Standard plan subscription with 14-day trial for Google sign-ups
            try:
                from services.subscription_service import SubscriptionService
                from models.identity_models import SubscriptionCreate, SubscriptionPlan
                
                subscription_data = SubscriptionCreate(
                    plan=SubscriptionPlan.SOLO,
                    billing_cycle="yearly",
                    trial_days=14
                )
                
                await SubscriptionService.create_subscription(
                    subscription_data=subscription_data,
                    user_id=user.id,
                    actor_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                logger.info(f"Created default Standard plan subscription for new Google user: {user.id}")
            except Exception as e:
                logger.warning(f"Failed to create default subscription for Google user {user.id}: {e}")
                # Do not fail login if subscription creation fails
        
        # Create session
        session = await SessionManager.create_session(
            user_id=user.id,
            token="temp",  # Will update with actual token
            ip_address=ip_address,
            user_agent=user_agent,
            expires_in_hours=settings.REFRESH_TOKEN_EXPIRY_DAYS * 24
        )
        
        session_id = session['id']
        
        # Create access token with session binding
        access_token = create_jwt_token(
            user_id=user.id,
            session_id=session_id,
            expiry_minutes=settings.ACCESS_TOKEN_EXPIRY_MINUTES
        )
        
        # Update session with actual access token
        await sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'token': access_token}}
        )
        
        # Create refresh token
        refresh_token, _ = await RefreshTokenManager.create_refresh_token(
            user_id=user.id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log successful login
        await log_login(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            method="google",
            status="success"
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRY_MINUTES * 60,  # seconds
            "user": user.model_dump(),
            # Legacy support
            "token": access_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google Sign-In error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Google Sign-In failed: {str(e)}")

# Firebase token-based login for email/password users
class FirebaseLoginRequest(BaseModel):
    firebase_token: str
    email: str

@api_router.post(
    "/auth/firebase-login",
    response_model=dict,
    summary="Firebase Token Login",
    description="Authenticate user with Firebase ID token (for email/password users after password reset). Returns JWT token.",
    responses={
        200: {
            "description": "Firebase login successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                        "refresh_token": "refresh_token_here",
                        "user": {
                            "id": "uuid-here",
                            "email": "user@example.com"
                        }
                    }
                }
            }
        },
        401: {"description": "Invalid Firebase token or user not found"},
        429: {"description": "Rate limit exceeded (max 10/minute)"}
    },
    tags=["Authentication"]
)
@limiter.limit("10/minute")
async def firebase_login(request: Request, login_data: FirebaseLoginRequest):
    """
    Handle Firebase token-based authentication for email/password users
    Used after password reset via Firebase Auth to authenticate with backend
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Import Firebase Admin SDK
        from firebase_admin import auth as firebase_auth
        
        # Verify the Firebase ID token
        try:
            decoded_token = firebase_auth.verify_id_token(login_data.firebase_token)
            firebase_uid = decoded_token['uid']
            firebase_email = decoded_token.get('email', '')
            
            # Verify email matches
            if firebase_email.lower() != login_data.email.lower():
                raise HTTPException(status_code=401, detail="Email mismatch in Firebase token")
                
        except Exception as e:
            logger.error(f"Firebase token verification failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=401, detail="Invalid Firebase token")
        
        # Find user by email
        user_doc = await users_collection.find_one({"email": login_data.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Update user's firebase_uid if not set or different
        if user_doc.get("firebase_uid") != firebase_uid:
            await users_collection.update_one(
                {"email": login_data.email},
                {
                    "$set": {
                        "firebase_uid": firebase_uid,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        
        user = User(**user_doc)
        
        # Create session
        session = await SessionManager.create_session(
            user_id=user.id,
            token="temp",  # Will update with actual token
            ip_address=ip_address,
            user_agent=user_agent,
            expires_in_hours=settings.REFRESH_TOKEN_EXPIRY_DAYS * 24
        )
        
        session_id = session['id']
        
        # Create access token with session binding
        access_token = create_jwt_token(
            user_id=user.id,
            session_id=session_id,
            expiry_minutes=settings.ACCESS_TOKEN_EXPIRY_MINUTES
        )
        
        # Update session with actual access token
        await sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'token': access_token}}
        )
        
        # Create refresh token
        refresh_token, _ = await RefreshTokenManager.create_refresh_token(
            user_id=user.id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Log successful login
        await log_login(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            method="firebase_token",
            status="success"
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRY_MINUTES * 60,  # seconds
            "user": user.model_dump(),
            # Legacy support
            "token": access_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Firebase login error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Firebase login failed: {str(e)}")

# Logout endpoint
@api_router.post(
    "/auth/logout",
    response_model=dict,
    summary="Logout user",
    description="Invalidate user session and refresh tokens. Requires authentication.",
    responses={
        200: {"description": "Logout successful"},
        401: {"description": "Unauthorized"}
    },
    tags=["Authentication"]
)
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    """
    Logout user by invalidating session and refresh tokens
    
    - Invalidates current session
    - Invalidates all refresh tokens for the session
    - Logs audit event
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Get session_id from token if present
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                session_id = payload.get("session_id")
                
                if session_id:
                    # Invalidate session
                    await SessionManager.invalidate_session(session_id)
                    
                    # Invalidate all refresh tokens for this session
                    await RefreshTokenManager.invalidate_session_tokens(session_id)
            except Exception as e:
                # Token might be expired or invalid, that's okay for logout
                logger.debug(f"Token invalidation failed during logout (expected): {str(e)}")
        
        # Log logout event
        await log_logout(
            user_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "message": "Logged out successfully"
        }
        
    except Exception as e:
        logger.error(f"Logout error: {e}", exc_info=True)
        # Don't fail logout even if there are errors
        return {
            "message": "Logged out successfully"
        }


# Refresh token model
class RefreshTokenRequest(BaseModel):
    refresh_token: str


@api_router.post(
    "/auth/refresh",
    response_model=dict,
    summary="Refresh access token",
    description="Get a new access token using refresh token. Implements token rotation.",
    responses={
        200: {
            "description": "Token refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "new_jwt_token",
                        "refresh_token": "new_refresh_token",
                        "token_type": "bearer",
                        "expires_in": 900
                    }
                }
            }
        },
        401: {"description": "Invalid or expired refresh token"}
    },
    tags=["Authentication"]
)
@limiter.limit("20/minute")
async def refresh_token(request: Request, refresh_data: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    
    - Validates refresh token
    - Rotates refresh token (invalidates old, creates new)
    - Issues new access token
    - Enforces token rotation for security
    """
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Rotate refresh token (this validates the old token)
        rotation_result = await RefreshTokenManager.rotate_refresh_token(
            old_token=refresh_data.refresh_token,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not rotation_result:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired refresh token"
            )
        
        new_refresh_token, new_token_record = rotation_result
        user_id = new_token_record['user_id']
        session_id = new_token_record['session_id']
        
        # Validate session is still active
        is_valid = await SessionManager.validate_session(session_id)
        if not is_valid:
            # Invalidate the newly created refresh token since session is invalid
            await RefreshTokenManager.invalidate_token(new_token_record['id'])
            raise HTTPException(
                status_code=401,
                detail="Session expired. Please log in again."
            )
        
        # Create new access token
        new_access_token = create_jwt_token(
            user_id=user_id,
            session_id=session_id,
            expiry_minutes=settings.ACCESS_TOKEN_EXPIRY_MINUTES
        )
        
        # Update session with new access token
        await sessions_collection.update_one(
            {'id': session_id},
            {'$set': {'token': new_access_token, 'last_activity': datetime.utcnow()}}
        )
        
        logger.info(f"Token refreshed for user: {user_id}")
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRY_MINUTES * 60,  # seconds
            # Legacy support
            "token": new_access_token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh token"
        )


# Password reset models
class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyResetOtpRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()

def _generate_otp_6() -> str:
    # Cryptographically strong, always 6 digits
    return f"{secrets.randbelow(1_000_000):06d}"

def _hash_reset_otp(email: str, otp: str) -> str:
    # Hash OTP so we never store it in plaintext
    material = f"{settings.JWT_SECRET}:{_normalize_email(email)}:{otp}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()

def _utcnow() -> datetime:
    # Always timezone-aware UTC to avoid naive/aware comparison bugs (Firestore may return aware datetimes)
    return datetime.now(timezone.utc)

def _as_utc(dt: Any) -> Optional[datetime]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    return None

def _send_resend_otp_email(*, to_email: str, otp: str) -> None:
    api_key = os.getenv("RESEND_API_KEY") or getattr(settings, "RESEND_API_KEY", None)
    if not api_key:
        raise RuntimeError("RESEND_API_KEY not configured")

    from_email = os.getenv("RESEND_FROM_EMAIL") or getattr(settings, "RESEND_FROM_EMAIL", None) or "onboarding@resend.dev"
    subject = "Your OdinRing password reset code"
    html = f"""
    <div style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; line-height:1.5;">
      <h2 style="margin:0 0 12px;">Password reset</h2>
      <p style="margin:0 0 12px;">Use the code below to reset your password. This code expires in 10 minutes.</p>
      <div style="font-size:28px; letter-spacing:6px; font-weight:700; padding:12px 16px; border:1px solid #e5e7eb; border-radius:10px; display:inline-block;">
        {otp}
      </div>
      <p style="margin:16px 0 0; color:#6b7280; font-size:12px;">
        If you didn't request this, you can ignore this email.
      </p>
    </div>
    """.strip()

    resp = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html,
        },
        timeout=15,
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Resend API error: {resp.status_code} {resp.text}")

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset - sends an email OTP (if account exists)."""
    try:
        email = _normalize_email(request.email)
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        # SECURITY: Don't reveal if email exists
        user_doc = await users_collection.find_one({"email": email})
        if not user_doc:
            return {"message": "If an account exists with this email, an OTP has been sent."}

        otp = _generate_otp_6()
        otp_hash = _hash_reset_otp(email, otp)
        otp_expiry = _utcnow() + timedelta(minutes=10)

        # Store OTP hash (not OTP) and reset any prior reset state
        await users_collection.update_one(
            {"email": email},
            {"$set": {
                "reset_otp_hash": otp_hash,
                "reset_otp_expiry": otp_expiry,
                "reset_otp_attempts": 0,
                "reset_otp_verified": False,
                "reset_token": None,
                "reset_token_expiry": None,
                "updated_at": _utcnow()
            }}
        )

        # Send via Resend
        try:
            _send_resend_otp_email(to_email=email, otp=otp)
        except Exception as send_err:
            logger.error(f"Resend OTP email failed: {type(send_err).__name__}: {send_err}", exc_info=True)
            # Don't leak provider details to client
            raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again.")

        return {"message": "If an account exists with this email, an OTP has been sent."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forgot password error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing password reset request")

@api_router.post("/auth/verify-reset-otp")
async def verify_reset_otp(request: VerifyResetOtpRequest):
    """Verify OTP and mint a short-lived reset token."""
    try:
        email = _normalize_email(request.email)
        otp = (request.otp or "").strip()
        if not email or not otp:
            raise HTTPException(status_code=400, detail="Email and OTP are required")
        if not re.fullmatch(r"\d{6}", otp):
            raise HTTPException(status_code=400, detail="OTP must be 6 digits")

        user_doc = await users_collection.find_one({"email": email})
        if not user_doc:
            raise HTTPException(status_code=400, detail="Invalid OTP")

        otp_expiry = _as_utc(user_doc.get("reset_otp_expiry"))
        otp_hash = user_doc.get("reset_otp_hash")
        attempts = int(user_doc.get("reset_otp_attempts") or 0)

        if not otp_expiry or not otp_hash:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        if _utcnow() > otp_expiry:
            await users_collection.update_one(
                {"email": email},
                {"$unset": {"reset_otp_hash": "", "reset_otp_expiry": "", "reset_otp_attempts": "", "reset_otp_verified": ""}}
            )
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        if attempts >= 5:
            raise HTTPException(status_code=429, detail="Too many attempts. Please request a new OTP.")

        candidate_hash = _hash_reset_otp(email, otp)
        if not secrets.compare_digest(candidate_hash, otp_hash):
            await users_collection.update_one(
                {"email": email},
                {"$set": {"reset_otp_attempts": attempts + 1, "updated_at": _utcnow()}}
            )
            raise HTTPException(status_code=400, detail="Invalid OTP")

        reset_token = str(uuid.uuid4())
        reset_token_expiry = _utcnow() + timedelta(minutes=15)

        await users_collection.update_one(
            {"email": email},
            {"$set": {
                "reset_otp_verified": True,
                "reset_token": reset_token,
                "reset_token_expiry": reset_token_expiry,
                "updated_at": _utcnow()
            }}
        )

        return {"message": "OTP verified", "reset_token": reset_token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify reset OTP error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error verifying OTP")

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using short-lived reset token (minted after OTP verify)."""
    try:
        # Find user by reset token
        user_doc = await users_collection.find_one({"reset_token": request.token})
        if not user_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        # Check if token is expired
        reset_token_expiry = _as_utc(user_doc.get("reset_token_expiry"))
        if not reset_token_expiry:
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        if _utcnow() > reset_token_expiry:
            # Clear expired token
            await users_collection.update_one(
                {"reset_token": request.token},
                {"$unset": {"reset_token": "", "reset_token_expiry": ""}}
            )
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
        
        # Validate new password
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        # Hash new password
        hashed_password = hash_password(request.new_password)
        
        # Update password and clear reset token
        await users_collection.update_one(
            {"reset_token": request.token},
            {"$set": {
                "password": hashed_password,
                "updated_at": _utcnow()
            },
             "$unset": {
                "reset_token": "",
                "reset_token_expiry": ""
            }}
        )
        
        return {"message": "Password has been reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")

# ==================== USER ROUTES ====================

@api_router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user.model_dump()


@api_router.get("/dashboard/data")
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    """
    Get all dashboard data in a single optimized request
    PERFORMANCE: Reduces load time from 33s to 2-3s by combining all queries
    
    Returns:
        {
            "links": [...],
            "media": [...],
            "items": [...],
            "ring_settings": {...}
        }
    """
    logger.info(f"📊 GET /dashboard/data - Loading all data for user: {current_user.email}")
    
    try:
        # Load all data in parallel using asyncio
        import asyncio
        
        # Parallel queries - much faster than sequential
        # Execute queries in parallel
        link_docs, media_docs, user_doc = await asyncio.gather(
            links_collection.find({"user_id": current_user.id}),
            media_collection.find({"user_id": current_user.id}),
            users_collection.find_one({"id": current_user.id}),
            return_exceptions=True
        )
        
        # Handle exceptions
        if isinstance(link_docs, Exception):
            logger.error(f"Error loading links: {link_docs}")
            link_docs = []
        if isinstance(media_docs, Exception):
            logger.error(f"Error loading media: {media_docs}")
            media_docs = []
        if isinstance(user_doc, Exception):
            logger.error(f"Error loading user: {user_doc}")
            user_doc = None
        
        # Process links
        links = [Link(**link_doc) for link_doc in link_docs] if link_docs else []
        links.sort(key=lambda x: x.order)
        
        # Process media
        media = [Media(**media_doc) for media_doc in media_docs] if media_docs else []
        media.sort(key=lambda x: x.order)
        
        # Process items (from user document)
        items = []
        if user_doc:
            items_data = user_doc.get("items", [])
            items = sorted(items_data, key=lambda x: x.get("order", 0))
        
        # Load ring settings (if ring_id exists)
        ring_settings = {}
        if current_user.ring_id:
            try:
                ring_settings_doc = await rings_collection.find_one({"ring_id": current_user.ring_id})
                if ring_settings_doc:
                    ring_settings = {
                    }
            except Exception as e:
                logger.warning(f"Failed to load ring settings: {e}")
        
        logger.info(f"✅ GET /dashboard/data - Loaded {len(links)} links, {len(media)} media, {len(items)} items")
        
        return {
            "links": [link.model_dump() for link in links],
            "media": [m.model_dump() for m in media],
            "items": items,
            "ring_settings": ring_settings
        }
        
    except Exception as e:
        logger.error(f"Error in get_dashboard_data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard data: {str(e)}")


# ==================== IDENTITY CONTEXT ENDPOINT (Phase 2) ====================

@api_router.get(
    "/me/context",
    response_model=dict,
    summary="Get identity context",
    description="Resolve account type, subscription status, and routing decision. Phase 2: Non-breaking identity resolution.",
    responses={
        200: {
            "description": "Identity context resolved",
            "content": {
                "application/json": {
                    "example": {
                        "authenticated": True,
                        "account_type": "personal",
                        "user_id": "uuid",
                        "profile_id": "uuid",
                        "subscription": {
                            "status": "active",
                            "plan": "personal"
                        },
                        "next_route": "/dashboard"
                    }
                }
            }
        },
        401: {"description": "Unauthorized"}
    },
    tags=["Identity & Context"]
)
async def get_identity_context(current_user: User = Depends(get_current_user)):
    """
    Get complete identity context for routing and permissions
    
    Phase 2: Identity-aware sign-in
    - Determines account type (personal, business_solo, organization)
    - Resolves subscription status
    - Returns routing decision
    - Non-breaking: Existing users treated as personal accounts
    
    Returns:
        IdentityContext with account type and routing decision
    """
    try:
        # Import identity resolver
        from services.identity_resolver import IdentityResolver
        
        # Resolve identity
        context = await IdentityResolver.resolve_identity(current_user.id)
        
        # Log context resolution for debugging
        logger.info(f"Identity context resolved for user {current_user.id}: account_type={context.account_type}")
        
        return context.model_dump()
        
    except Exception as e:
        logger.error(f"Error resolving identity context: {e}", exc_info=True)
        
        # Return safe default (personal account, allow access)
        from models.identity_models import IdentityContext, AccountType, SubscriptionStatus
        
        default_context = IdentityContext(
            authenticated=True,
            account_type=AccountType.PERSONAL,
            user_id=current_user.id,
            profile_id=current_user.id,
            subscription={
                "status": SubscriptionStatus.NONE,
                "plan": None
            },
            next_route="/dashboard"
        )
        
        return default_context.model_dump()


@api_router.put("/me")
async def update_current_user(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user profile with audit logging"""
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Track which fields were updated for audit log
    fields_updated = list(update_data.keys())
    
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Log profile update
    await log_profile_update(
        user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent,
        fields_updated=fields_updated
    )
    
    # Return updated user
    updated_user_doc = await users_collection.find_one({"id": current_user.id})
    return User(**updated_user_doc).model_dump()

# Security: change password
class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.post("/me/change-password")
async def change_password(payload: PasswordChange, current_user: User = Depends(get_current_user)):
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, user_doc.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    hashed = hash_password(payload.new_password)
    await users_collection.update_one({"id": current_user.id}, {"$set": {"password": hashed, "updated_at": datetime.utcnow()}})
    return {"success": True}

# Security: deactivate or reactivate own account
@api_router.post("/me/deactivate")
async def deactivate_self(current_user: User = Depends(get_current_user)):
    await users_collection.update_one({"id": current_user.id}, {"$set": {"is_active": False, "updated_at": datetime.utcnow()}})
    return {"success": True}

@api_router.post("/me/reactivate")
async def reactivate_self(current_user: User = Depends(get_current_user)):
    await users_collection.update_one({"id": current_user.id}, {"$set": {"is_active": True, "updated_at": datetime.utcnow()}})
    return {"success": True}


# ==================== GDPR DATA EXPORT ====================

@api_router.get(
    "/users/export",
    response_model=dict,
    summary="Export user data (GDPR compliance)",
    description="Export all user data including profile, links, analytics, ring assignments, and appointments. GDPR Article 20 - Right to data portability.",
    responses={
        200: {
            "description": "User data exported successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user": {"id": "...", "email": "..."},
                        "links": [],
                        "analytics": {},
                        "ring_assignments": [],
                        "appointments": [],
                        "exported_at": "2024-01-01T00:00:00"
                    }
                }
            }
        },
        401: {"description": "Unauthorized"}
    },
    tags=["User Data & GDPR"]
)
async def export_user_data(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Export all user data in JSON format (GDPR compliance)
    
    Returns comprehensive user data including:
    - User profile
    - Links (all created links)
    - Analytics (profile views, clicks)
    - Ring assignments and events
    - Appointments and availability
    - QR scan history
    - Sessions (active and historical)
    
    This endpoint fulfills GDPR Article 20 (Right to data portability)
    and Article 15 (Right of access).
    """
    # Extract client info for audit
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # 1. Get user profile
        user_doc = await users_collection.find_one({"id": current_user.id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove sensitive fields (hashed password)
        user_export = {k: v for k, v in user_doc.items() if k != 'password'}
        
        # 2. Get all user links
        links = await links_collection.find({"user_id": current_user.id})
        links_export = [link for link in links]
        
        # 3. Get analytics data
        analytics_docs = await analytics_collection.find({"user_id": current_user.id})
        analytics_export = {
            "profile_views": user_doc.get("profile_views", 0),
            "total_clicks": user_doc.get("total_clicks", 0),
            "detailed_analytics": [doc for doc in analytics_docs]
        }
        
        # 4. Get ring analytics/events
        ring_id = user_doc.get("ring_id")
        ring_analytics = []
        if ring_id:
            ring_events = await ring_analytics_collection.find({"user_id": current_user.id})
            ring_analytics = [event for event in ring_events]
        
        # 5. Get appointments
        appointments = await appointments_collection.find({"user_id": current_user.id})
        appointments_export = [appt for appt in appointments]
        
        # 6. Get availability settings
        availability = await availability_collection.find({"user_id": current_user.id})
        availability_export = [slot for slot in availability]
        
        # 7. Get QR scan history
        qr_scans = await qr_scans_collection.find({"user_id": current_user.id})
        qr_scans_export = [scan for scan in qr_scans]
        
        # 8. Get sessions (active and historical)
        sessions = await sessions_collection.find({"user_id": current_user.id})
        sessions_export = [
            {
                "session_id": s.get("id"),
                "created_at": s.get("created_at"),
                "expires_at": s.get("expires_at"),
                "is_active": s.get("is_active"),
                "ip_address": s.get("ip_address"),
                "user_agent": s.get("user_agent")
            }
            for s in sessions
        ]
        
        # Compile export data
        export_data = {
            "user_profile": user_export,
            "links": links_export,
            "analytics": analytics_export,
            "ring_assignments": ring_analytics,
            "appointments": appointments_export,
            "availability": availability_export,
            "qr_scans": qr_scans_export,
            "sessions": sessions_export,
            "exported_at": datetime.utcnow().isoformat(),
            "export_format_version": "1.0"
        }
        
        # Log GDPR export event
        await log_audit_event(
            actor_id=current_user.id,
            action="gdpr_export",
            entity_type="user",
            entity_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"export_format_version": "1.0"},
            status="success"
        )
        
        logger.info(f"GDPR data export completed for user: {current_user.id}")
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GDPR export error: {e}", exc_info=True)
        
        # Log failed export attempt
        await log_audit_event(
            actor_id=current_user.id,
            action="gdpr_export",
            entity_type="user",
            entity_id=current_user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            status="failure",
            metadata={"error": str(e)}
        )
        
        raise HTTPException(
            status_code=500,
            detail="Failed to export user data"
        )


@api_router.post("/upload-logo")
async def upload_custom_logo(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload custom logo for branding"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Validate file size (5MB limit)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Convert to base64 for storage (simple approach)
        base64_content = base64.b64encode(file_content).decode('utf-8')
        logo_url = f"data:{file.content_type};base64,{base64_content}"
        
        # Update user's custom logo and avatar (they use the same image)
        await users_collection.update_one(
            {"id": current_user.id},
            {"$set": {"custom_logo": logo_url, "avatar": logo_url, "updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "logo_url": logo_url}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@api_router.post("/upload-media")
async def upload_media_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Upload media image for media files (does NOT update user logo)
    
    This endpoint is specifically for uploading images to be used in media files.
    It processes images by:
    - Resizing to 200x200px (maintaining aspect ratio)
    - Converting to WebP format
    - Compressing for optimal file size
    - Generating thumbnail (100x100px) for grid views
    
    Returns both full image and thumbnail as base64 data URLs.
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Validate file size (5MB limit)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Check if Pillow is available
        try:
            from PIL import Image
            import io
            
            # Open image from bytes
            image = Image.open(io.BytesIO(file_content))
            
            # Convert RGBA to RGB if necessary (WebP doesn't support RGBA well)
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background for transparency
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                rgb_image.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = rgb_image
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize main image to 200x200 (maintaining aspect ratio)
            image.thumbnail((200, 200), Image.Resampling.LANCZOS)
            
            # Create thumbnail for grid view (100x100)
            thumbnail = image.copy()
            thumbnail.thumbnail((100, 100), Image.Resampling.LANCZOS)
            
            # Convert to WebP with compression
            # Quality 85 provides good balance between size and quality
            main_image_buffer = io.BytesIO()
            image.save(main_image_buffer, format='WEBP', quality=85, method=6)
            main_image_buffer.seek(0)
            
            thumbnail_buffer = io.BytesIO()
            thumbnail.save(thumbnail_buffer, format='WEBP', quality=80, method=6)
            thumbnail_buffer.seek(0)
            
            # Convert to base64
            main_base64 = base64.b64encode(main_image_buffer.getvalue()).decode('utf-8')
            thumbnail_base64 = base64.b64encode(thumbnail_buffer.getvalue()).decode('utf-8')
            
            # Create data URLs
            image_url = f"data:image/webp;base64,{main_base64}"
            thumbnail_url = f"data:image/webp;base64,{thumbnail_base64}"
            
            # Return both full image and thumbnail
            return {
                "success": True,
                "image_url": image_url,
                "thumbnail_url": thumbnail_url
            }
            
        except ImportError:
            # Fallback if Pillow is not available
            logger.warning("Pillow not available, using original image without processing")
            base64_content = base64.b64encode(file_content).decode('utf-8')
            image_url = f"data:{file.content_type};base64,{base64_content}"
            return {"success": True, "image_url": image_url, "thumbnail_url": image_url}
    
    except Exception as e:
        logger.error(f"Failed to process image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# ==================== QR CODE GENERATION ROUTES ====================

@api_router.get("/qr/profile")
async def generate_profile_qr(
    request: Request,
    format: str = "png",
    fill: str = "black",
    back: str = "white",
    box_size: int = 10,
    border: int = 4,
    current_user: User = Depends(get_current_user)
):
    """Generate QR code for user's profile"""
    try:
        # Create tracking URL that logs scan then redirects
        base_url = str(request.base_url).rstrip('/')
        # Sanitize username for URL (replace spaces with underscores)
        sanitized_username = current_user.username.replace(' ', '_')
        profile_url = f"{base_url}/api/qr/scan/profile/{sanitized_username}"
        
        # Generate QR code
        # Clamp values
        box_size = max(2, min(int(box_size), 20))
        border = max(1, min(int(border), 8))

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=box_size,
            border=border,
        )
        qr.add_data(profile_url)
        qr.make(fit=True)
        
        if format.lower() == "svg":
            # Generate SVG format
            img = qr.make_image(image_factory=SvgPathImage)
            svg_buffer = io.BytesIO()
            img.save(svg_buffer)
            svg_content = svg_buffer.getvalue()
            
            return Response(
                content=svg_content,
                media_type="image/svg+xml",
                headers={"Content-Disposition": f"attachment; filename=profile-qr.svg"}
            )
        else:
            # Generate PNG format
            img = qr.make_image(fill_color=fill, back_color=back)
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            return Response(
                content=img_buffer.getvalue(),
                media_type="image/png",
                headers={"Content-Disposition": f"attachment; filename=profile-qr.png"}
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")

@api_router.get("/qr/profile/base64")
async def get_profile_qr_base64(
    request: Request,
    fill: str = "black",
    back: str = "white",
    box_size: int = 10,
    border: int = 4,
    current_user: User = Depends(get_current_user)
):
    """Get profile QR code as base64 string for display"""
    try:
        # Create tracking URL that logs scan then redirects
        base_url = str(request.base_url).rstrip('/')
        # Sanitize username for URL (replace spaces with underscores)
        sanitized_username = current_user.username.replace(' ', '_')
        profile_url = f"{base_url}/api/qr/scan/profile/{sanitized_username}"
        
        # Generate QR code
        # Clamp values
        box_size = max(2, min(int(box_size), 20))
        border = max(1, min(int(border), 8))

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=box_size,
            border=border,
        )
        qr.add_data(profile_url)
        qr.make(fit=True)
        
        # Generate PNG
        img = qr.make_image(fill_color=fill, back_color=back)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Convert to base64
        base64_content = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        qr_data_url = f"data:image/png;base64,{base64_content}"
        
        return {
            "qr_code": qr_data_url,
            "url": profile_url,
            "format": "png"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")

@api_router.get("/qr/link/{link_id}")
async def generate_link_qr(
    request: Request,
    link_id: str,
    format: str = "png",
    fill: str = "black",
    back: str = "white",
    box_size: int = 10,
    border: int = 4,
    current_user: User = Depends(get_current_user)
):
    """Generate QR code for a specific link"""
    try:
        # Find the link
        link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
        if not link_doc:
            raise HTTPException(status_code=404, detail="Link not found")
        
        link = Link(**link_doc)
        
        # Generate QR code for tracking URL that logs scan then redirects
        # Clamp values
        box_size = max(2, min(int(box_size), 20))
        border = max(1, min(int(border), 8))

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=box_size,
            border=border,
        )
        base_url = str(request.base_url).rstrip('/')
        link_url = f"{base_url}/api/qr/scan/link/{link.id}"
        qr.add_data(link_url)
        qr.make(fit=True)
        
        if format.lower() == "svg":
            # Generate SVG format
            img = qr.make_image(image_factory=SvgPathImage)
            svg_buffer = io.BytesIO()
            img.save(svg_buffer)
            svg_content = svg_buffer.getvalue()
            
            return Response(
                content=svg_content,
                media_type="image/svg+xml",
                headers={"Content-Disposition": f"attachment; filename={link.title}-qr.svg"}
            )
        else:
            # Generate PNG format
            img = qr.make_image(fill_color=fill, back_color=back)
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            return Response(
                content=img_buffer.getvalue(),
                media_type="image/png",
                headers={"Content-Disposition": f"attachment; filename={link.title}-qr.png"}
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 404) as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate link QR code: {str(e)}")

@api_router.get("/qr/link/{link_id}/base64")
async def get_link_qr_base64(
    request: Request,
    link_id: str,
    fill: str = "black",
    back: str = "white",
    box_size: int = 10,
    border: int = 4,
    current_user: User = Depends(get_current_user)
):
    """Get link QR code as base64 string for display"""
    try:
        # Find the link
        link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
        if not link_doc:
            raise HTTPException(status_code=404, detail="Link not found")
        
        link = Link(**link_doc)
        
        # Generate QR code for tracking URL that logs scan then redirects
        # Clamp values
        box_size = max(2, min(int(box_size), 20))
        border = max(1, min(int(border), 8))

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=box_size,
            border=border,
        )
        base_url = str(request.base_url).rstrip('/')
        link_url = f"{base_url}/api/qr/scan/link/{link.id}"
        qr.add_data(link_url)
        qr.make(fit=True)
        
        # Generate PNG
        img = qr.make_image(fill_color=fill, back_color=back)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Convert to base64
        base64_content = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        qr_data_url = f"data:image/png;base64,{base64_content}"
        
        return {
            "qr_code": qr_data_url,
            "url": link_url,
            "title": link.title,
            "format": "png"
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions (like 404) as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate link QR code: {str(e)}")

@api_router.post("/qr/track-scan")
async def track_qr_scan(request: Request, scan_request: QRScanRequest):
    """Track QR code scan for analytics"""
    try:
        # Find the user/link owner
        user_id = None
        if scan_request.qr_type == "profile":
            user_doc = await users_collection.find_one({"username": scan_request.target_id})
            if user_doc:
                user_id = user_doc["id"]
        elif scan_request.qr_type == "link":
            link_doc = await links_collection.find_one({"id": scan_request.target_id})
            if link_doc:
                user_id = link_doc["user_id"]
        
        # Track the scan
        scan = QRScan(
            qr_type=scan_request.qr_type,
            target_id=scan_request.target_id,
            user_id=user_id,
            ip_address=getattr(request.client, 'host', '127.0.0.1'),
            user_agent=request.headers.get("user-agent", "Unknown")
        )
        
        await qr_scans_collection.insert_one(scan.model_dump())
        
        return {"success": True, "message": "QR scan tracked"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track QR scan: {str(e)}")

# New: Scan-and-redirect endpoints
@api_router.get("/qr/scan/profile/{username}")
async def scan_profile_qr(username: str, request: Request):
    try:
        # Convert underscores back to spaces for lookup (URLs use underscores, but usernames may have spaces)
        username_lookup = username.replace('_', ' ').lower()
        
        # Find user by username - try with spaces first (original format)
        user_doc = await users_collection.find_one({"username": username_lookup})
        
        # If not found, try with underscores (in case username was stored with underscores)
        if not user_doc:
            user_doc = await users_collection.find_one({"username": username.lower()})
        
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        # Record scan
        scan = QRScan(
            qr_type="profile",
            target_id=username,
            user_id=user_doc["id"],
            ip_address=getattr(request.client, 'host', '127.0.0.1'),
            user_agent=request.headers.get("user-agent", "Unknown")
        )
        await qr_scans_collection.insert_one(scan.model_dump())

        # Redirect to public profile URL
        base_url = str(request.base_url).rstrip('/')
        redirect_url = f"{base_url}/profile/{username}"
        return RedirectResponse(url=redirect_url, status_code=307)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process scan: {str(e)}")

@api_router.get("/qr/scan/link/{link_id}")
async def scan_link_qr(link_id: str, request: Request):
    try:
        link_doc = await links_collection.find_one({"id": link_id})
        if not link_doc:
            raise HTTPException(status_code=404, detail="Link not found")

        user_id = link_doc.get("user_id")

        # Record scan
        scan = QRScan(
            qr_type="link",
            target_id=link_id,
            user_id=user_id,
            ip_address=getattr(request.client, 'host', '127.0.0.1'),
            user_agent=request.headers.get("user-agent", "Unknown")
        )
        await qr_scans_collection.insert_one(scan.model_dump())

        # Redirect to actual link
        return RedirectResponse(url=link_doc["url"], status_code=307)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process scan: {str(e)}")

@api_router.get("/qr/analytics")
async def get_qr_analytics(current_user: User = Depends(get_current_user)):
    """Get QR code scan analytics for current user"""
    try:
        # Get QR scan stats
        total_scans = await qr_scans_collection.count_documents({"user_id": current_user.id})
        
        profile_scans = await qr_scans_collection.count_documents({
            "user_id": current_user.id,
            "qr_type": "profile"
        })
        
        link_scans = await qr_scans_collection.count_documents({
            "user_id": current_user.id,
            "qr_type": "link"
        })
        
        # Get recent scans
        recent_scans_docs = await qr_scans_collection.find(
            {"user_id": current_user.id},
            sort=[("timestamp", -1)],
            limit=10
        )
        
        recent_scans = []
        for scan_doc in recent_scans_docs:
            scan = QRScan(**scan_doc)
            recent_scans.append({
                "qr_type": scan.qr_type,
                "target_id": scan.target_id,
                "timestamp": scan.timestamp,
                "ip_address": scan.ip_address
            })
        
        return {
            "total_scans": total_scans,
            "profile_scans": profile_scans,
            "link_scans": link_scans,
            "recent_scans": recent_scans
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get QR analytics: {str(e)}")

# ==================== SMART SCHEDULING ROUTES ====================

@api_router.get("/scheduling/availability")
async def get_availability(current_user: User = Depends(get_current_user)):
    """Get user's availability schedule"""
    try:
        availability_docs = await availability_collection.find({"user_id": current_user.id})
        availability = []
        for slot_doc in availability_docs:
            availability.append(AvailabilitySlot(**slot_doc).model_dump())
        return availability
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get availability: {str(e)}")

@api_router.post("/scheduling/availability")
async def set_availability(availability_data: AvailabilityCreate, current_user: User = Depends(get_current_user)):
    """Set availability for a specific day"""
    try:
        # Check if availability already exists for this day
        existing = await availability_collection.find_one({
            "user_id": current_user.id,
            "day_of_week": availability_data.day_of_week
        })
        
        if existing:
            # Update existing availability
            await availability_collection.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "start_time": availability_data.start_time,
                    "end_time": availability_data.end_time,
                    "is_available": availability_data.is_available
                }}
            )
            return {"success": True, "message": "Availability updated"}
        else:
            # Create new availability slot
            availability_slot = AvailabilitySlot(
                user_id=current_user.id,
                **availability_data.model_dump()
            )
            await availability_collection.insert_one(availability_slot.model_dump())
            return {"success": True, "message": "Availability created"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set availability: {str(e)}")

@api_router.get("/scheduling/appointments")
async def get_appointments(current_user: User = Depends(get_current_user)):
    """Get user's appointments"""
    try:
        appointment_docs = await appointments_collection.find(
            {"user_id": current_user.id},
            sort=[("appointment_date", 1)]
        )
        appointments = [Appointment(**appointment_doc).model_dump() for appointment_doc in appointment_docs]
        return appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get appointments: {str(e)}")

@api_router.post("/scheduling/appointments")
async def create_appointment(appointment_data: AppointmentCreate, current_user: User = Depends(get_current_user)):
    """Create a new appointment"""
    try:
        appointment = Appointment(
            user_id=current_user.id,
            **appointment_data.model_dump()
        )
        
        # Google Calendar integration removed - just store in database
        await appointments_collection.insert_one(appointment.model_dump())
        
        return {"success": True, "appointment": appointment.model_dump()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create appointment: {str(e)}")

@api_router.get("/scheduling/available-slots")
async def get_available_slots(date: str, current_user: User = Depends(get_current_user)):
    """Get available time slots for a specific date"""
    try:
        # Parse the date
        target_date = datetime.fromisoformat(date)
        day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
        
        # Get availability for this day of week
        availability_doc = await availability_collection.find_one({
            "user_id": current_user.id,
            "day_of_week": day_of_week,
            "is_available": True
        })
        
        if not availability_doc:
            return {"available_slots": []}
        
        availability = AvailabilitySlot(**availability_doc)
        
        # Get existing appointments for this date
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        appointments_docs = await appointments_collection.find({
            "user_id": current_user.id,
            "appointment_date": {
                "$gte": start_of_day,
                "$lt": end_of_day
            },
            "status": {"$in": ["scheduled", "confirmed"]}
        })
        
        booked_slots = []
        for appointment_doc in appointments_docs:
            appointment = Appointment(**appointment_doc)
            booked_slots.append({
                "start": appointment.appointment_date,
                "end": appointment.appointment_date + timedelta(minutes=appointment.duration_minutes)
            })
        
        # Generate available slots
        available_slots = []
        start_hour, start_minute = map(int, availability.start_time.split(':'))
        end_hour, end_minute = map(int, availability.end_time.split(':'))
        
        current_slot = target_date.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)
        end_time = target_date.replace(hour=end_hour, minute=end_minute, second=0, microsecond=0)
        
        while current_slot < end_time:
            slot_end = current_slot + timedelta(minutes=60)  # Default 1-hour slots
            
            # Check if this slot conflicts with any booked appointment
            is_available = True
            for booked in booked_slots:
                if (current_slot < booked["end"] and slot_end > booked["start"]):
                    is_available = False
                    break
            
            if is_available:
                available_slots.append({
                    "start": current_slot.isoformat(),
                    "end": slot_end.isoformat()
                })
            
            current_slot = slot_end
        
        return {"available_slots": available_slots}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get available slots: {str(e)}")

@api_router.put("/links/{link_id}/schedule")
async def schedule_link(link_id: str, schedule_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Schedule link visibility for specific times"""
    try:
        # Find the link
        link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
        if not link_doc:
            raise HTTPException(status_code=404, detail="Link not found")
        
        # Update link with schedule information
        await links_collection.update_one(
            {"id": link_id},
            {"$set": {
                "scheduled": True,
                "publish_date": datetime.fromisoformat(schedule_data.get("publish_date")) if schedule_data.get("publish_date") else None,
                "unpublish_date": datetime.fromisoformat(schedule_data.get("unpublish_date")) if schedule_data.get("unpublish_date") else None,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"success": True, "message": "Link schedule updated"}
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to schedule link: {str(e)}")

@api_router.get("/scheduling/stats")
async def get_scheduling_stats(current_user: User = Depends(get_current_user)):
    """Get scheduling statistics"""
    try:
        # Count appointments by status
        total_appointments = await appointments_collection.count_documents({"user_id": current_user.id})
        
        upcoming_appointments = await appointments_collection.count_documents({
            "user_id": current_user.id,
            "appointment_date": {"$gte": datetime.utcnow()},
            "status": {"$in": ["scheduled", "confirmed"]}
        })
        
        completed_appointments = await appointments_collection.count_documents({
            "user_id": current_user.id,
            "status": "completed"
        })
        
        # Count scheduled links
        scheduled_links = await links_collection.count_documents({
            "user_id": current_user.id,
            "scheduled": True
        })
        
        return {
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_appointments,
            "completed_appointments": completed_appointments,
            "scheduled_links": scheduled_links
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scheduling stats: {str(e)}")

# ==================== LINK MANAGEMENT ROUTES ====================
# 🔒 SECURITY: All link operations are strictly scoped to authenticated user
# ✅ user_id is ALWAYS derived from JWT token, NEVER from request body
# ✅ All queries include user_id filter to prevent cross-user access
# ✅ Ownership verification on all update/delete operations

@api_router.get("/links")
async def get_user_links(current_user: User = Depends(get_current_user)):
    """
    Get all links for the authenticated user
    
    🔒 SECURITY: Only returns links where user_id matches authenticated user
    - user_id derived from JWT token via get_current_user dependency
    - No possibility of cross-user access
    """
    logger.info(f"🔍 GET /links - user: {current_user.email} (id: {current_user.id})")
    
    # SECURITY: Query explicitly filters by authenticated user's ID
    # This ensures users can ONLY see their own links
    # NOTE: Sort removed from query to avoid requiring composite index (user_id + order)
    # Sorting in Python instead (faster for typical link counts < 100)
    link_docs = await links_collection.find(
        {"user_id": current_user.id}
    )
    
    logger.info(f"✅ GET /links - Found {len(link_docs)} links for {current_user.email}")
    
    if len(link_docs) == 0:
        logger.info(f"ℹ️  No links found for user {current_user.email} (id: {current_user.id})")
    
    # Sort in Python by order field
    link_docs.sort(key=lambda x: x.get('order', 0))
    
    links = [Link(**link_doc) for link_doc in link_docs]
    return [link.model_dump() for link in links]

@api_router.post("/links")
async def create_link(
    request: Request,
    link_data: LinkCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new link for the authenticated user
    
    🔒 SECURITY: user_id is ALWAYS set to authenticated user's ID
    - LinkCreate model does NOT include user_id field
    - user_id is explicitly set from JWT token (current_user.id)
    - Frontend CANNOT override user_id under any circumstances
    """
    logger.info(f"📝 POST /links - Creating link for user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Get next order number - find last link by getting sorted links with limit 1
    # SECURITY: Query scoped to current_user.id to get correct order number
    last_links = await links_collection.find(
        {"user_id": current_user.id},
        sort=[("order", -1)],
        limit=1
    )
    next_order = (last_links[0]["order"] + 1) if last_links else 0
    
    # SECURITY: Explicitly set user_id from authenticated user
    # This CANNOT be overridden by request body
    link = Link(
        user_id=current_user.id,  # ← SECURITY: Always from JWT token
        order=next_order,
        **link_data.model_dump()
    )
    
    # Persist to Firestore
    await links_collection.insert_one(link.model_dump())
    
    logger.info(f"✅ POST /links - Created link '{link.title}' (id: {link.id}) for {current_user.email}")
    
    # Log link creation for audit trail
    await log_link_create(
        user_id=current_user.id,
        link_id=link.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return link.model_dump()

@api_router.put("/links/{link_id}")
async def update_link(
    request: Request,
    link_id: str,
    link_update: LinkUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a link for the authenticated user
    
    🔒 SECURITY: Ownership verification enforced
    - First verifies link exists AND belongs to authenticated user
    - Returns 404 if link doesn't exist OR user doesn't own it
    - Update query includes user_id filter to prevent race conditions
    - user_id field CANNOT be modified (not in LinkUpdate model)
    """
    logger.info(f"✏️  PUT /links/{link_id} - Update request from user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # SECURITY: Verify ownership - link must exist AND belong to authenticated user
    # Returns 404 for both "not found" and "not authorized" to prevent user enumeration
    link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
    if not link_doc:
        logger.warning(f"⚠️  PUT /links/{link_id} - Link not found or unauthorized for {current_user.email}")
        raise HTTPException(status_code=404, detail="Link not found")
    
    logger.info(f"✅ PUT /links/{link_id} - Ownership verified for {current_user.email}")
    
    # Only update fields that were actually provided in the request
    # Using exclude_unset=True ensures we only get fields that were sent
    update_data = link_update.model_dump(exclude_unset=True)
    
    # SECURITY: Ensure user_id cannot be changed (should never be in update_data anyway)
    if "user_id" in update_data:
        logger.error(f"🚨 SECURITY ALERT: Attempt to modify user_id in PUT /links/{link_id}")
        del update_data["user_id"]  # Remove if somehow present
    
    # Always update the timestamp (timezone-aware)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Track which fields were updated (for audit log)
    fields_updated = list(update_data.keys())
    
    # SECURITY: Update query includes user_id filter to prevent race conditions
    # Even if link was reassigned between check and update, this will fail
    result = await links_collection.update_one(
        {"id": link_id, "user_id": current_user.id},  # ← SECURITY: Both filters
        {"$set": update_data}
    )
    
    # Verify update succeeded - NO SILENT FAILURES
    # Firestore returns dict with 'modified_count', not an object with attributes
    modified_count = result.get('modified_count', 0) if isinstance(result, dict) else getattr(result, 'modified_count', 0)
    
    if modified_count == 0:
        logger.error(f"❌ PUT /links/{link_id} - Update failed (not found or not modified)")
        raise HTTPException(status_code=404, detail="Link not found or not modified")
    
    logger.info(f"✅ PUT /links/{link_id} - Successfully updated {len(fields_updated)} fields")
    
    # Log link update for audit trail
    await log_link_update(
        user_id=current_user.id,
        link_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent,
        fields_updated=fields_updated
    )
    
    # SECURITY: Return updated link with ownership verification
    # Use user_id filter to ensure we're returning the right document
    updated_link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
    if not updated_link_doc:
        logger.error(f"❌ PUT /links/{link_id} - Link disappeared after update")
        raise HTTPException(status_code=404, detail="Link not found after update")
    
    return Link(**updated_link_doc).model_dump()

@api_router.delete("/links/{link_id}")
async def delete_link(
    request: Request,
    link_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a link for the authenticated user
    
    🔒 SECURITY: Ownership verification enforced
    - Delete query includes user_id filter
    - Returns 404 if link doesn't exist OR user doesn't own it
    - No possibility of deleting another user's link
    """
    logger.info(f"🗑️  DELETE /links/{link_id} - Delete request from user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # SECURITY: Verify ownership before deletion
    # First check if link exists and belongs to user
    link_doc = await links_collection.find_one({"id": link_id, "user_id": current_user.id})
    if not link_doc:
        logger.warning(f"⚠️  DELETE /links/{link_id} - Link not found or unauthorized for {current_user.email}")
        raise HTTPException(status_code=404, detail="Link not found")
    
    logger.info(f"✅ DELETE /links/{link_id} - Ownership verified for {current_user.email}")
    
    # SECURITY: Delete query includes user_id filter
    # Even if link was reassigned between check and delete, this will fail
    result = await links_collection.delete_one({"id": link_id, "user_id": current_user.id})
    
    # Verify deletion succeeded - NO SILENT FAILURES
    # Firestore returns dict with 'deleted_count', not an object with attributes
    deleted_count = result.get('deleted_count', 0) if isinstance(result, dict) else getattr(result, 'deleted_count', 0)
    if deleted_count == 0:
        logger.error(f"❌ DELETE /links/{link_id} - Deletion failed (not found or already deleted)")
        raise HTTPException(status_code=404, detail="Link not found or already deleted")
    
    logger.info(f"✅ DELETE /links/{link_id} - Successfully deleted link '{link_doc.get('title')}'")
    
    # Log link deletion for audit trail
    await log_link_delete(
        user_id=current_user.id,
        link_id=link_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {"message": "Link deleted successfully"}

@api_router.put("/links/reorder")
async def reorder_links(
    request: Request,
    links_order: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user)
):
    """
    Reorder links for the authenticated user
    
    🔒 SECURITY: Only reorders links owned by authenticated user
    - Verifies ownership of ALL links before reordering
    - Rejects request if any link doesn't belong to user
    - Atomic operation to prevent inconsistent state
    
    Request body: [{"id": "link_id_1", "order": 0}, {"id": "link_id_2", "order": 1}, ...]
    """
    logger.info(f"🔄 PUT /links/reorder - Reorder request from user: {current_user.email} ({len(links_order)} links)")
    
    if not links_order:
        return {"message": "No links to reorder"}
    
    # SECURITY: Verify ALL links belong to the authenticated user
    link_ids = [link_data["id"] for link_data in links_order]
    existing_links = await links_collection.find({"id": {"$in": link_ids}, "user_id": current_user.id})
    
    # Check if all requested links belong to the user
    if len(existing_links) != len(link_ids):
        logger.warning(f"⚠️  PUT /links/reorder - Ownership mismatch for {current_user.email}")
        raise HTTPException(
            status_code=403,
            detail="One or more links do not belong to you"
        )
    
    logger.info(f"✅ PUT /links/reorder - Ownership verified for all {len(link_ids)} links")
    
    # Use batch write for better performance (30-50% faster)
    operations = [
        {
            'type': 'update',
            'collection': 'links',
            'filter': {"id": link_data["id"], "user_id": current_user.id},  # ← SECURITY: Both filters
            'update': {'$set': {"order": link_data["order"], "updated_at": datetime.now(timezone.utc)}}
        }
        for link_data in links_order
    ]
    
    batch_result = await links_collection.batch_write(operations)
    update_count = len(batch_result.get('updated', []))
    
    logger.info(f"✅ PUT /links/reorder - Successfully reordered {update_count} links (batch operation)")
    
    return {"message": f"Successfully reordered {update_count} links"}

@api_router.post("/links/{link_id}/click")
async def track_link_click(link_id: str, request: Request):
    # Get link info
    link_doc = await links_collection.find_one({"id": link_id})
    if not link_doc:
        raise HTTPException(status_code=404, detail="Link not found")
    
    # Track click
    result = await links_collection.update_one(
        {"id": link_id},
        {"$inc": {"clicks": 1}}
    )
    
    # Get user info for ring tracking
    user_doc = await users_collection.find_one({"id": link_doc["user_id"]})
    if user_doc and user_doc.get("ring_id"):
        # Track ring analytics
        await track_ring_event(
            user_doc["ring_id"], 
            "click", 
            user_doc["id"], 
            link_id,
            getattr(request.client, 'host', '127.0.0.1'),
            request.headers.get("user-agent", "Unknown")
        )
    
    # Track in analytics (include user_id so link clicks count as engagements)
    owner_id = link_doc.get("user_id")
    if owner_id is not None:
        # Normalize to string so it matches current_user.id in GET /analytics
        owner_id_str = str(owner_id)
        await analytics_collection.insert_one({
            "user_id": owner_id_str,
            "link_id": link_id,
            "event": "click",
            "timestamp": datetime.utcnow(),
            "ip": getattr(request.client, 'host', '127.0.0.1')
        })

    return {"message": "Click tracked"}

# ==================== MEDIA MANAGEMENT ROUTES ====================

@api_router.get("/media")
async def get_user_media(current_user: User = Depends(get_current_user)):
    """
    Get all media files for the authenticated user
    
    🔒 SECURITY: Only returns media where user_id matches authenticated user
    - Maximum 6 media files allowed per user
    """
    logger.info(f"📸 GET /media - user: {current_user.email} (id: {current_user.id})")
    
    # SECURITY: Query explicitly filters by authenticated user's ID
    media_docs = await media_collection.find(
        {"user_id": current_user.id}
    )
    
    logger.info(f"✅ GET /media - Found {len(media_docs)} media files for {current_user.email}")
    
    # Sort by order
    media_docs.sort(key=lambda x: x.get('order', 0))
    
    media_list = [Media(**media_doc) for media_doc in media_docs]
    return [media.model_dump() for media in media_list]

@api_router.post("/media")
async def create_media(
    request: Request,
    media_data: MediaCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new media file for the authenticated user
    
    🔒 SECURITY: user_id is ALWAYS set to authenticated user's ID
    - Enforces maximum 6 media files per user
    """
    logger.info(f"📸 POST /media - Creating media for user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # Check current media count - enforce 6 file limit
    existing_media = await media_collection.find({"user_id": current_user.id})
    if len(existing_media) >= 6:
        logger.warning(f"⚠️  POST /media - User {current_user.email} already has 6 media files (limit reached)")
        raise HTTPException(
            status_code=400,
            detail="Maximum 6 media files allowed. Please delete an existing file before adding a new one."
        )
    
    # Get next order number
    last_media = await media_collection.find(
        {"user_id": current_user.id},
        sort=[("order", -1)],
        limit=1
    )
    next_order = (last_media[0]["order"] + 1) if last_media else 0
    
    # SECURITY: Explicitly set user_id from authenticated user
    media_dict = media_data.model_dump()
    
    # Auto-populate media_file_url from url for images if not provided
    if media_dict.get('type') == 'image' and not media_dict.get('media_file_url'):
        media_dict['media_file_url'] = media_dict.get('url')
    
    # Ensure thumbnail_url is set for images (use provided or fallback to url)
    if media_dict.get('type') == 'image':
        if not media_dict.get('thumbnail_url'):
            media_dict['thumbnail_url'] = media_dict.get('url')
    
    media = Media(
        user_id=current_user.id,  # ← SECURITY: Always from JWT token
        order=next_order,
        **media_dict
    )
    
    # Persist to Firestore
    await media_collection.insert_one(media.model_dump())
    
    logger.info(f"✅ POST /media - Created media '{media.title}' (id: {media.id}) for {current_user.email}")
    
    return media.model_dump()


@api_router.post("/public/media/{media_id}/engage")
@limiter.limit("200/minute")
async def track_public_media_engagement(media_id: str, request: Request):
    """
    Track media engagement (click) from public profile/preview.
    
    This endpoint does not require authentication. It looks up the media by id,
    derives the owning user_id, and records a lightweight analytics event.
    """
    try:
        media_doc = await media_collection.find_one({"id": media_id})
        if not media_doc:
            raise HTTPException(status_code=404, detail="Media not found")
        
        user_id = media_doc.get("user_id")
        if not user_id:
            # If media is not associated with a user, skip tracking
            return {"success": True}
        
        await analytics_collection.insert_one({
            "user_id": user_id,
            "media_id": media_id,
            "event": "media_click",
            "timestamp": datetime.utcnow(),
            "ip": getattr(request.client, 'host', '127.0.0.1'),
            "user_agent": request.headers.get("user-agent", "Unknown")
        })
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Failed to track public media engagement for {media_id}: {e}")
        # Do not fail the request for analytics issues
        return {"success": True}

@api_router.put("/media/{media_id}")
async def update_media(
    request: Request,
    media_id: str,
    media_update: MediaUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a media file for the authenticated user
    
    🔒 SECURITY: Ownership verification enforced
    - First verifies media exists AND belongs to authenticated user
    - Returns 404 if media doesn't exist OR user doesn't own it
    """
    logger.info(f"✏️  PUT /media/{media_id} - Update request from user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # SECURITY: Verify ownership
    media_doc = await media_collection.find_one({"id": media_id, "user_id": current_user.id})
    if not media_doc:
        logger.warning(f"⚠️  PUT /media/{media_id} - Media not found or unauthorized for {current_user.email}")
        raise HTTPException(status_code=404, detail="Media not found")
    
    logger.info(f"✅ PUT /media/{media_id} - Ownership verified for {current_user.email}")
    
    # Only update fields that were actually provided
    update_data = media_update.model_dump(exclude_unset=True)
    
    # Auto-populate media_file_url from url for images if url is being updated and type is image
    if 'url' in update_data and media_doc.get('type') == 'image' and 'media_file_url' not in update_data:
        update_data['media_file_url'] = update_data['url']
    elif 'type' in update_data and update_data['type'] == 'image' and 'url' in update_data and 'media_file_url' not in update_data:
        update_data['media_file_url'] = update_data['url']
    
    # SECURITY: Ensure user_id cannot be changed
    if "user_id" in update_data:
        logger.error(f"🚨 SECURITY ALERT: Attempt to modify user_id in PUT /media/{media_id}")
        del update_data["user_id"]
    
    # Always update the timestamp
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # SECURITY: Update query includes user_id filter
    result = await media_collection.update_one(
        {"id": media_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    # Verify update succeeded
    modified_count = result.get('modified_count', 0) if isinstance(result, dict) else getattr(result, 'modified_count', 0)
    
    if modified_count == 0:
        logger.error(f"❌ PUT /media/{media_id} - Update failed (not found or not modified)")
        raise HTTPException(status_code=404, detail="Media not found or not modified")
    
    logger.info(f"✅ PUT /media/{media_id} - Successfully updated media")
    
    # Return updated media
    updated_media_doc = await media_collection.find_one({"id": media_id, "user_id": current_user.id})
    if not updated_media_doc:
        logger.error(f"❌ PUT /media/{media_id} - Media disappeared after update")
        raise HTTPException(status_code=404, detail="Media not found after update")
    
    return Media(**updated_media_doc).model_dump()

@api_router.delete("/media/{media_id}")
async def delete_media(
    request: Request,
    media_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a media file for the authenticated user
    
    🔒 SECURITY: Ownership verification enforced
    - Delete query includes user_id filter
    - Returns 404 if media doesn't exist OR user doesn't own it
    """
    logger.info(f"🗑️  DELETE /media/{media_id} - Delete request from user: {current_user.email}")
    
    # Extract client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    # SECURITY: Verify ownership before deletion
    media_doc = await media_collection.find_one({"id": media_id, "user_id": current_user.id})
    if not media_doc:
        logger.warning(f"⚠️  DELETE /media/{media_id} - Media not found or unauthorized for {current_user.email}")
        raise HTTPException(status_code=404, detail="Media not found")
    
    logger.info(f"✅ DELETE /media/{media_id} - Ownership verified for {current_user.email}")
    
    # SECURITY: Delete query includes user_id filter
    result = await media_collection.delete_one({"id": media_id, "user_id": current_user.id})
    
    # Verify deletion succeeded
    deleted_count = result.get('deleted_count', 0) if isinstance(result, dict) else getattr(result, 'deleted_count', 0)
    if deleted_count == 0:
        logger.error(f"❌ DELETE /media/{media_id} - Deletion failed (not found or already deleted)")
        raise HTTPException(status_code=404, detail="Media not found or already deleted")
    
    logger.info(f"✅ DELETE /media/{media_id} - Successfully deleted media '{media_doc.get('title')}'")
    
    return {"message": "Media deleted successfully"}

@api_router.put("/media/reorder")
async def reorder_media(
    request: Request,
    media_order: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user)
):
    """
    Reorder media files for the authenticated user
    
    🔒 SECURITY: Only reorders media owned by authenticated user
    - Verifies ownership of ALL media before reordering
    - Rejects request if any media doesn't belong to user
    
    Request body: [{"id": "media_id_1", "order": 0}, {"id": "media_id_2", "order": 1}, ...]
    """
    logger.info(f"🔄 PUT /media/reorder - Reorder request from user: {current_user.email} ({len(media_order)} media)")
    
    if not media_order:
        return {"message": "No media to reorder"}
    
    # SECURITY: Verify ALL media belong to the authenticated user
    media_ids = [media_data["id"] for media_data in media_order]
    existing_media = await media_collection.find({"id": {"$in": media_ids}, "user_id": current_user.id})
    
    # Check if all requested media belong to the user
    if len(existing_media) != len(media_ids):
        logger.warning(f"⚠️  PUT /media/reorder - Ownership mismatch for {current_user.email}")
        raise HTTPException(
            status_code=403,
            detail="One or more media files do not belong to you"
        )
    
    logger.info(f"✅ PUT /media/reorder - Ownership verified for all {len(media_ids)} media")
    
    # Use batch write for better performance (30-50% faster)
    operations = [
        {
            'type': 'update',
            'collection': 'media',
            'filter': {"id": media_data["id"], "user_id": current_user.id},  # ← SECURITY: Both filters
            'update': {'$set': {"order": media_data["order"], "updated_at": datetime.now(timezone.utc)}}
        }
        for media_data in media_order
    ]
    
    batch_result = await media_collection.batch_write(operations)
    update_count = len(batch_result.get('updated', []))
    
    logger.info(f"✅ PUT /media/reorder - Successfully reordered {update_count} media (batch operation)")
    
    return {"message": f"Successfully reordered {update_count} media"}

# ==================== MERCHANT ITEMS MANAGEMENT ROUTES ====================

@api_router.get("/items")
async def get_user_items(current_user: User = Depends(get_current_user)):
    """Get all items for the current user - stored in user document"""
    logger.info(f"🛍️ GET /items endpoint called for user: {current_user.id}")
    
    # Get user document
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        return []
    
    # Get items from user document
    items_data = user_doc.get("items", [])
    logger.info(f"📊 User has {len(items_data)} items stored in profile")
    
    # Sort by order
    items_data_sorted = sorted(items_data, key=lambda x: x.get("order", 0))
    
    return items_data_sorted

@api_router.post("/items")
async def create_item(
    request: Request,
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new merchant item - stored in user document"""
    logger.info(f"🛍️ Creating new item for user: {current_user.id}")
    
    # Get user document
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get existing items
    existing_items = user_doc.get("items", [])
    
    # Get next order number
    next_order = max([item.get("order", 0) for item in existing_items], default=-1) + 1
    
    # Create new item
    item = Item(
        user_id=current_user.id,
        order=next_order,
        **item_data.model_dump()
    )
    
    # Add to user's items array
    existing_items.append(item.model_dump())
    
    # Update user document
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"items": existing_items, "updated_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"✅ Item created and added to user profile: {item.id}")
    return item.model_dump()

@api_router.put("/items/{item_id}")
async def update_item(
    request: Request,
    item_id: str,
    item_update: ItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a merchant item - stored in user document"""
    logger.info(f"🛍️ Updating item: {item_id}")
    
    # Get user document
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get items array
    items = user_doc.get("items", [])
    
    # Find item to update
    item_index = next((i for i, item in enumerate(items) if item.get("id") == item_id), None)
    if item_index is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update item fields
    update_data = item_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    items[item_index].update(update_data)
    
    # Update user document
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"✅ Item updated in user profile: {item_id}")
    return items[item_index]

@api_router.delete("/items/{item_id}")
async def delete_item(
    request: Request,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a merchant item - from user document"""
    logger.info(f"🛍️ Deleting item: {item_id}")
    
    # Get user document
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get items array
    items = user_doc.get("items", [])
    
    # Filter out the item to delete
    items_before = len(items)
    items = [item for item in items if item.get("id") != item_id]
    items_after = len(items)
    
    if items_before == items_after:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update user document
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"✅ Item deleted from user profile: {item_id}")
    return {"message": "Item deleted successfully"}

@api_router.post("/items/{item_id}/view")
async def track_item_view(item_id: str, request: Request):
    """Track item view"""
    item_doc = await items_collection.find_one({"id": item_id})
    if not item_doc:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Increment view count
    await items_collection.update_one(
        {"id": item_id},
        {"$inc": {"views": 1}}
    )
    
    return {"success": True, "views": item_doc.get("views", 0) + 1}

@api_router.put("/items/reorder")
async def reorder_items(
    request: Request,
    items_order: List[ItemOrder] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Reorder items - in user document
    
    Request body: [{"id": "item_id_1", "order": 0}, {"id": "item_id_2", "order": 1}, ...]
    """
    logger.info(f"🛍️ Reordering {len(items_order)} items")
    
    if not items_order:
        return {"message": "No items to reorder"}
    
    # Get user document
    user_doc = await users_collection.find_one({"id": current_user.id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get items array
    items = user_doc.get("items", [])
    
    # Validate that all item IDs exist in user's items
    item_ids = [item_order.id for item_order in items_order]
    existing_item_ids = {item.get("id") for item in items}
    
    # Check if all requested items belong to the user
    if not all(item_id in existing_item_ids for item_id in item_ids):
        logger.warning(f"⚠️  PUT /items/reorder - Item ID mismatch for {current_user.email}")
        raise HTTPException(
            status_code=400,
            detail="One or more items do not exist"
        )
    
    # Update order for each item
    for item_order in items_order:
        item_id = item_order.id
        new_order = item_order.order
        
        for item in items:
            if item.get("id") == item_id:
                item["order"] = new_order
                break
    
    # Update user document
    await users_collection.update_one(
        {"id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"✅ Items reordered in user profile")
    return {"message": "Items reordered successfully"}

# ==================== AI ENDPOINTS ====================

class AIGenerateDescriptionRequest(BaseModel):
    """Request model for AI description generation"""
    title: str
    url: Optional[str] = None
    category: Optional[str] = None
    type: str = "link"  # "link" or "item"
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        if len(v.strip()) > 200:
            raise ValueError('Title must be 200 characters or less')
        return v.strip()
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        valid_types = ['link', 'item']
        if v not in valid_types:
            raise ValueError(f'Type must be one of: {", ".join(valid_types)}')
        return v
    
    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v and len(v) > 50:
            raise ValueError('Category must be 50 characters or less')
        return v

class AIGenerateBioRequest(BaseModel):
    """Request model for AI bio generation"""
    name: str
    profession: Optional[str] = None
    links: Optional[List[Dict[str, Any]]] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        if len(v.strip()) > 100:
            raise ValueError('Name must be 100 characters or less')
        return v.strip()

class AISuggestCategoryRequest(BaseModel):
    """Request model for AI category suggestion"""
    title: str
    url: str
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        return v.strip()

@api_router.post("/ai/generate-description")
@limiter.limit("10/minute")
async def generate_description(
    request: Request,
    ai_request: AIGenerateDescriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate description using AI based on input type
    
    - For links: Generates description from title, URL, and category
    - For items: Generates description from name, category, and price
    """
    try:
        from services.ai_service import get_ai_service
        
        ai_service = get_ai_service()
        
        if not ai_service.enabled:
            raise HTTPException(
                status_code=503,
                detail="AI service is not available. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY"
            )
        
        if ai_request.type == "link":
            if not ai_request.url:
                raise HTTPException(status_code=400, detail="URL is required for link descriptions")
            
            description = await ai_service.generate_link_description(
                title=ai_request.title,
                url=ai_request.url,
                category=ai_request.category or "general"
            )
        elif ai_request.type == "item":
            description = await ai_service.generate_item_description(
                name=ai_request.title,
                category=ai_request.category or None
            )
        else:
            raise HTTPException(status_code=400, detail=f"Invalid type: {ai_request.type}")
        
        if not description:
            raise HTTPException(status_code=500, detail="Failed to generate description")
        
        return {
            "description": description,
            "type": ai_request.type,
            "provider": ai_service.provider.value
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI description generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")

@api_router.post("/ai/generate-bio")
@limiter.limit("5/minute")
async def generate_bio(
    request: Request,
    ai_request: AIGenerateBioRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate user bio using AI"""
    try:
        from services.ai_service import get_ai_service
        
        ai_service = get_ai_service()
        
        if not ai_service.enabled:
            raise HTTPException(
                status_code=503,
                detail="AI service is not available. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY"
            )
        
        bio = await ai_service.generate_bio(
            name=ai_request.name,
            links=ai_request.links or [],
            profession=ai_request.profession
        )
        
        if not bio:
            raise HTTPException(status_code=500, detail="Failed to generate bio")
        
        return {
            "bio": bio,
            "provider": ai_service.provider.value
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI bio generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate bio: {str(e)}")

@api_router.post("/ai/suggest-category")
@limiter.limit("20/minute")
async def suggest_category(
    request: Request,
    ai_request: AISuggestCategoryRequest,
    current_user: User = Depends(get_current_user)
):
    """Suggest category for a link using AI"""
    try:
        from services.ai_service import get_ai_service
        
        ai_service = get_ai_service()
        
        if not ai_service.enabled:
            # Return default category if AI is not available
            return {"categories": ["general"]}
        
        categories = await ai_service.suggest_categories(
            title=ai_request.title,
            url=ai_request.url
        )
        
        return {
            "categories": categories,
            "provider": ai_service.provider.value
        }
    
    except Exception as e:
        logger.error(f"AI category suggestion failed: {e}")
        # Return default on error
        return {"categories": ["general"]}

@api_router.get("/ai/status")
async def get_ai_status(current_user: User = Depends(get_current_user)):
    """Get AI service status and configuration"""
    try:
        from services.ai_service import get_ai_service
        
        ai_service = get_ai_service()
        
        return {
            "enabled": ai_service.enabled,
            "provider": ai_service.provider.value if ai_service.enabled else None,
            "configured": ai_service.api_key is not None
        }
    except Exception as e:
        logger.error(f"Failed to get AI status: {e}")
        return {
            "enabled": False,
            "provider": None,
            "configured": False
        }

# ==================== PUBLIC PROFILE ROUTES ====================

@api_router.get("/profile/{username}")
@limiter.limit("60/minute")
async def get_public_profile(request: Request, username: str):
    # Convert underscores back to spaces for lookup (URLs use underscores, but usernames may have spaces)
    # Try both the URL format (with underscores) and the original format (with spaces)
    username_lookup = username.replace('_', ' ').lower()
    
    # Find user by username - try with spaces first (original format)
    user_doc = await users_collection.find_one({"username": username_lookup})
    
    # If not found, try with underscores (in case username was stored with underscores)
    if not user_doc:
        user_doc = await users_collection.find_one({"username": username.lower()})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    user = User(**user_doc)
    
    # Track profile view with ring analytics
    if user.ring_id:
        await track_ring_event(
            user.ring_id, 
            "view", 
            user.id,
            None,
            getattr(request.client, 'host', '127.0.0.1'),
            request.headers.get("user-agent", "Unknown")
        )
    
    # Determine subscription status for public profile gating
    try:
        from services.identity_resolver import IdentityResolver
        from models.identity_models import SubscriptionStatus
        
        subscription_info = await IdentityResolver._get_subscription(user_id=user.id)
        subscription_status = subscription_info.get("status", SubscriptionStatus.NONE)
    except Exception as e:
        logger.warning(f"Failed to resolve subscription for public profile {user.id}: {e}")
        from models.identity_models import SubscriptionStatus
        subscription_status = SubscriptionStatus.NONE
    
    # Items should only be fully visible when subscription is active or trial
    items_locked = subscription_status == SubscriptionStatus.EXPIRED
    
    # Get active links
    # NOTE: Sort removed from query to avoid requiring composite index
    # Firestore requires index for: user_id + active + order
    # Sorting in Python instead (temporary fix until index is deployed)
    logger.info(f"📊 Fetching active links for public profile: {user.username}")
    
    links_docs = await links_collection.find({
        "user_id": user.id,
        "active": True
    })  # ← No sort parameter to avoid index requirement
    
    logger.info(f"✅ Found {len(links_docs)} active links")
    
    # Sort in Python by order field
    links_docs.sort(key=lambda x: x.get('order', 0))
    
    links = []
    total_clicks = 0
    for link_doc in links_docs:
        link = Link(**link_doc)
        links.append(link)
        total_clicks += link.clicks
    
    # Get active media files
    logger.info(f"📸 Fetching active media for public profile: {user.username}")
    media_docs = await media_collection.find({
        "user_id": user.id,
        "active": True
    })
    
    # Sort media by order
    media_docs.sort(key=lambda x: x.get('order', 0))
    
    media_list = []
    for media_doc in media_docs:
        media = Media(**media_doc)
        media_list.append(media)
    
    logger.info(f"✅ Found {len(media_list)} active media files")
    
    # Get active items from user document
    logger.info(f"🛍️ Fetching active items for public profile: {user.username}")
    items_data = user_doc.get("items", [])
    
    # Filter only active items and sort by order
    active_items = [item for item in items_data if item.get("active", False)]
    active_items.sort(key=lambda x: x.get('order', 0))
    
    # Apply subscription gating for items: hide items when subscription expired
    if items_locked:
        logger.info(f"🔒 Items are locked for public profile due to subscription status={subscription_status}")
        gated_items = []
    else:
        gated_items = active_items
    
    logger.info(f"✅ Found {len(gated_items)} active items (after gating)")
    
    # Get profile views from ring analytics
    profile_views = await ring_analytics_collection.count_documents({
        "ring_id": user.ring_id,
        "event_type": "view"
    }) if user.ring_id else 0
    
    # Track profile view in old analytics
    await analytics_collection.insert_one({
        "user_id": user.id,
        "event": "profile_view",
        "timestamp": datetime.utcnow(),
        "ip": getattr(request.client, 'host', '127.0.0.1')
    })
    
    # Get show_ring_badge from user_doc (MongoDB document) or default to True
    show_ring_badge = user_doc.get('show_ring_badge', True) if isinstance(user_doc, dict) else getattr(user, 'show_ring_badge', True)
    
    return PublicProfile(
        name=user.name,
        username=user.username,
        bio=user.bio,
        avatar=user.avatar,
        ring_id=user.ring_id,
        theme=user.theme,
        accent_color=user.accent_color,
        background_color=user.background_color,
        button_background_color=getattr(user, 'button_background_color', None),
        button_text_color=getattr(user, 'button_text_color', None),
        # Custom Branding fields
        custom_logo=user.custom_logo,
        show_footer=user.show_footer,
        show_ring_badge=show_ring_badge,
        email=user.email,  # Include email for mail button
        phone_number=user_doc.get('phone_number') if isinstance(user_doc, dict) else getattr(user, 'phone_number', None),  # Include phone for Call button
        whatsapp_number=user_doc.get('whatsapp_number') if isinstance(user_doc, dict) else getattr(user, 'whatsapp_number', None),  # Prefer WhatsApp number if different
        links=[link.model_dump() for link in links],
        media=[media.model_dump() for media in media_list],  # Include active media files
        items=gated_items,  # Include (possibly gated) active items
        profile_views=profile_views,
        total_clicks=total_clicks,
        subscription_status=subscription_status,
        items_locked=items_locked
    ).model_dump()

@api_router.get("/ring/{ring_id}")
@limiter.limit("60/minute")  # SECURITY: Rate limit NFC scans
async def get_profile_by_ring(ring_id: str, request: Request):
    """
    Get profile by NFC ring ID
    
    SECURITY: This endpoint is rate-limited to prevent abuse.
    In production, consider requiring NFC token validation for additional security.
    """
    try:
        # SECURITY: Validate ring_id format (basic sanitization)
        if not ring_id or len(ring_id) > 50:
            raise HTTPException(status_code=400, detail="Invalid ring ID format")
        
        # Find user by ring_id
        user_doc = await users_collection.find_one({"ring_id": ring_id})
        if not user_doc:
            # SECURITY: Don't reveal if ring exists or not (prevent enumeration)
            raise HTTPException(status_code=404, detail="Ring not found")
        
        user = User(**user_doc)
        
        # Track regular ring tap with error handling
        try:
            await track_ring_event(
                ring_id, 
                "tap", 
                user.id,
                None,
                getattr(request.client, 'host', '127.0.0.1'),
                request.headers.get("user-agent", "Unknown")
            )
        except Exception as e:
            # Don't fail the request if analytics tracking fails
            logger.warning(f"Failed to track ring tap event: {e}")
        
        # Return regular profile
        return await get_public_profile(user.username, request)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error in get_profile_by_ring: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

# Direct link mode endpoint removed

@api_router.get("/rings/{ring_id}/settings")
async def get_ring_settings(ring_id: str, current_user: User = Depends(get_current_user)):
    # Verify user owns this ring
    if current_user.ring_id != ring_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this ring")
    
    # Get ring settings (direct mode removed)
    ring_doc = await rings_collection.find_one({"ring_id": ring_id})
    if not ring_doc:
        # Create default ring settings
        ring_settings = {
            "ring_id": ring_id,
            "user_id": current_user.id,
            "created_at": datetime.utcnow()
        }
        await rings_collection.insert_one(ring_settings)
        return ring_settings
    
    return {
        "ring_id": ring_doc["ring_id"]
    }

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics")
async def get_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Get user's links
    links_docs = await links_collection.find({"user_id": current_user.id})
    links = []
    total_clicks = 0
    active_links = 0

    for link_doc in links_docs:
        link = Link(**link_doc)
        links.append(link)
        total_clicks += link.clicks
        if link.active:
            active_links += 1

    # Find top performing link
    top_link = None
    if links:
        top_link = max(links, key=lambda x: x.clicks)

    # Compute date range - use provided dates or default to last 7 days (UTC for correct Firestore comparison)
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if start_date and end_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
            )
            # Strip tz for Firestore (stores naive UTC)
            start_datetime = start_datetime.replace(tzinfo=None)
            end_datetime = end_datetime.replace(tzinfo=None)
            # Ensure end_date is not in the future
            if end_datetime > now_utc:
                end_datetime = now_utc
        except ValueError:
            start_datetime = now_utc - timedelta(days=6)
            end_datetime = now_utc
    else:
        start_datetime = now_utc - timedelta(days=6)
        end_datetime = now_utc

    user_id_str = str(current_user.id)
    cache_key = f"analytics:{user_id_str}:{start_date or 'default'}:{end_date or 'default'}"
    cached = _ANALYTICS_CACHE.get(cache_key)
    if cached and cached.get("expires_at", 0) > time.time():
        return cached["data"]

    # --- Per-day metrics (avoid Firestore composite-index queries) ---
    # Firestore often requires composite indexes for multi-field + range queries.
    # To keep analytics working reliably, fetch by a single key and filter/group in Python.

    def _to_naive_utc(dt_or_ts):
        """Convert Firestore Timestamp / datetime to naive UTC datetime."""
        if dt_or_ts is None:
            return None
        if hasattr(dt_or_ts, "timestamp") and not isinstance(dt_or_ts, datetime):
            # Firestore Timestamp
            return datetime.utcfromtimestamp(dt_or_ts.timestamp())
        if isinstance(dt_or_ts, datetime):
            if dt_or_ts.tzinfo is not None:
                return dt_or_ts.astimezone(timezone.utc).replace(tzinfo=None)
            return dt_or_ts
        return None

    def _in_range(ts):
        return ts is not None and start_datetime <= ts <= end_datetime

    # Profile views ("taps") per day (prefer indexed timestamp range queries; fallback to scan if index missing)
    weekly_views: Dict[str, int] = {}
    if current_user.ring_id:
        # Uses existing index: ring_id + timestamp
        view_source_docs = await ring_analytics_collection.find({
            "ring_id": current_user.ring_id,
            "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
        }, sort=[("timestamp", -1)])
        if (not view_source_docs) and current_user.ring_id:
            # Fallback: avoid index requirements, scan by ring_id only
            view_source_docs = await ring_analytics_collection.find({"ring_id": current_user.ring_id})
        for doc in view_source_docs:
            if doc.get("event_type") != "view":
                continue
            ts = _to_naive_utc(doc.get("timestamp"))
            if not _in_range(ts):
                continue
            iso = ts.strftime("%Y-%m-%d")
            weekly_views[iso] = weekly_views.get(iso, 0) + 1
    else:
        # Fallback: profile_view events in analytics (for users without NFC ring)
        # Uses existing index: user_id + timestamp
        view_source_docs = await analytics_collection.find({
            "user_id": user_id_str,
            "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
        }, sort=[("timestamp", -1)])
        if (not view_source_docs):
            # Fallback: scan by user only
            view_source_docs = await analytics_collection.find({"user_id": user_id_str})
        for doc in view_source_docs:
            if doc.get("event") != "profile_view":
                continue
            ts = _to_naive_utc(doc.get("timestamp"))
            if not _in_range(ts):
                continue
            iso = ts.strftime("%Y-%m-%d")
            weekly_views[iso] = weekly_views.get(iso, 0) + 1

    # Engagements per day (link clicks + media clicks)
    weekly_engagements: Dict[str, int] = {}
    # Uses existing index: user_id + timestamp (filter event types in Python)
    engagement_docs = await analytics_collection.find({
        "user_id": user_id_str,
        "timestamp": {"$gte": start_datetime, "$lte": end_datetime}
    }, sort=[("timestamp", -1)])
    if (not engagement_docs) and total_clicks > 0:
        # Fallback: scan by user only (index-less)
        engagement_docs = await analytics_collection.find({"user_id": user_id_str})
    for doc in engagement_docs:
        if doc.get("event") not in ("media_click", "click"):
            continue
        ts = _to_naive_utc(doc.get("timestamp"))
        if not _in_range(ts):
            continue
        iso = ts.strftime("%Y-%m-%d")
        weekly_engagements[iso] = weekly_engagements.get(iso, 0) + 1

    # Build ordered date range data
    # Map weekday short names
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    days = []
    
    # Calculate the number of days in the range
    delta = end_datetime - start_datetime
    num_days = delta.days + 1
    
    # Generate days array for the selected date range
    current_date = start_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
    for i in range(num_days):
        if current_date > now_utc:
            break
        iso = current_date.strftime("%Y-%m-%d")
        day_label = weekday_names[current_date.weekday()]
        days.append({
            "day": day_label,
            "date": iso,
            "visits": weekly_views.get(iso, 0),
            # Interpret "clicks" in weekly_stats as engagements to match new analytics model
            "clicks": weekly_engagements.get(iso, 0)
        })
        current_date += timedelta(days=1)

    # Range-based totals (sum of weekly_stats) so cards and graph match for selected date range
    total_taps_in_range = sum(weekly_views.values())
    total_engagements_in_range = sum(weekly_engagements.values())

    # Link performance
    link_performance = [
        {
            "id": link.id,
            "title": link.title,
            "clicks": link.clicks,
            "percentage": round((link.clicks / max(total_clicks, 1)) * 100, 1)
        }
        for link in sorted(links, key=lambda x: x.clicks, reverse=True)
    ]

    result = AnalyticsData(
        profile_views=total_taps_in_range,
        total_clicks=total_clicks,
        total_taps=total_taps_in_range,
        total_engagements=total_engagements_in_range,
        active_links=active_links,
        top_link=top_link.model_dump() if top_link else None,
        weekly_stats=days,
        link_performance=link_performance
    ).model_dump()

    _ANALYTICS_CACHE[cache_key] = {
        "expires_at": time.time() + _ANALYTICS_CACHE_TTL_SECONDS,
        "data": result
    }
    return result

# ==================== LEGACY ROUTES (for compatibility) ====================

@api_router.get("/")
async def root():
    return {
        "message": "OdinRing API - Premium NFC Ring-Powered Digital Identity Platform",
        "version": "1.0.0",
        "status": "operational"
    }

@api_router.get("/debug/health")
@api_router.get("/health")  # Also available without /api prefix for easier access
async def health_check():
    """
    Health check endpoint that works even if services fail to initialize.
    
    This endpoint will always return a response, even if Firebase is unavailable,
    preventing Vercel 404 errors and providing diagnostic information.
    """
    health_status = {
        "api": "healthy",
        "status": "healthy",
        "database": "unknown",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check Firebase/Firestore connection
    try:
        db = get_firestore_db()
        if db is None:
            # Database not initialized - check why
            if _db_initialization_error:
                health_status["database"] = "unavailable"
                health_status["database_error"] = _db_initialization_error
                health_status["status"] = "degraded"
                health_status["api"] = "degraded"
            else:
                health_status["database"] = "not_initialized"
                health_status["status"] = "degraded"
                health_status["api"] = "degraded"
        else:
            # Test Firestore connection by counting users
            try:
                user_count = await users_collection.count_documents({})
                health_status["database"] = "connected"
                health_status["user_count"] = user_count
                health_status["services"]["firestore"] = "connected"
            except Exception as e:
                health_status["database"] = "error"
                health_status["database_error"] = f"{type(e).__name__}: {str(e)}"
                health_status["services"]["firestore"] = "error"
                health_status["status"] = "degraded"
                health_status["api"] = "degraded"
                logger.error(f"Health check database error: {e}", exc_info=True)
    except Exception as e:
        health_status["database"] = "error"
        health_status["database_error"] = f"{type(e).__name__}: {str(e)}"
        health_status["services"]["firestore"] = "error"
        health_status["status"] = "degraded"
        health_status["api"] = "degraded"
        logger.error(f"Health check error: {e}", exc_info=True)
    
    # Check environment variables
    env_status = {}
    required_vars = ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'JWT_SECRET']
    for var in required_vars:
        env_status[var] = "set" if os.environ.get(var) else "missing"
    health_status["environment"] = env_status
    
    # If critical env vars are missing, mark as degraded
    if any(env_status[var] == "missing" for var in required_vars):
        health_status["status"] = "degraded"
        health_status["api"] = "degraded"
        health_status["message"] = "Missing required environment variables. Check /api/debug/env for details."
    
    # Return appropriate status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    from fastapi.responses import JSONResponse
    return JSONResponse(content=health_status, status_code=status_code)

@api_router.get("/debug/env")
async def check_environment():
    """Check environment variables (sanitized).
    
    SECURITY:
    - In production, this endpoint should not reveal environment configuration details.
    - Return 404 in production to avoid leaking any hints about server configuration.
    """
    # SECURITY: Disable detailed environment introspection in production
    if settings.ENV == 'production':
        raise HTTPException(status_code=404, detail="Not found")
    
    env_check = get_current_env_vars()
    env_check["python_version"] = f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}.{__import__('sys').version_info.micro}"
    
    # Check if critical env vars are set
    # SECURITY: File-based credentials eliminated - use FIREBASE_SERVICE_ACCOUNT_JSON only
    env_check["has_firebase_project_id"] = bool(os.environ.get('FIREBASE_PROJECT_ID'))
    env_check["has_firebase_service_account"] = bool(os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON'))
    env_check["has_jwt_secret"] = bool(os.environ.get('JWT_SECRET'))
    
    return env_check

@api_router.get("/debug/auth/test")
async def test_auth(current_user: User = Depends(get_current_user)):
    """Test authentication - requires valid token"""
    return {
        "success": True,
        "message": "Authentication working correctly",
        "user_id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# Status check routes (keep existing functionality)
class StatusCheck(BaseModel):
    model_config = {"extra": "ignore"}  # Ignore extra fields from MongoDB like _id
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

@api_router.post("/status")
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    await status_checks_collection.insert_one(status_obj.model_dump())
    return status_obj.model_dump()

@api_router.get("/status")
async def get_status_checks():
    status_checks = await status_checks_collection.find({}, limit=1000)
    return [StatusCheck(**status_check).model_dump() for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

# Include Phase 2 routers (onboarding, billing, etc.)
try:
    from routes.onboarding import onboarding_router
    app.include_router(onboarding_router, prefix="/api")
    logger.info("✅ Onboarding routes loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ Onboarding routes not available: {e}")

try:
    from routes.billing import billing_router
    app.include_router(billing_router, prefix="/api")
    logger.info("✅ Billing routes loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ Billing routes not available: {e}")

# Add request logging middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # SECURITY: Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # SECURITY: HSTS only for HTTPS (production)
    if settings.ENV == 'production' or request.url.scheme == 'https':
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # SECURITY: Content-Security-Policy (adjust based on your needs)
    # Note: This is a restrictive policy - adjust if you need external resources
    csp_policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
    response.headers["Content-Security-Policy"] = csp_policy
    
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses"""
    client_ip = request.client.host if request.client else "unknown"
    logger.info(
        f"request_received method={request.method} path={request.url.path} client_ip={client_ip}"
    )
    
    try:
        response = await call_next(request)
        logger.info(
            f"request_completed method={request.method} path={request.url.path} status_code={response.status_code}"
        )
        return response
    except Exception as e:
        logger.error(
            f"request_failed method={request.method} path={request.url.path} error={str(e)}",
            exc_info=True
        )
        raise

# CORS Configuration - Security Hardened
# SECURITY: CORS origins must be set via CORS_ORIGINS environment variable in production
# SECURITY: Don't fail hard during import - allow app to start and report via health endpoint
cors_origins_env = os.environ.get('CORS_ORIGINS', '')
if not cors_origins_env:
    if settings.ENV == 'production':
        # Log error but don't raise - allows app to start and report via health endpoint
        logger.error("CORS_ORIGINS environment variable is required in production but not set")
        # Use empty list - CORS will be restrictive but app will start
        cors_origins = []
    else:
        # Development fallback - localhost only
        cors_origins = ["http://localhost:3000"]
        logger.warning("CORS_ORIGINS not set, using development defaults (localhost only)")
        logger.info(f"🌐 CORS Configuration (development defaults):")
        logger.info(f"   Allowed origins: {cors_origins}")
        logger.info(f"   Environment: {settings.ENV}")
else:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(',')]
    # SECURITY: Always add localhost for development (only if not production)
    if settings.ENV != 'production' and "http://localhost:3000" not in cors_origins:
        cors_origins.append("http://localhost:3000")
    logger.info(f"CORS configured from environment: {len(cors_origins)} origin(s)")

# Log CORS configuration for debugging
logger.info(f"🌐 CORS Configuration:")
logger.info(f"   Allowed origins: {cors_origins}")
logger.info(f"   Environment: {settings.ENV}")

# SECURITY: Restrict CORS methods, headers, and exposed headers
# Note: Browsers send standard headers in preflight requests (Accept, Origin, etc.)
# These must be allowed for CORS to work properly
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # SECURITY: Explicit methods only
    allow_headers=[
        "Authorization", 
        "Content-Type", 
        "X-Requested-With",
        "Accept",
        "Origin",
        "Accept-Language",
        "Content-Language"
    ],  # SECURITY: Include standard browser headers for preflight requests
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "X-Error-Code", "X-Error-ID"],  # SECURITY: Only necessary headers
    max_age=3600,  # SECURITY: Cache preflight requests for 1 hour
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Note: Startup/shutdown logic moved to lifespan context manager above
# This is the recommended approach for Vercel serverless functions