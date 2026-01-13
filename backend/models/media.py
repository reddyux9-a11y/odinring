"""
Media-related Pydantic models
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class MediaCreate(BaseModel):
    title: str
    media_type: str  # 'image' or 'video'
    url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
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

    @field_validator('media_type')
    @classmethod
    def validate_media_type(cls, v):
        if v not in ['image', 'video']:
            raise ValueError('Media type must be "image" or "video"')
        return v

    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v or not v.strip():
            raise ValueError('URL cannot be empty')
        # For images: allow http://, https://, or data: URLs
        if not re.match(r'^(https?://|data:)', v, re.IGNORECASE):
            raise ValueError('Image URL must start with http://, https://, or data:')
        if len(v) > 5000:
            raise ValueError('URL must be 5000 characters or less')
        return v.strip()

    @field_validator('thumbnail_url')
    @classmethod
    def validate_thumbnail_url(cls, v, info):
        if v is not None:
            media_type = info.data.get('media_type') if info.data else None
            # For videos: allow http:// or https:// URLs, or iframe embed code
            if media_type == 'video':
                if not (re.match(r'^https?://', v, re.IGNORECASE) or '<iframe' in v):
                    raise ValueError('Video URL must be an http:// or https:// URL, or an iframe embed code')
            else:
                # For images: allow http://, https://, data:, or iframe embed code
                if not (re.match(r'^(https?://|data:)', v, re.IGNORECASE) or '<iframe' in v):
                    raise ValueError('URL must start with http://, https://, data:, or be an iframe embed code')
            if len(v) > 5000:
                raise ValueError('URL must be 5000 characters or less')
        return v.strip() if v else None

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Description must be 1000 characters or less')
        return v.strip() if v else None


class Media(BaseModel):
    id: str
    user_id: str
    title: str
    media_type: str  # 'image' or 'video'
    url: str
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0
    active: bool = True
    views: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MediaUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    description: Optional[str] = None
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
            # Allow http://, https://, or data: URLs
            if not re.match(r'^(https?://|data:)', v, re.IGNORECASE):
                raise ValueError('Media file URL must start with http://, https://, or data:')
            if len(v) > 5000:
                raise ValueError('URL must be 5000 characters or less')
        return v.strip() if v else None

    @field_validator('thumbnail_url')
    @classmethod
    def validate_thumbnail_url(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Thumbnail URL cannot be empty')
            # Allow http:// or https:// URLs
            if not re.match(r'^https?://', v, re.IGNORECASE):
                raise ValueError('Thumbnail URL must start with http:// or https://')
            if len(v) > 5000:
                raise ValueError('URL must be 5000 characters or less')
        return v.strip() if v else None

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Description must be 1000 characters or less')
        return v.strip() if v else None



