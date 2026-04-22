"""
Central API router compatibility module.
"""

from fastapi import APIRouter
from app.api.v1.billing import router as billing_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.core import router as core_router

api_router = APIRouter()
api_router.include_router(core_router)
api_router.include_router(onboarding_router)
api_router.include_router(billing_router)
