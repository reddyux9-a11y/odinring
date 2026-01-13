"""
Firestore Database Seeding Script
Creates initial data structure and default admin account
"""

import asyncio
from firebase_config import initialize_firebase, Collections
from firestore_db import get_db
import bcrypt
from datetime import datetime
import sys

def hash_password(password: str) -> str:
    """Hash a password"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_database():
    """Seed Firestore with initial data"""
    
    print("🔥 Firebase Seeding Script")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        print("\n1️⃣ Initializing Firebase...")
        db_instance = get_db()
        print("✅ Firebase initialized successfully\n")
        
        # Create default admin
        print("2️⃣ Creating default admin account...")
        admins_collection = db_instance.collection(Collections.ADMINS)
        
        # Check if admin already exists
        existing_admins = await db_instance.find(Collections.ADMINS, {'username': 'admin'})
        
        if existing_admins:
            print("⚠️  Default admin already exists, skipping...")
        else:
            admin_data = {
                'id': 'admin-default',
                'username': 'admin',
                'email': 'admin@odinring.com',
                'password': hash_password('admin123'),
                'role': 'super_admin',
                'created_at': datetime.utcnow(),
                'last_login': None
            }
            
            await db_instance.insert_one(Collections.ADMINS, admin_data)
            print("✅ Default admin created")
            print("   Username: admin")
            print("   Password: admin123")
            print("   ⚠️  Change this password in production!\n")
        
        # Create collection indexes (Firestore will create collections on first write)
        print("3️⃣ Initializing collections...")
        
        collections_to_init = [
            Collections.USERS,
            Collections.RINGS,
            Collections.ADMINS,
            Collections.RING_ANALYTICS,
            Collections.STATUS_CHECKS
        ]
        
        for collection_name in collections_to_init:
            # Just reference the collection - it will be created when data is added
            collection_ref = db_instance.collection(collection_name)
            print(f"   ✅ {collection_name} collection ready")
        
        print("\n4️⃣ Database structure initialized")
        
        # Summary
        print("\n" + "=" * 50)
        print("🎉 Database seeding completed successfully!")
        print("=" * 50)
        print("\n📊 Summary:")
        print("   - Default admin account created")
        print("   - Collections initialized")
        print("   - Ready for user registration")
        
        print("\n🚀 Next steps:")
        print("   1. Start backend server: python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000")
        print("   2. Start frontend: npm start")
        print("   3. Visit http://localhost:3000")
        print("   4. Register new users or login as admin")
        
        print("\n🔐 Default Credentials:")
        print("   Admin Login:")
        print("   - URL: http://localhost:3000/admin-login")
        print("   - Username: admin")
        print("   - Password: admin123")
        print("   ⚠️  CHANGE THESE IN PRODUCTION!")
        
        return True
        
    except FileNotFoundError as e:
        print("\n❌ Error: Firebase service account key not found!")
        print("\n📝 Please follow these steps:")
        print("   1. Go to: https://console.firebase.google.com/")
        print("   2. Select project: studio-7743041576-fc16f")
        print("   3. Settings → Service accounts → Generate new private key")
        print("   4. Save as: backend/firebase-service-account.json")
        print("\n📖 See GET_FIREBASE_KEY.md for detailed instructions")
        return False
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main entry point"""
    print("\n" + "=" * 50)
    print("🔥 FIREBASE FIRESTORE SEEDING")
    print("=" * 50)
    
    # Run async seed function
    success = asyncio.run(seed_database())
    
    if not success:
        sys.exit(1)
    
    sys.exit(0)

if __name__ == "__main__":
    main()

