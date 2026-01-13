#!/usr/bin/env python3
"""
Create missing Firestore collections by adding placeholder documents
This script creates documents in collections that don't exist yet
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from firebase_admin import firestore
from firebase_config import initialize_firebase
from datetime import datetime
import uuid

# Initialize Firebase
try:
    initialize_firebase()
    db = firestore.client()
    print("✅ Firebase initialized successfully\n")
except Exception as e:
    print(f"❌ Failed to initialize Firebase: {e}")
    sys.exit(1)

# Missing collections to create (Phase 1 & Phase 2)
MISSING_COLLECTIONS = {
    # Phase 1 - Security
    'sessions': {
        'description': 'Active user sessions for authentication',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Active user sessions for authentication',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when users log in.'
        }
    },
    'refresh_tokens': {
        'description': 'Refresh tokens for JWT rotation',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Refresh tokens for JWT rotation',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when tokens are issued.'
        }
    },
    'audit_logs': {
        'description': 'Comprehensive audit trail for compliance',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Comprehensive audit trail for compliance',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when audited actions occur.'
        }
    },
    # Phase 2 - Identity & Subscriptions
    'businesses': {
        'description': 'Solo business and micro-enterprise profiles',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Solo business and micro-enterprise profiles',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when users create business accounts.'
        }
    },
    'organizations': {
        'description': 'Multi-user organization profiles',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Multi-user organization profiles',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when users create organizations.'
        }
    },
    'departments': {
        'description': 'Organization departments or teams',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Organization departments or teams',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when organizations create departments.'
        }
    },
    'memberships': {
        'description': 'Organization membership and roles',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Organization membership and roles',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when users join organizations.'
        }
    },
    'subscriptions': {
        'description': 'Subscription plans and billing state',
        'placeholder_fields': {
            '_is_placeholder': True,
            '_description': 'Subscription plans and billing state',
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document. Collection will be populated when users sign up (subscriptions are auto-created).'
        }
    }
}


def check_collection_exists(collection_name):
    """Check if collection exists by trying to read from it"""
    try:
        collection_ref = db.collection(collection_name)
        docs = list(collection_ref.limit(1).stream())
        return len(docs) > 0
    except Exception:
        return False


def create_placeholder_document(collection_name, placeholder_data):
    """Create a placeholder document in the collection"""
    try:
        collection_ref = db.collection(collection_name)
        placeholder_id = '_placeholder_init'
        
        # Check if placeholder already exists
        doc_ref = collection_ref.document(placeholder_id)
        existing_doc = doc_ref.get()
        
        if existing_doc.exists:
            print(f"  ⚠️  Placeholder already exists in '{collection_name}'")
            return True
        
        # Create placeholder document
        doc_ref.set(placeholder_data)
        print(f"  ✅ Created placeholder document in '{collection_name}'")
        return True
        
    except Exception as e:
        print(f"  ❌ Error creating placeholder in '{collection_name}': {e}")
        return False


def main():
    """Main function to create missing collections"""
    print("\n" + "="*70)
    print("🔥 CREATING MISSING FIRESTORE COLLECTIONS")
    print("="*70 + "\n")
    
    created_count = 0
    skipped_count = 0
    failed_count = 0
    
    for collection_name, collection_info in MISSING_COLLECTIONS.items():
        print(f"Processing: {collection_name}")
        print(f"  Description: {collection_info['description']}")
        
        # Check if collection already has documents
        if check_collection_exists(collection_name):
            print(f"  ⚠️  Collection '{collection_name}' already has documents, skipping...")
            skipped_count += 1
        else:
            # Create placeholder document
            if create_placeholder_document(collection_name, collection_info['placeholder_fields']):
                created_count += 1
            else:
                failed_count += 1
        
        print()  # Empty line for readability
    
    # Summary
    print("="*70)
    print("📊 CREATION SUMMARY")
    print("="*70)
    print(f"Total Collections Processed: {len(MISSING_COLLECTIONS)}")
    print(f"✅ Successfully Created: {created_count}")
    print(f"⚠️  Already Existed (Skipped): {skipped_count}")
    print(f"❌ Failed: {failed_count}")
    print("="*70 + "\n")
    
    if created_count > 0:
        print("✅ Missing collections have been created!")
        print("\nYou can now see these collections in Firestore Console:")
        for collection_name in MISSING_COLLECTIONS.keys():
            print(f"  • {collection_name}")
        print("\n💡 Note: Placeholder documents can be safely deleted once real data is added.")
    
    print("\nNext Steps:")
    print("1. Check Firestore Console to verify collections exist")
    print("2. Collections will be populated with real data when:")
    print("   - Users sign up → 'subscriptions' created")
    print("   - Users log in → 'sessions' created")
    print("   - Actions occur → 'audit_logs' created")
    print("="*70 + "\n")


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







