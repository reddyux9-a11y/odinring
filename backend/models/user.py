"""
User-related Pydantic models
"""
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional, List
import re


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
    username: str  # Can be username or email
    password: str


class User(BaseModel):
    id: str
    name: str
    username: str
    email: str
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    ring_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    show_ring_badge: bool = True  # Whether to show "Ring Connected" badge


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    show_ring_badge: Optional[bool] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Name cannot be empty')
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


class PublicProfile(BaseModel):
    name: str
    username: str
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    links: List[dict] = []
    media: List[dict] = []
    items: List[dict] = []
    ring_id: Optional[str] = None
    profile_views: int = 0
    show_ring_badge: bool = True



