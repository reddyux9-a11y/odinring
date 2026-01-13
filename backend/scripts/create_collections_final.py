#!/usr/bin/env python3
"""
Create Firestore collections using the existing Firebase configuration
This script uses the firebase_config module to properly connect
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime

# Missing collections to create
COLLECTIONS_TO_CREATE = [
    'sessions',
    'refresh_tokens', 
    'audit_logs',
    'businesses',
    'organizations',
    'departments',
    'memberships',
    'subscriptions'
]

def create_collection_by_writing_document(db, collection_name):
    """Create a collection by writing a placeholder document"""
    try:
        collection_ref = db.collection(collection_name)
        placeholder_id = '_placeholder_init'
        doc_ref = collection_ref.document(placeholder_id)
        
        # Check if document already exists
        doc = doc_ref.get()
        if doc.exists:
            print(f"  ✅ Collection '{collection_name}' already exists (document found)")
            return True
        
        # Create placeholder document
        placeholder_data = {
            '_is_placeholder': True,
            '_description': f'Placeholder document for {collection_name} collection',
            '_created_at': datetime.utcnow(),
            '_note': 'This placeholder document was created to initialize the collection. It can be safely deleted once real data is added.'
        }
        
        doc_ref.set(placeholder_data)
        print(f"  ✅ Created collection '{collection_name}' (placeholder document written)")
        return True
        
    except Exception as e:
        error_msg = str(e)
        if '404' in error_msg and 'does not exist' in error_msg:
            print(f"  ⚠️  Database connection issue: {error_msg[:100]}...")
            print(f"     Please ensure Firestore database is enabled in Firebase Console")
        else:
            print(f"  ❌ Error creating '{collection_name}': {error_msg[:100]}")
        return False

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🔥 CREATING FIRESTORE COLLECTIONS")
    print("="*70 + "\n")
    
    try:
        # Use the existing firebase_config module
        from firebase_config import get_firestore_client
        print("Connecting to Firestore using firebase_config...")
        db = get_firestore_client()
        print("✅ Connected to Firestore\n")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}\n")
        print("The script cannot connect to your Firestore database.")
        print("\nThis is likely because:")
        print("1. The database doesn't exist yet (needs to be created in Firebase Console)")
        print("2. The service account credentials are missing or incorrect")
        print("3. The database name/region doesn't match the configuration")
        print("\n📋 RECOMMENDED: Create collections manually in Firebase Console")
        print("   See: docs/MANUAL_CREATE_COLLECTIONS.md for step-by-step instructions")
        print("\n🌐 Firebase Console:")
        print("   https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore")
        sys.exit(1)
    
    created_count = 0
    failed_count = 0
    
    print(f"Creating {len(COLLECTIONS_TO_CREATE)} collections...\n")
    
    for collection_name in COLLECTIONS_TO_CREATE:
        print(f"Processing: {collection_name}")
        result = create_collection_by_writing_document(db, collection_name)
        
        if result:
            created_count += 1
        else:
            failed_count += 1
        print()
    
    # Summary
    print("="*70)
    print("📊 SUMMARY")
    print("="*70)
    print(f"Total Collections: {len(COLLECTIONS_TO_CREATE)}")
    print(f"✅ Created/Exists: {created_count}")
    print(f"❌ Failed: {failed_count}")
    print("="*70 + "\n")
    
    if created_count > 0:
        print("✅ Collections created successfully!")
        print("\nCollections created:")
        for collection_name in COLLECTIONS_TO_CREATE:
            print(f"  • {collection_name}")
        print("\n💡 Note: Placeholder documents can be safely deleted later.")
        print("   Collections will be populated with real data when used.")
        print("\n🔍 Verify in Firebase Console:")
        print("   https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore/data")
    
    if failed_count > 0:
        print("\n⚠️  Some collections failed to create.")
        print("   The collections may need to be created manually.")
        print("\n📋 Manual creation guide:")
        print("   See: docs/MANUAL_CREATE_COLLECTIONS.md")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        print("\n📋 Please create collections manually in Firebase Console:")
        print("   https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore")
        sys.exit(1)







