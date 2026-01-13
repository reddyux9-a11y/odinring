"""
Authentication-related Pydantic models
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class GoogleSignInRequest(BaseModel):
    uid: str
    email: EmailStr
    name: str
    photo_url: Optional[str] = None
    firebase_token: str


class FirebaseLoginRequest(BaseModel):
    firebase_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

