"""
Application entrypoint compatibility layer.

Keeps current runtime behavior by re-exporting the existing app instance
from server.py while new modules are introduced.
"""

from server import app, db

__all__ = ["app", "db"]
