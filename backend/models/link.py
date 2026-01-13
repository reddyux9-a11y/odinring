"""
Link-related Pydantic models
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class LinkCreate(BaseModel):
    title: str
    url: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    active: bool = True

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
        if not re.match(r'^(https?://|mailto:|tel:|sms:)', v, re.IGNORECASE):
            raise ValueError('URL must start with http://, https://, mailto:, tel:, or sms:')
        if len(v) > 2000:
            raise ValueError('URL must be 2000 characters or less')
        return v.strip()

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError('Description must be 500 characters or less')
        return v.strip() if v else None


class Link(BaseModel):
    id: str
    user_id: str
    title: str
    url: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0
    active: bool = True
    clicks: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

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



