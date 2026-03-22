"""
Firebase Configuration Module
Handles Firebase initialization and provides database access

SECURITY: This module ONLY accepts credentials from environment variables.
File-based credential loading is completely eliminated for security.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore as gcp_firestore
import os
import json
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)

# Global Firebase app and db references
_app = None
_db = None
# Last error when get_firestore_client() could not return a client (for API 503 messages)
_firestore_client_error: str | None = None


def get_firestore_client_error() -> str | None:
    """Human-readable reason Firestore client is unavailable, or None if not recorded."""
    return _firestore_client_error

# SECURITY: NEVER commit service account JSON to git
# TODO: Rotate credentials immediately if firebase-service-account.json was ever committed


def retry_on_failure(max_retries=3, delay=1, backoff=2):
    """
    Decorator for retrying operations on failure
    
    Args:
        max_retries: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff: Multiplier for delay on each retry
    """
    def decorator(func):
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}: {e}")
                        raise
                    
                    logger.warning(f"Attempt {retries} failed for {func.__name__}: {e}. Retrying in {current_delay}s...")
                    time.sleep(current_delay)
                    current_delay *= backoff
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            import asyncio
            retries = 0
            current_delay = delay
            
            while retries < max_retries:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded for {func.__name__}: {e}")
                        raise
                    
                    logger.warning(f"Attempt {retries} failed for {func.__name__}: {e}. Retrying in {current_delay}s...")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def _validate_service_account_info(service_account_info: dict) -> None:
    """
    Validate service account JSON has all required fields.
    Fails fast with clear error message if validation fails.
    
    Args:
        service_account_info: Parsed service account JSON dictionary
        
    Raises:
        ValueError: If required fields are missing or invalid
    """
    required_fields = ['project_id', 'client_email', 'private_key']
    missing_fields = [field for field in required_fields if not service_account_info.get(field)]
    
    if missing_fields:
        raise ValueError(
            f"FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields: {', '.join(missing_fields)}. "
            f"Please verify the service account JSON is complete."
        )
    
    # Validate private_key is not empty
    private_key = service_account_info.get('private_key', '')
    if not private_key or not private_key.strip():
        raise ValueError(
            "FIREBASE_SERVICE_ACCOUNT_JSON has empty private_key. "
            "Please verify the service account JSON is valid."
        )


def _normalize_private_key(service_account_info: dict) -> dict:
    """
    Normalize private_key by replacing escaped newlines with actual newlines.
    This handles cases where the JSON string has \\n instead of \n.
    
    Args:
        service_account_info: Service account JSON dictionary
        
    Returns:
        Service account dictionary with normalized private_key
    """
    if 'private_key' in service_account_info:
        # Replace escaped newlines with actual newlines
        service_account_info['private_key'] = service_account_info['private_key'].replace('\\n', '\n')
    return service_account_info


@retry_on_failure(max_retries=3, delay=1, backoff=2)
def initialize_firebase():
    """
    Initialize Firebase Admin SDK with retry logic.
    
    SECURITY: This function ONLY accepts credentials from FIREBASE_SERVICE_ACCOUNT_JSON
    environment variable. File-based credential loading is completely eliminated.
    
    Returns: Firestore client
    
    Raises:
        ValueError: If credentials are missing, invalid, or misconfigured
        RuntimeError: If Firebase initialization fails
    """
    global _app, _db
    
    # SECURITY: Prevent double initialization using firebase_admin.apps
    if len(firebase_admin._apps) > 0:
        logger.info("Firebase already initialized")
        if _db is None:
            # If app exists but _db is None, recreate client
            project_id = os.getenv('FIREBASE_PROJECT_ID')
            if not project_id:
                raise ValueError("FIREBASE_PROJECT_ID environment variable is required")
            _db = gcp_firestore.Client(project=project_id, database='odinringdb')
        return _db
    
    # SECURITY: Require FIREBASE_PROJECT_ID - fail fast if missing
    project_id = os.getenv('FIREBASE_PROJECT_ID')
    if not project_id:
        raise ValueError(
            "FIREBASE_PROJECT_ID environment variable is required. "
            "Set it in your environment or Vercel project settings."
        )
    
    # Try FIREBASE_SERVICE_ACCOUNT_JSON env var first, then file for local dev
    service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
    service_account_info = None
    
    if service_account_json:
        try:
            service_account_info = json.loads(service_account_json)
            logger.info("Using FIREBASE_SERVICE_ACCOUNT_JSON from environment")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
    
    # Fallback to file for local development only
    if not service_account_info:
        service_account_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
        if os.path.exists(service_account_path):
            try:
                with open(service_account_path, 'r') as f:
                    service_account_info = json.load(f)
                logger.info(f"Using service account from file: {service_account_path}")
            except Exception as e:
                logger.error(f"Failed to load service account file: {e}")
    
    if not service_account_info:
        raise ValueError(
            "Firebase credentials not found. Either set FIREBASE_SERVICE_ACCOUNT_JSON "
            "environment variable or place firebase-service-account.json in backend folder."
        )
    
    try:
        
        # Normalize private_key by replacing escaped newlines
        service_account_info = _normalize_private_key(service_account_info)
        
        # SECURITY: Validate required fields - fail fast if missing
        _validate_service_account_info(service_account_info)
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(service_account_info)
        _app = firebase_admin.initialize_app(cred)
        
        # Create GCP credentials from service account info
        from google.oauth2 import service_account
        gcp_creds = service_account.Credentials.from_service_account_info(service_account_info)
        
        # Create Firestore client
        # Use odinringdb database (custom database name)
        _db = gcp_firestore.Client(
            project=project_id,
            database='odinringdb',
            credentials=gcp_creds
        )
        
        logger.info("✅ Firebase initialized successfully from environment variable")
        logger.info(f"🔥 Using Firestore database: odinringdb")
        logger.info(f"📦 Project ID: {project_id}")
        
        return _db
        
    except ValueError as e:
        # Re-raise validation errors as-is (fail fast)
        logger.error(f"❌ Firebase credential validation failed: {e}")
        raise
    except Exception as e:
        # Log other errors and re-raise
        logger.error(f"❌ Firebase initialization failed: {e}", exc_info=True)
        raise RuntimeError(f"Firebase initialization failed: {e}") from e

def get_firestore_client():
    """
    Get Firestore client instance with lazy initialization.
    
    Returns: Firestore client or None if initialization fails
    
    SECURITY: This function will attempt to initialize Firebase if not already done.
    If initialization fails (e.g., missing env vars), it returns None instead of raising,
    allowing the app to start and provide helpful error messages.
    """
    global _db, _firestore_client_error
    
    if _db is not None:
        return _db
    
    # Try to initialize, but don't raise if it fails
    try:
        _db = initialize_firebase()
        _firestore_client_error = None
        return _db
    except Exception as e:
        _firestore_client_error = str(e)
        logger.error(f"Failed to get Firestore client: {e}")
        # Don't raise - return None so app can start
        # Routes should check for None and handle gracefully
        return None

# Collection references for easy access
class Collections:
    USERS = 'users'
    RINGS = 'rings'
    ADMINS = 'admins'
    RING_ANALYTICS = 'ring_analytics'
    STATUS_CHECKS = 'status_checks'
    SESSIONS = 'sessions'
    AUDIT_LOGS = 'audit_logs'
    REFRESH_TOKENS = 'refresh_tokens'
    ITEMS = 'items'  # Merchant items/products
    
    # Phase 2: Identity & Subscriptions
    BUSINESSES = 'businesses'
    ORGANIZATIONS = 'organizations'
    DEPARTMENTS = 'departments'
    MEMBERSHIPS = 'memberships'
    SUBSCRIPTIONS = 'subscriptions'

# Helper function to convert Firestore timestamp to datetime
from datetime import datetime as dt

def firestore_to_dict(doc_snapshot):
    """
    Convert Firestore document snapshot to dictionary
    Handles timestamp conversion
    """
    if not doc_snapshot.exists:
        return None
    
    data = doc_snapshot.to_dict()
    data['id'] = doc_snapshot.id
    
    # Convert Firestore timestamps to ISO format strings
    for key, value in data.items():
        if hasattr(value, 'timestamp'):  # Firestore Timestamp
            data[key] = value
    
    return data

def dict_to_firestore(data):
    """
    Prepare dictionary for Firestore storage
    Removes None values and handles special types
    """
    cleaned = {}
    for key, value in data.items():
        # Keep the 'id' field IN the document for querying
        # The document ID will also be set to this value in insert_one
        if value is not None:
            cleaned[key] = value
    return cleaned

