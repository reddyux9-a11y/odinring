"""
Auth dependency compatibility wrappers.

These wrappers avoid importing server symbols at module import time,
which helps reduce circular import pressure while preserving behavior.
"""

from typing import Any, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def _server_module():
    import server

    return server


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    # Delegate to server implementation while preserving FastAPI-friendly signature.
    return await _server_module().get_current_user(request, credentials)


async def get_current_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    return await _server_module().get_current_admin(request, credentials)


def get_user_model():
    return _server_module().User


def get_admin_model():
    return _server_module().Admin
