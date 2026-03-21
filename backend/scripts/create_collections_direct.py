#!/usr/bin/env python3
"""
Create Firestore collections by writing documents directly
This script writes a placeholder document to each collection, which creates the collection
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import datetime
from google.cloud import firestore

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
        print(f"  ❌ Error creating '{collection_name}': {e}")
        return False

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🔥 CREATING FIRESTORE COLLECTIONS")
    print("="*70 + "\n")
    
    try:
        # Try to initialize Firestore client directly
        # This will use Application Default Credentials (ADC)
        print("Attempting to connect to Firestore...")
        db = firestore.Client()
        print("✅ Connected to Firestore\n")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}\n")
        print("Attempting alternative connection method...")
        try:
            # Try using firebase_admin
            from firebase_admin import firestore as admin_firestore
            from firebase_config import initialize_firebase
            
            initialize_firebase()
            db = admin_firestore.client()
            print("✅ Connected to Firestore using firebase_admin\n")
        except Exception as e2:
            print(f"❌ Alternative connection also failed: {e2}\n")
            print("Please ensure:")
            print("1. Firebase/Firestore is enabled in your project")
            print("2. You have proper credentials configured")
            print("3. The database exists in Native mode")
            print("\nAlternatively, create collections manually in Firebase Console:")
            print("https://console.firebase.google.com/")
            sys.exit(1)
    
    created_count = 0
    failed_count = 0
    existing_count = 0
    
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
    
    if failed_count > 0:
        print("\n⚠️  Some collections failed to create.")
        print("   You may need to create them manually in Firebase Console:")
        print("   https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore")

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
        sys.exit(1)







