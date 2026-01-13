"""
Unit tests for Error Handling Module

Tests comprehensive error handling across the application
"""
import pytest
from unittest.mock import Mock, patch
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from error_handling import (
    handle_database_error,
    handle_authentication_error,
    handle_generic_error,
    ErrorCode,
    create_http_exception
)
from fastapi import HTTPException


class TestErrorHandling:
    """Test error handling utilities"""
    
    def test_handle_database_error(self):
        """Test database error handling"""
        error = Exception("Database connection failed")
        
        result = handle_database_error(error, "test_function", "Test operation")
        
        assert isinstance(result, HTTPException)
        assert result.status_code == 500
    
    def test_handle_authentication_error(self):
        """Test authentication error handling"""
        error = Exception("Invalid credentials")
        
        result = handle_authentication_error(error, "test_function", "Test auth")
        
        assert isinstance(result, HTTPException)
        assert result.status_code == 401
    
    def test_handle_generic_error(self):
        """Test generic error handling"""
        error = Exception("Generic error")
        
        result = handle_generic_error(error, "test_function", "Test operation")
        
        assert isinstance(result, HTTPException)
        assert result.status_code == 500
    
    def test_create_http_exception(self):
        """Test creating HTTP exception"""
        exception = create_http_exception(
            status_code=404,
            detail="Not found",
            error_code=ErrorCode.NOT_FOUND
        )
        
        assert isinstance(exception, HTTPException)
        assert exception.status_code == 404
        assert exception.detail == "Not found"
    
    def test_error_code_enum(self):
        """Test error code enum values"""
        assert ErrorCode.NOT_FOUND is not None
        assert ErrorCode.UNAUTHORIZED is not None
        assert ErrorCode.FORBIDDEN is not None
        assert ErrorCode.VALIDATION_ERROR is not None
        assert ErrorCode.INTERNAL_ERROR is not None


