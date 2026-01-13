"""
Common/shared Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Ring(BaseModel):
    id: str
    user_id: Optional[str] = None
    status: str = "active"  # 'active', 'inactive', 'lost'
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AnalyticsData(BaseModel):
    user_id: str
    link_id: Optional[str] = None
    event: str
    timestamp: datetime
    ip: Optional[str] = None


class RingAnalytics(BaseModel):
    ring_id: str
    event_type: str  # 'tap', 'view', etc.
    user_id: Optional[str] = None
    link_id: Optional[str] = None
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class QRScanRequest(BaseModel):
    qr_type: str  # 'profile' or 'link'
    target_id: str  # username or link_id


class QRScan(BaseModel):
    id: str
    qr_type: str  # 'profile' or 'link'
    target_id: str  # username or link_id
    user_id: str
    timestamp: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class Appointment(BaseModel):
    id: str
    user_id: str
    visitor_name: str
    visitor_email: str
    visitor_phone: Optional[str] = None
    appointment_time: datetime
    status: str = "pending"  # 'pending', 'confirmed', 'cancelled'
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AvailabilitySlot(BaseModel):
    day_of_week: int  # 0 = Monday, 6 = Sunday
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    timezone: str = "UTC"


class AppointmentCreate(BaseModel):
    visitor_name: str
    visitor_email: str
    visitor_phone: Optional[str] = None
    appointment_time: str  # ISO format datetime string
    notes: Optional[str] = None


class AvailabilityCreate(BaseModel):
    slots: List[AvailabilitySlot]
    timezone: str = "UTC"



