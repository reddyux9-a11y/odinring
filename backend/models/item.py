"""
Merchant item-related Pydantic models
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    currency: str = "USD"
    image_url: Optional[str] = None
    category: str = "product"
    order: int = 0
    active: bool = True

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
            raise ValueError('Price cannot be negative')
        return v

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']
        if v.upper() not in valid_currencies:
            raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
        return v.upper()

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Image URL cannot be empty')
            if not re.match(r'^(https?://|data:)', v, re.IGNORECASE):
                raise ValueError('Image URL must start with http://, https://, or data:')
            if len(v) > 2000:
                raise ValueError('Image URL must be 2000 characters or less')
        return v.strip() if v else None

    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        valid_categories = ['product', 'service', 'digital', 'physical']
        if v.lower() not in valid_categories:
            raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
        return v.lower()

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Description must be 1000 characters or less')
        return v.strip() if v else None


class Item(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = ""
    price: float
    currency: str = "USD"
    image_url: Optional[str] = None
    category: str = "product"
    order: int = 0
    active: bool = True
    views: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Item name cannot be empty')
            if len(v.strip()) > 100:
                raise ValueError('Item name must be 100 characters or less')
        return v.strip() if v else None

    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v is not None and v < 0:
            raise ValueError('Price cannot be negative')
        return v

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v):
        if v is not None:
            valid_currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']
            if v.upper() not in valid_currencies:
                raise ValueError(f'Currency must be one of: {", ".join(valid_currencies)}')
            return v.upper()
        return v

    @field_validator('image_url')
    @classmethod
    def validate_image_url(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Image URL cannot be empty')
            if not re.match(r'^(https?://|data:)', v, re.IGNORECASE):
                raise ValueError('Image URL must start with http://, https://, or data:')
            if len(v) > 2000:
                raise ValueError('Image URL must be 2000 characters or less')
        return v.strip() if v else None

    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v is not None:
            valid_categories = ['product', 'service', 'digital', 'physical']
            if v.lower() not in valid_categories:
                raise ValueError(f'Category must be one of: {", ".join(valid_categories)}')
            return v.lower()
        return v

    @field_validator('description')
    @classmethod
    def validate_description(cls, v):
        if v is not None and len(v) > 1000:
            raise ValueError('Description must be 1000 characters or less')
        return v.strip() if v else None



