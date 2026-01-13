#!/usr/bin/env python3
"""
Test Firestore API Connection
Checks if Firestore API is enabled and accessible
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from firebase_config import get_firestore_client

def test_firestore_connection():
    """Test if Firestore API is enabled and accessible"""
    
    print("=" * 70)
    print("TESTING FIRESTORE API CONNECTION")
    print("=" * 70)
    print()
    
    try:
        print("1. Getting Firestore client...")
        db = get_firestore_client()
        print("   ✅ Firestore client initialized")
        print()
        
        print("2. Testing read access (listing collections)...")
        collections = list(db.collections())
        print(f"   ✅ Read access successful - Found {len(collections)} collections")
        
        if collections:
            print(f"   Collections: {[col.id for col in collections]}")
        print()
        
        print("3. Testing write access (creating test document)...")
        test_ref = db.collection('_api_test').document('test_connection')
        test_ref.set({
            'test': True,
            'message': 'Firestore API is working!',
            'timestamp': '2025-12-21'
        })
        print("   ✅ Write access successful")
        print()
        
        print("4. Testing read access (reading test document)...")
        doc = test_ref.get()
        if doc.exists:
            print(f"   ✅ Read successful - Data: {doc.to_dict()}")
        print()
        
        print("5. Cleaning up test document...")
        test_ref.delete()
        print("   ✅ Delete successful")
        print()
        
        print("=" * 70)
        print("✅ ALL TESTS PASSED - FIRESTORE API IS FULLY FUNCTIONAL!")
        print("=" * 70)
        print()
        print("Firestore API Status: ENABLED ✅")
        print("Read Access: WORKING ✅")
        print("Write Access: WORKING ✅")
        print("Delete Access: WORKING ✅")
        print()
        return True
        
    except Exception as e:
        print()
        print("=" * 70)
        print("❌ FIRESTORE API TEST FAILED")
        print("=" * 70)
        print()
        print(f"Error: {str(e)}")
        print()
        
        error_str = str(e).lower()
        
        if 'service_disabled' in error_str or '403' in error_str:
            print("🔍 ISSUE IDENTIFIED: Firestore API is DISABLED")
            print()
            print("📋 SOLUTION:")
            print()
            print("1. Enable Firestore API:")
            print("   👉 https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=studio-7743041576-fc16f")
            print()
            print("2. Click 'ENABLE' button")
            print()
            print("3. Wait 30-60 seconds for activation")
            print()
            print("4. Run this test again:")
            print("   python3 test_firestore_api.py")
            print()
        elif 'permission' in error_str or 'credentials' in error_str:
            print("🔍 ISSUE IDENTIFIED: Permission or credentials issue")
            print()
            print("Check:")
            print("  - Service account key is valid")
            print("  - Service account has Firestore permissions")
            print("  - firebase-service-account.json exists")
        else:
            print("🔍 ISSUE: Unknown error")
            print()
            print("Check:")
            print("  - Firebase project ID is correct")
            print("  - Service account key is valid")
            print("  - Network connection is working")
        
        print()
        return False

if __name__ == "__main__":
    success = test_firestore_connection()
    sys.exit(0 if success else 1)

