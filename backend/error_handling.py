"""
Consistent Error Handling Utilities

Provides structured error handling, logging, and response formatting
for the OdinRing API.

Key Features:
- Structured error responses with error codes
- Server-side logging (never expose internal errors to clients)
- Consistent error format across all endpoints
- Error categorization (client errors vs server errors)
"""

import traceback
import uuid
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from logging_config import get_logger

logger = get_logger(__name__)


# Error codes for client-side handling
class ErrorCode:
    """Standard error codes for client-side error handling"""
    # Authentication errors (401)
    AUTH_REQUIRED = "AUTH_REQUIRED"
    AUTH_INVALID = "AUTH_INVALID"
    AUTH_EXPIRED = "AUTH_EXPIRED"
    AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_INSUFFICIENT_PERMISSIONS"
    
    # Validation errors (400)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    
    # Resource errors (404)
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    LINK_NOT_FOUND = "LINK_NOT_FOUND"
    
    # Conflict errors (409)
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS"
    
    # Server errors (500, 503)
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    
    # Rate limiting (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"


def is_connection_error(error: Exception) -> bool:
    """
    Check if error is a database/connection error
    
    Args:
        error: Exception to check
        
    Returns:
        True if error is connection-related
    """
    error_msg = str(error).lower()
    connection_keywords = [
        'ssl', 'tls', 'handshake', 'connection', 'timeout',
        'server selection', 'event loop', 'closed', 'network',
        'dns', 'resolve', 'unreachable', 'refused'
    ]
    return any(keyword in error_msg for keyword in connection_keywords)


def log_error(
    error: Exception,
    context: str,
    error_id: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
) -> str:
    """
    Log error server-side with full details
    
    Args:
        error: Exception to log
        context: Context where error occurred (e.g., "get_current_user")
        error_id: Unique error ID for tracking (generated if not provided)
        additional_data: Additional context data to log
        
    Returns:
        Error ID for tracking
    """
    if error_id is None:
        error_id = str(uuid.uuid4())[:8]
    
    error_data = {
        "error_id": error_id,
        "context": context,
        "error_type": type(error).__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc()
    }
    
    if additional_data:
        error_data.update(additional_data)
    
    # Log error with full details (server-side only)
    logger.error(
        "error_occurred",
        **error_data
    )
    
    return error_id


def create_error_response(
    status_code: int,
    message: str,
    error_code: str,
    error_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    """
    Create structured error response
    
    Args:
        status_code: HTTP status code
        message: User-friendly error message
        error_code: Error code for client-side handling
        error_id: Error ID for tracking (optional)
        details: Additional error details (optional)
        
    Returns:
        JSONResponse with structured error format
    """
    response_data = {
        "error": {
            "message": message,
            "code": error_code,
            "status": status_code
        }
    }
    
    if error_id:
        response_data["error"]["error_id"] = error_id
    
    if details:
        response_data["error"]["details"] = details
    
    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


def handle_database_error(
    error: Exception,
    context: str,
    default_message: str = "Database operation failed"
) -> HTTPException:
    """
    Handle database errors with proper logging and user-friendly messages
    
    Args:
        error: Database error exception
        context: Context where error occurred
        default_message: Default message if error type is unknown
        
    Returns:
        HTTPException with appropriate status code and message
    """
    error_id = log_error(error, context)
    
    if is_connection_error(error):
        # Database connection errors
        return HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Please try again later.",
            headers={"X-Error-Code": ErrorCode.DATABASE_CONNECTION_ERROR, "X-Error-ID": error_id}
        )
    else:
        # Generic database errors
        return HTTPException(
            status_code=500,
            detail="An internal error occurred. Please try again later.",
            headers={"X-Error-Code": ErrorCode.DATABASE_ERROR, "X-Error-ID": error_id}
        )


def handle_authentication_error(
    error: Exception,
    context: str,
    default_message: str = "Authentication failed"
) -> HTTPException:
    """
    Handle authentication errors with proper logging
    
    Args:
        error: Authentication error exception
        context: Context where error occurred
        default_message: Default message if error type is unknown
        
    Returns:
        HTTPException with 401 status code
    """
    error_id = log_error(error, context)
    
    return HTTPException(
        status_code=401,
        detail=default_message,
        headers={"X-Error-Code": ErrorCode.AUTH_INVALID, "X-Error-ID": error_id}
    )


def handle_generic_error(
    error: Exception,
    context: str,
    default_message: str = "An error occurred"
) -> HTTPException:
    """
    Handle generic errors with proper logging
    
    Args:
        error: Exception to handle
        context: Context where error occurred
        default_message: User-friendly error message
        
    Returns:
        HTTPException with 500 status code
    """
    error_id = log_error(error, context)
    
    return HTTPException(
        status_code=500,
        detail=default_message,
        headers={"X-Error-Code": ErrorCode.INTERNAL_SERVER_ERROR, "X-Error-ID": error_id}
    )


def create_http_exception(
    status_code: int,
    detail: str,
    error_code: str,
    error_id: Optional[str] = None
) -> HTTPException:
    """
    Create HTTPException with error code header
    
    Args:
        status_code: HTTP status code
        detail: Error message
        error_code: Error code for client-side handling
        error_id: Error ID for tracking (optional)
        
    Returns:
        HTTPException with error code header
    """
    headers = {"X-Error-Code": error_code}
    if error_id:
        headers["X-Error-ID"] = error_id
    
    return HTTPException(
        status_code=status_code,
        detail=detail,
        headers=headers
    )



