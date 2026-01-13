"""
Test Firebase Connection
Quick script to verify Firebase is set up correctly
"""

import sys

def test_firebase_connection():
    """Test Firebase connection"""
    print("\n🔥 Testing Firebase Connection")
    print("=" * 50)
    
    try:
        # Test 1: Import Firebase modules
        print("\n1️⃣ Testing Firebase imports...")
        from firebase_config import initialize_firebase
        from firestore_db import get_db
        print("✅ Firebase modules imported successfully")
        
        # Test 2: Initialize Firebase
        print("\n2️⃣ Initializing Firebase...")
        db = get_db()
        print("✅ Firebase initialized successfully")
        
        # Test 3: Test database connection
        print("\n3️⃣ Testing Firestore connection...")
        test_collection = db.collection('test_collection')
        print("✅ Firestore collection accessed successfully")
        
        # Test 4: Write test document
        print("\n4️⃣ Testing write operation...")
        test_doc = {
            'test': True,
            'message': 'Firebase connection test successful'
        }
        test_collection.document('test_doc').set(test_doc)
        print("✅ Test document written successfully")
        
        # Test 5: Read test document
        print("\n5️⃣ Testing read operation...")
        doc = test_collection.document('test_doc').get()
        if doc.exists:
            print(f"✅ Test document read successfully: {doc.to_dict()}")
        else:
            print("❌ Test document not found")
            return False
        
        # Test 6: Delete test document
        print("\n6️⃣ Cleaning up test data...")
        test_collection.document('test_doc').delete()
        print("✅ Test document deleted successfully")
        
        # Success!
        print("\n" + "=" * 50)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 50)
        print("\n✅ Firebase/Firestore is configured correctly")
        print("\n🚀 You can now:")
        print("   1. Run: python3 seed_firestore.py")
        print("   2. Start backend server")
        print("   3. Start frontend")
        
        return True
        
    except FileNotFoundError as e:
        print("\n❌ Error: Firebase service account key not found!")
        print("\n📝 Please download your Firebase service account key:")
        print("   1. Go to: https://console.firebase.google.com/")
        print("   2. Select project: studio-7743041576-fc16f")
        print("   3. Settings → Service accounts → Generate new private key")
        print("   4. Save as: backend/firebase-service-account.json")
        print("\n📖 See GET_FIREBASE_KEY.md for detailed instructions")
        return False
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        print("\n💡 Troubleshooting:")
        print("   - Make sure firebase-service-account.json exists in backend/")
        print("   - Make sure the file is valid JSON")
        print("   - Check your internet connection")
        return False

if __name__ == "__main__":
    success = test_firebase_connection()
    sys.exit(0 if success else 1)

