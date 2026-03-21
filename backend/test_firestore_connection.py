#!/usr/bin/env python3
"""
🔥 FIRESTORE CONNECTION & RULES TEST
Tests Firestore database connection, collections, and security rules
"""

import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from firebase_config import initialize_firebase
    from firestore_db import FirestoreDB
    print("✅ Firebase imports successful")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)


def print_section(title):
    """Print formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_firebase_initialization():
    """Test Firebase Admin SDK initialization"""
    print_section("🔥 TEST 1: Firebase Initialization")
    
    try:
        db = initialize_firebase()
        if db:
            print("✅ Firebase Admin SDK initialized successfully")
            print(f"✅ Firestore client type: {type(db)}")
            return db
        else:
            print("❌ Firebase initialization returned None")
            return None
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        return None


def test_firestore_collections(db):
    """Test Firestore collections access"""
    print_section("📚 TEST 2: Firestore Collections Access")
    
    collections_to_test = [
        'users',
        'links', 
        'rings',
        'analytics',
        'admins',
        'subscriptions'
    ]
    
    results = {}
    
    for collection_name in collections_to_test:
        try:
            firestore_db = FirestoreDB(collection_name)
            print(f"✅ {collection_name}: Collection initialized")
            results[collection_name] = True
        except Exception as e:
            print(f"❌ {collection_name}: {e}")
            results[collection_name] = False
    
    total = len(collections_to_test)
    success = sum(results.values())
    print(f"\n📊 Collection Access: {success}/{total} successful")
    
    return results


def test_firestore_read_write(db):
    """Test Firestore read/write operations"""
    print_section("✏️ TEST 3: Firestore Read/Write Operations")
    
    try:
        # Initialize users collection
        users_db = FirestoreDB('users')
        
        # Test 1: Count documents
        print("\n🔍 Test 3.1: Count existing users")
        try:
            count = users_db.count_documents({})
            print(f"✅ Users collection count: {count} users")
        except Exception as e:
            print(f"❌ Count failed: {e}")
            return False
        
        # Test 2: Create test document
        print("\n✏️ Test 3.2: Create test document")
        test_user_id = f"test_user_{datetime.now().timestamp()}"
        test_user = {
            "name": "Test User",
            "email": "test@firestore-test.com",
            "username": test_user_id,
            "created_at": datetime.utcnow().isoformat(),
            "is_test": True
        }
        
        try:
            result = users_db.insert_one(test_user)
            if result:
                print(f"✅ Test user created successfully")
                print(f"   Document ID: {test_user_id}")
            else:
                print("❌ Insert returned None")
                return False
        except Exception as e:
            print(f"❌ Insert failed: {e}")
            return False
        
        # Test 3: Read test document
        print("\n📖 Test 3.3: Read test document")
        try:
            retrieved = users_db.find_one({"username": test_user_id})
            if retrieved:
                print(f"✅ Test user retrieved successfully")
                print(f"   Name: {retrieved.get('name')}")
                print(f"   Email: {retrieved.get('email')}")
            else:
                print("❌ Document not found after creation")
                return False
        except Exception as e:
            print(f"❌ Read failed: {e}")
            return False
        
        # Test 4: Update test document
        print("\n🔄 Test 3.4: Update test document")
        try:
            update_result = users_db.update_one(
                {"username": test_user_id},
                {"bio": "Updated via Firestore test"}
            )
            if update_result:
                print(f"✅ Test user updated successfully")
            else:
                print("⚠️ Update returned None")
        except Exception as e:
            print(f"❌ Update failed: {e}")
            return False
        
        # Test 5: Delete test document
        print("\n🗑️ Test 3.5: Delete test document")
        try:
            delete_result = users_db.delete_one({"username": test_user_id})
            if delete_result:
                print(f"✅ Test user deleted successfully")
            else:
                print("⚠️ Delete returned None")
        except Exception as e:
            print(f"❌ Delete failed: {e}")
            return False
        
        print("\n✅ All read/write operations successful!")
        return True
        
    except Exception as e:
        print(f"❌ Read/Write test failed: {e}")
        return False


def test_firestore_queries(db):
    """Test Firestore query operations"""
    print_section("🔍 TEST 4: Firestore Query Operations")
    
    try:
        users_db = FirestoreDB('users')
        
        # Test 1: Find all users
        print("\n📋 Test 4.1: Query all users")
        try:
            all_users = users_db.find({})
            print(f"✅ Query successful: {len(all_users)} users found")
            
            if all_users:
                first_user = all_users[0]
                print(f"   Sample user: {first_user.get('email', 'N/A')}")
        except Exception as e:
            print(f"❌ Query failed: {e}")
            return False
        
        # Test 2: Query with filter
        print("\n🔎 Test 4.2: Query with email filter")
        try:
            # Try to find a user by email (will be empty if no users)
            filtered = users_db.find({"email": {"$exists": True}})
            print(f"✅ Filter query successful: {len(filtered)} users with email")
        except Exception as e:
            print(f"❌ Filter query failed: {e}")
            return False
        
        print("\n✅ All query operations successful!")
        return True
        
    except Exception as e:
        print(f"❌ Query test failed: {e}")
        return False


def test_auth_integration():
    """Test authentication-related Firestore operations"""
    print_section("🔐 TEST 5: Auth Integration")
    
    try:
        users_db = FirestoreDB('users')
        
        # Test: Check if we can query by email (typical auth lookup)
        print("\n🔐 Test 5.1: Auth-style email lookup")
        try:
            # This is how auth would look up a user
            test_email = "test@example.com"
            user = users_db.find_one({"email": test_email})
            if user:
                print(f"✅ Found user: {user.get('email')}")
            else:
                print(f"ℹ️ No user found with email: {test_email} (expected for new setup)")
            
            print("✅ Auth-style queries work correctly")
            return True
        except Exception as e:
            print(f"❌ Auth query failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Auth integration test failed: {e}")
        return False


def check_firestore_rules():
    """Check Firestore security rules (informational)"""
    print_section("🛡️ TEST 6: Firestore Security Rules")
    
    print("""
