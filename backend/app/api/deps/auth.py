"""
Auth dependency compatibility wrappers.

These wrappers avoid importing server symbols at module import time,
which helps reduce circular import pressure while preserving behavior.
"""

from typing import Any


def _server_module():
    import server

    return server


def get_current_user(*args: Any, **kwargs: Any):
    return _server_module().get_current_user(*args, **kwargs)


def get_current_admin(*args: Any, **kwargs: Any):
    return _server_module().get_current_admin(*args, **kwargs)


def get_user_model():
    return _server_module().User


def get_admin_model():
    return _server_module().Admin
