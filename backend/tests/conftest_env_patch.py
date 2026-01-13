"""
Additional conftest patches for environment and file access

This module provides additional mocking to prevent permission errors
when tests try to access .env files or SSL certificates.
"""
import os
import sys
from unittest.mock import MagicMock, patch

# Patch pydantic_settings to prevent .env file reading
def patch_pydantic_settings():
    """Patch pydantic_settings to use environment variables only"""
    # Mock DotEnvSettingsSource to return empty dict
    mock_dotenv_source = MagicMock()
    mock_dotenv_source._read_env_files = MagicMock(return_value={})
    mock_dotenv_source._load_env_vars = MagicMock(return_value={})
    
    # Patch the class
    if 'pydantic_settings' in sys.modules:
        pydantic_settings = sys.modules['pydantic_settings']
        if hasattr(pydantic_settings, 'sources'):
            pydantic_settings.sources.DotEnvSettingsSource = MagicMock(return_value=mock_dotenv_source)


# Patch pathlib Path.open to prevent .env file access
original_open = None

def patch_pathlib_open():
    """Patch pathlib.Path.open to prevent .env file access"""
    global original_open
    
    from pathlib import Path
    
    if original_open is None:
        original_open = Path.open
    
    def mock_open(self, *args, **kwargs):
        # If trying to open .env file, return mock file
        if self.name == '.env' or str(self).endswith('.env'):
            from io import StringIO
            return StringIO('')
        return original_open(self, *args, **kwargs)
    
    Path.open = mock_open


# Apply patches when module is imported
patch_pydantic_settings()
patch_pathlib_open()


