#!/usr/bin/env python3
"""
Setup and Seed Firestore Database
Creates the database and populates it with initial data
"""

import sys
import os
import time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def create_firestore_database():
    """Create Firestore database using Google Cloud API"""
    
    print("=" * 70)
    print("CREATING FIRESTORE DATABASE")
    print("=" * 70)
    print()
    
    try:
        from google.cloud import firestore_admin_v1
        from google.api_core import exceptions
        
        print("1. Initializing Firestore Admin client...")
        
        # Set credentials
        service_account_path = os.path.join(os.path.dirname(__file__), 'backend', 'firebase-service-account.json')
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        
        client = firestore_admin_v1.FirestoreAdminClient()
        
        project_id = "studio-7743041576-fc16f"
        parent = f"projects/{project_id}"
        
        print("2. Checking if database exists...")
        
        # Try to get the database
        database_path = f"projects/{project_id}/databases/(default)"
        
        try:
            db = client.get_database(name=database_path)
            print(f"   ✅ Database already exists: {db.name}")
            print(f"   Location: {db.location_id}")
            print(f"   Type: {db.type_}")
            return True
        except exceptions.NotFound:
            print("   ℹ️  Database not found, will create it")
        except Exception as e:
            print(f"   ⚠️  Error checking database: {e}")
        
        print()
        print("3. Creating Firestore database...")
        print("   This may take 1-2 minutes...")
        
        # Create database request
        database = firestore_admin_v1.Database(
            name=database_path,
            location_id="nam5",  # Multi-region US
            type_=firestore_admin_v1.Database.DatabaseType.FIRESTORE_NATIVE,
        )
        
        request = firestore_admin_v1.CreateDatabaseRequest(
            parent=parent,
            database=database,
            database_id="(default)"
        )
        
        # This returns a long-running operation
        operation = client.create_database(request=request)
        
        print("   ⏳ Waiting for database creation...")
        
        # Wait for the operation to complete
        response = operation.result(timeout=300)  # 5 minutes timeout
        
        print(f"   ✅ Database created successfully!")
        print(f"   Name: {response.name}")
        print(f"   Location: {response.location_id}")
        
        return True
        
    except ImportError:
        print("   ❌ google-cloud-firestore-admin not installed")
        print()
        print("   Installing required package...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "google-cloud-firestore-admin"])
        print("   ✅ Package installed, please run script again")
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        print()
        print("   ⚠️  Automatic database creation failed.")
        print()
        print("   Please create the database manually:")
        print("   👉 https://console.cloud.google.com/datastore/setup?project=studio-7743041576-fc16f")
        print()
        print("   Steps:")
        print("   1. Click 'Create database'")
        print("   2. Choose 'Firestore Native Mode' (Production)")
        print("   3. Select location (us-central1 or nam5)")
        print("   4. Click 'Enable'")
        print("   5. Wait 60 seconds")
        print("   6. Run this script again")
        print()
        return False

def seed_firestore_database():
    """Seed the database with initial data"""
    
    print()
    print("=" * 70)
    print("SEEDING FIRESTORE DATABASE")
    print("=" * 70)
    print()
    
    try:
        from firebase_config import get_firestore_client
        from datetime import datetime
        import uuid
        import bcrypt
        
        db = get_firestore_client()
        
        print("1. Creating admin user...")
        
        # Create admin
        admin_id = str(uuid.uuid4())
        admin_data = {
            'id': admin_id,
            'username': 'admin',
            'email': 'admin@odinring.com',
            'password': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            'role': 'super_admin',
            'is_super_admin': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db.collection('admins').document(admin_id).set(admin_data)
        print(f"   ✅ Admin created")
        print(f"      Username: admin")
        print(f"      Password: admin123")
        print(f"      Email: admin@odinring.com")
        
        print()
        print("2. Creating sample user...")
        
        # Create sample user
        user_id = str(uuid.uuid4())
        user_data = {
            'id': user_id,
            'username': 'demo_user',
            'email': 'demo@odinring.com',
            'full_name': 'Demo User',
            'bio': 'Sample user for testing',
            'avatar_url': '',
            'ring_id': None,
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db.collection('users').document(user_id).set(user_data)
        print(f"   ✅ Sample user created")
        print(f"      Username: demo_user")
        print(f"      Email: demo@odinring.com")
        
        print()
        print("3. Creating sample link...")
        
        # Create sample link
        link_id = str(uuid.uuid4())
        link_data = {
            'id': link_id,
            'user_id': user_id,
            'title': 'My Website',
            'url': 'https://example.com',
            'icon': 'globe',
            'active': True,
            'order': 0,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db.collection('links').document(link_id).set(link_data)
        print(f"   ✅ Sample link created")
        
        print()
        print("=" * 70)
        print("✅ DATABASE SEEDED SUCCESSFULLY!")
        print("=" * 70)
        print()
        print("Admin Login:")
        print("  Username: admin")
        print("  Password: admin123")
        print()
        print("Collections created:")
        print("  ✅ admins (1 admin)")
        print("  ✅ users (1 user)")
        print("  ✅ links (1 link)")
        print()
        return True
        
    except Exception as e:
        print(f"   ❌ Seeding failed: {e}")
        print()
        
        error_str = str(e).lower()
        if '404' in error_str or 'not exist' in error_str:
            print("   Database doesn't exist yet!")
            print("   Create it first:")
            print("   👉 https://console.cloud.google.com/datastore/setup?project=studio-7743041576-fc16f")
        
        return False

def main():
    """Main setup function"""
    
    print()
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║                                                               ║")
    print("║         🔥 FIRESTORE DATABASE SETUP & SEED 🔥               ║")
    print("║                                                               ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print()
    
    # Step 1: Try to create database (or verify it exists)
    print("STEP 1: Database Creation")
    print("-" * 70)
    
    # Check if database exists first
    try:
        from firebase_config import get_firestore_client
        db = get_firestore_client()
        
        # Try a simple operation - list collections
        collections_iter = db.collections()
        collections = []
        try:
            # Try to get first collection
            for col in collections_iter:
                collections.append(col)
                break
        except:
            pass
        
        print("✅ Database exists and is accessible!")
        print(f"   Found {len(collections)} collection(s)")
        print()
        database_exists = True
        
    except Exception as e:
        error_str = str(e)
        if '404' in error_str or 'not exist' in error_str:
            print("❌ Database doesn't exist")
            print()
            database_exists = False
            
            print("━" * 70)
            print()
            print("⚠️  MANUAL ACTION REQUIRED")
            print()
            print("The Firestore database must be created in the Firebase Console.")
            print("Unfortunately, this cannot be done automatically via API.")
            print()
            print("Please follow these steps:")
            print()
            print("1. Open this link:")
            print("   👉 https://console.cloud.google.com/datastore/setup?project=studio-7743041576-fc16f")
            print()
            print("2. Click 'Create database'")
            print()
            print("3. Select:")
            print("   • Firestore Native Mode")
            print("   • Production mode")
            print("   • Location: nam5 or us-central1")
            print()
            print("4. Click 'Enable'")
            print()
            print("5. Wait 60 seconds for creation")
            print()
            print("6. Run this script again:")
            print("   python3 setup_firestore_database.py")
            print()
            print("━" * 70)
            print()
            return False
        else:
            print(f"❌ Error accessing database: {error_str}")
            return False
    
    # Step 2: Seed database
    if database_exists:
        print()
        print("STEP 2: Database Seeding")
        print("-" * 70)
        
        success = seed_firestore_database()
        
        if success:
            print()
            print("━" * 70)
            print("✅ SETUP COMPLETE!")
            print("━" * 70)
            print()
            print("Next steps:")
            print("  1. Add 'localhost' to authorized domains")
            print("     👉 https://console.firebase.google.com/project/studio-7743041576-fc16f/authentication/settings")
            print()
            print("  2. Restart backend server:")
            print("     npm run restart:backend")
            print()
            print("  3. Open your app:")
            print("     http://localhost:3000")
            print()
            print("  4. Test admin login:")
            print("     Username: admin")
            print("     Password: admin123")
            print()
            return True
        else:
            return False
    
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

