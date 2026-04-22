"""
Core API routes compatibility export.

Keeps all existing routes available through the existing server api_router
while enabling staged migration into app/api/v1 modules.
"""

from server import api_router as router
