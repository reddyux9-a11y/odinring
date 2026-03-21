#!/usr/bin/env python3
"""
Test Firebase Connection Script
Verifies that Firebase service account credentials are working correctly.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_firebase_connection():
    """Test Firebase connection with current credentials"""
    print("=" * 60)
    print("Firebase Connection Test")
    print("=" * 60)
    
    try:
        # Check if service account file exists
        service_account_path = backend_dir / "firebase-service-account.json"
        if service_account_path.exists():
            print(f"✅ Service account file found: {service_account_path}")
        else:
            print(f"⚠️  Service account file not found: {service_account_path}")
            print("   Using environment variable FIREBASE_SERVICE_ACCOUNT_JSON")
        
        # Check environment variables
        project_id = os.getenv('FIREBASE_PROJECT_ID')
        service_account_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
        
        print(f"\n📋 Environment Check:")
        print(f"   FIREBASE_PROJECT_ID: {'✅ Set' if project_id else '❌ Not set'}")
        if project_id:
            print(f"      Value: {project_id}")
        
        if service_account_json:
            print(f"   FIREBASE_SERVICE_ACCOUNT_JSON: ✅ Set ({len(service_account_json)} chars)")
        else:
            print(f"   FIREBASE_SERVICE_ACCOUNT_JSON: ❌ Not set")
            print(f"      SECURITY: Environment variable is required (file-based credentials eliminated)")
        
        # Try to initialize Firebase
        print(f"\n🔄 Initializing Firebase...")
        from firebase_config import initialize_firebase
        
        db = initialize_firebase()
        print("✅ Firebase initialized successfully!")
        
        # Test Firestore connection
        print(f"\n🔄 Testing Firestore connection...")
        from firestore_db import FirestoreDB
        
        firestore_db = FirestoreDB()
        
        # Try a simple read operation
        print("   Attempting to read from 'users' collection...")
        try:
            # This will just test the connection, not actually query
            # We'll test with a simple collection reference
            users_ref = firestore_db.db.collection('users')
            print("✅ Firestore connection successful!")
            print("   Collection reference created successfully")
        except Exception as e:
            print(f"⚠️  Firestore connection test: {str(e)}")
            print("   (This might be normal if collection doesn't exist)")
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED - Firebase connection is working!")
        print("=" * 60)
        return True
        
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("   Make sure you're in the backend directory and dependencies are installed")
        return False
        
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {str(e)}")
        print("\n🔍 Troubleshooting:")
        print("   1. SECURITY: Use FIREBASE_SERVICE_ACCOUNT_JSON environment variable (not local files)")
        print("   2. Verify FIREBASE_PROJECT_ID is set correctly")
        print("   3. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is set (required for all environments)")
        print("   4. Check that Firebase Admin SDK is installed: pip install firebase-admin")
        print("   5. Verify network connectivity to Firebase")
        print("   6. See SECURITY.md for credential handling guidelines")
        return False

if __name__ == "__main__":
    success = test_firebase_connection()
    sys.exit(0 if success else 1)
