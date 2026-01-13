"""
Admin-related Pydantic models
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class Admin(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminStats(BaseModel):
    total_users: int
    total_rings: int
    total_links: int
    total_taps: int
    active_users_today: int
    new_users_today: int
    top_rings: List[Dict[str, Any]] = []



