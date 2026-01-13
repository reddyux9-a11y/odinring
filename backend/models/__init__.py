"""
Models package - exports all Pydantic models
"""
from .user import UserCreate, UserLogin, User, UserUpdate, PublicProfile
from .link import LinkCreate, Link, LinkUpdate
from .media import MediaCreate, Media, MediaUpdate
from .admin import Admin, AdminLogin, AdminStats
from .auth import GoogleSignInRequest, FirebaseLoginRequest, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest
from .item import ItemCreate, Item, ItemUpdate
from .common import Ring, AnalyticsData, RingAnalytics, QRScanRequest, QRScan, Appointment, AvailabilitySlot, AppointmentCreate, AvailabilityCreate

__all__ = [
    # User models
    'UserCreate',
    'UserLogin',
    'User',
    'UserUpdate',
    'PublicProfile',
    # Link models
    'LinkCreate',
    'Link',
    'LinkUpdate',
    # Media models
    'MediaCreate',
    'Media',
    'MediaUpdate',
    # Admin models
    'Admin',
    'AdminLogin',
    'AdminStats',
    # Auth models
    'GoogleSignInRequest',
    'FirebaseLoginRequest',
    'RefreshTokenRequest',
    'ForgotPasswordRequest',
    'ResetPasswordRequest',
    # Item models
    'ItemCreate',
    'Item',
    'ItemUpdate',
    # Common models
    'Ring',
    'AnalyticsData',
    'RingAnalytics',
    'QRScanRequest',
    'QRScan',
    'Appointment',
    'AvailabilitySlot',
    'AppointmentCreate',
    'AvailabilityCreate',
]
