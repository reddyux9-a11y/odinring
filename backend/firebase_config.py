"""
Firebase Configuration Module
Handles Firebase initialization and provides database access
"""

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import firestore as gcp_firestore
import os
from pathlib import Path
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)

# Global Firebase app and db references
_app = None
_db = None


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

@retry_on_failure(max_retries=3, delay=1, backoff=2)
def initialize_firebase():
    """
    Initialize Firebase Admin SDK with retry logic
    Supports both file path and JSON string for service account (for Vercel serverless)
    Returns: Firestore client
    """
    global _app, _db
    
    if _app is not None:
        logger.info("Firebase already initialized")
        return _db
    
    try:
        # SECURITY: Require FIREBASE_PROJECT_ID - no hardcoded defaults in production
        project_id = os.getenv('FIREBASE_PROJECT_ID')
        if not project_id:
            if os.getenv('ENV', 'development').lower() in ('production', 'prod'):
                raise ValueError("FIREBASE_PROJECT_ID environment variable is required in production")
            # Development fallback only
            logger.warning("FIREBASE_PROJECT_ID not set, using development fallback")
            project_id = 'studio-7743041576-fc16f'  # Development only
        
        # Check if service account JSON is provided as environment variable (for Vercel/serverless)
        service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
        
        if service_account_json:
            # Initialize from JSON string (for serverless environments like Vercel)
            import json
            try:
                service_account_info = json.loads(service_account_json)
                cred = credentials.Certificate(service_account_info)
                _app = firebase_admin.initialize_app(cred)
                
                # Create credentials from the JSON dict
                from google.oauth2 import service_account
                gcp_creds = service_account.Credentials.from_service_account_info(service_account_info)
                
                _db = gcp_firestore.Client(
                    project=project_id,
                    database='odinringdb',
                    credentials=gcp_creds
                )
                
                logger.info("✅ Firebase initialized successfully from JSON environment variable")
                logger.info(f"🔥 Using Firestore database: odinringdb")
                logger.info(f"📦 Project ID: {project_id}")
                
                return _db
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
                raise ValueError(f"Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
        
        # Fallback to file-based initialization (for local development only)
        # SECURITY: In production, only allow JSON environment variable
        env = os.getenv('ENV', 'development').lower()
        if env in ('production', 'prod'):
            logger.error("❌ FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required in production")
            logger.error("File-based authentication is not allowed in production for security reasons")
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON must be set in production environment")
        
        ROOT_DIR = Path(__file__).parent
        
        # Try to get service account path from environment
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')
        full_path = ROOT_DIR / service_account_path
        
        # Check if service account file exists
        if not full_path.exists():
            logger.error(f"❌ Firebase service account file not found at: {full_path}")
            logger.error("Please either:")
            logger.error("  1. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable (required for production)")
            logger.error("  2. Or follow instructions in GET_FIREBASE_KEY.md to download the key file for local development")
            raise FileNotFoundError(f"Firebase service account file not found: {full_path}")
        
        # Initialize Firebase from file
        cred = credentials.Certificate(str(full_path))
        _app = firebase_admin.initialize_app(cred)
        
        # Create credentials from the service account file
        from google.oauth2 import service_account
        gcp_creds = service_account.Credentials.from_service_account_file(str(full_path))
        
        _db = gcp_firestore.Client(
            project=project_id,
            database='odinringdb',
            credentials=gcp_creds
        )
        
        logger.info("✅ Firebase initialized successfully")
        logger.info(f"📁 Service account loaded from: {full_path}")
        logger.info(f"🔥 Using Firestore database: odinringdb")
        logger.info(f"📦 Project ID: {project_id}")
        
        return _db
        
    except Exception as e:
        logger.error(f"❌ Firebase initialization failed: {e}")
        raise

def get_firestore_client():
    """
    Get Firestore client instance
    Returns: Firestore client
    """
    global _db
    
    if _db is None:
        _db = initialize_firebase()
    
    return _db

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