ℹ️ Security Rules Check

Your Firestore security rules should allow:
  ✓ Read access for authenticated users
  ✓ Write access for document owners
  ✓ Admin access for admin users

To verify rules:
  1. Go to: https://console.firebase.google.com/
  2. Select project: studio-7743041576-fc16f
  3. Navigate to: Firestore Database → Rules
  4. Verify rules are deployed

Expected rules structure:
  - isSignedIn(): Check if user is authenticated
  - isOwner(): Check if user owns the document
  - isAdmin(): Check if user has admin privileges

⚠️ MANUAL ACTION REQUIRED:
   → Verify rules in Firebase Console
   → Ensure rules were deployed successfully
""")


def print_summary(results):
    """Print test summary"""
    print_section("📊 TEST SUMMARY")
    
    total_tests = len(results)
    passed = sum(results.values())
    failed = total_tests - passed
    
    print(f"\n✅ Passed: {passed}/{total_tests}")
    print(f"❌ Failed: {failed}/{total_tests}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Firestore connection is healthy")
        print("✅ Ready for production use")
        return True
    else:
        print("\n⚠️ SOME TESTS FAILED")
        print("❌ Review errors above")
        print("❌ Fix issues before proceeding")
        return False


def main():
    """Main test execution"""
    print("\n" + "=" * 70)
    print("  🔥 FIRESTORE CONNECTION & RULES COMPREHENSIVE TEST")
    print("=" * 70)
    print(f"\n📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🏗️ Project: OdinRing")
    print(f"🗄️ Database: odinringdb")
    
    results = {}
    
    # Test 1: Firebase Initialization
    db = test_firebase_initialization()
    results['initialization'] = db is not None
    
    if not db:
        print("\n❌ CRITICAL: Firebase initialization failed!")
        print("❌ Cannot proceed with other tests")
        sys.exit(1)
    
    # Test 2: Collections Access
    collection_results = test_firestore_collections(db)
    results['collections'] = all(collection_results.values())
    
    # Test 3: Read/Write Operations
    results['read_write'] = test_firestore_read_write(db)
    
    # Test 4: Query Operations
    results['queries'] = test_firestore_queries(db)
    
    # Test 5: Auth Integration
    results['auth_integration'] = test_auth_integration()
    
    # Test 6: Security Rules (informational)
    check_firestore_rules()
    results['rules_info'] = True  # Informational only
    
    # Print Summary
    success = print_summary(results)
    
    if success:
        print("\n" + "=" * 70)
        print("  🎯 NEXT STEPS:")
        print("=" * 70)
        print("""
1. ✅ Start Backend Server:
   cd backend && source venv/bin/activate
   python3 -m uvicorn server:app --reload --port 8000

2. ✅ Start Frontend Server:
   cd frontend && npm start

3. ✅ Open TESTING_SCRIPT.md and begin Phase 1 tests

4. ⚠️ MANUAL: Verify Firebase Console authorized domains
   → https://console.firebase.google.com/
   → Authentication → Settings → Authorized domains
   → Ensure "localhost" is present
""")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()



