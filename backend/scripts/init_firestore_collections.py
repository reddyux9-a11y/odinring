#!/usr/bin/env python3
"""
Initialize all Firestore collections with proper structure and indexes
This script creates all necessary collections and verifies their existence
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
initialize_firebase()
db = firestore.client()

# Define all collections with their structure
COLLECTIONS = {
    # Core Collections (Phase 0)
    'users': {
        'description': 'User profiles and authentication data',
        'sample_fields': {
            'id': 'uuid',
            'email': 'string',
            'username': 'string',
            'name': 'string',
            'password': 'string (hashed)',
            'ring_id': 'string (optional)',
            'google_id': 'string (optional)',
            'profile_photo': 'string (url)',
            'bio': 'string',
            'theme': 'string',
            'accent_color': 'string',
            'custom_logo': 'string',
            'profile_views': 'number',
            'total_clicks': 'number',
            'is_active': 'boolean',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['email', 'username', 'ring_id', 'google_id']
    },
    'links': {
        'description': 'User links and content',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'title': 'string',
            'url': 'string',
            'icon': 'string',
            'order': 'number',
            'is_active': 'boolean',
            'clicks': 'number',
            'schedule': 'object (optional)',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['user_id', 'user_id + order', 'user_id + is_active + order']
    },
    'rings': {
        'description': 'NFC ring inventory and assignments',
        'sample_fields': {
            'id': 'uuid',
            'ring_id': 'string (unique)',
            'assigned_user': 'string (optional)',
            'status': 'string (available|assigned|inactive)',
            'activation_date': 'timestamp',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['ring_id', 'assigned_user', 'status']
    },
    'analytics': {
        'description': 'Page view and interaction analytics',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'timestamp': 'timestamp',
            'ip_address': 'string',
            'user_agent': 'string',
            'referrer': 'string (optional)',
            'country': 'string (optional)',
            'city': 'string (optional)'
        },
        'indexes': ['user_id + timestamp', 'user_id + referrer + timestamp']
    },
    'ring_analytics': {
        'description': 'NFC ring tap events',
        'sample_fields': {
            'id': 'uuid',
            'ring_id': 'string',
            'user_id': 'string',
            'timestamp': 'timestamp',
            'event_type': 'string',
            'ip_address': 'string',
            'location': 'object (optional)'
        },
        'indexes': ['ring_id + timestamp', 'user_id + timestamp', 'event_type + timestamp']
    },
    'qr_scans': {
        'description': 'QR code scan tracking',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'scan_type': 'string (profile|link)',
            'link_id': 'string (optional)',
            'timestamp': 'timestamp',
            'ip_address': 'string',
            'user_agent': 'string'
        },
        'indexes': ['user_id + timestamp']
    },
    'appointments': {
        'description': 'User scheduling and appointments',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'title': 'string',
            'description': 'string',
            'appointment_date': 'timestamp',
            'duration': 'number (minutes)',
            'status': 'string (scheduled|completed|cancelled)',
            'attendee_email': 'string',
            'attendee_name': 'string',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['user_id + status + appointment_date']
    },
    'availability': {
        'description': 'User availability time slots',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'day_of_week': 'number (0-6)',
            'start_time': 'string (HH:MM)',
            'end_time': 'string (HH:MM)',
            'is_active': 'boolean',
            'created_at': 'timestamp'
        },
        'indexes': ['user_id + day_of_week']
    },
    'admins': {
        'description': 'Admin user accounts',
        'sample_fields': {
            'id': 'uuid',
            'email': 'string',
            'username': 'string',
            'name': 'string',
            'password': 'string (hashed)',
            'role': 'string (super_admin|admin)',
            'created_at': 'timestamp',
            'last_login': 'timestamp'
        },
        'indexes': ['email', 'username']
    },
    'status_checks': {
        'description': 'System health check logs',
        'sample_fields': {
            'id': 'uuid',
            'timestamp': 'timestamp',
            'status': 'string (healthy|degraded|down)',
            'response_time': 'number',
            'details': 'object'
        },
        'indexes': ['timestamp']
    },
    
    # Phase 1 Collections (Security & Compliance)
    'sessions': {
        'description': 'Active user sessions for authentication',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'session_id': 'string',
            'token': 'string',
            'ip_address': 'string',
            'user_agent': 'string',
            'created_at': 'timestamp',
            'expires_at': 'timestamp',
            'is_active': 'boolean',
            'last_activity': 'timestamp'
        },
        'indexes': [
            'user_id + is_active + created_at',
            'expires_at + is_active',
            'user_id + last_activity'
        ]
    },
    'refresh_tokens': {
        'description': 'Refresh tokens for JWT rotation',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'session_id': 'string',
            'token_hash': 'string',
            'family_id': 'string',
            'created_at': 'timestamp',
            'expires_at': 'timestamp',
            'is_revoked': 'boolean',
            'revoked_at': 'timestamp (optional)'
        },
        'indexes': [
            'user_id + is_revoked + created_at',
            'expires_at + is_revoked',
            'family_id + created_at',
            'session_id + is_revoked'
        ]
    },
    'audit_logs': {
        'description': 'Comprehensive audit trail for compliance',
        'sample_fields': {
            'id': 'uuid',
            'actor_id': 'string',
            'action': 'string',
            'entity_type': 'string',
            'entity_id': 'string',
            'timestamp': 'timestamp',
            'ip_address': 'string',
            'user_agent': 'string',
            'metadata': 'object'
        },
        'indexes': [
            'actor_id + timestamp',
            'action + timestamp',
            'entity_type + entity_id + timestamp',
            'ip_address + timestamp'
        ]
    },
    
    # Phase 2 Collections (Identity & Subscriptions)
    'businesses': {
        'description': 'Solo business and micro-enterprise profiles',
        'sample_fields': {
            'id': 'uuid',
            'owner_id': 'string',
            'name': 'string',
            'description': 'string (optional)',
            'email': 'string (optional)',
            'phone': 'string (optional)',
            'website': 'string (optional)',
            'industry': 'string (optional)',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['owner_id + created_at']
    },
    'organizations': {
        'description': 'Multi-user organization profiles',
        'sample_fields': {
            'id': 'uuid',
            'owner_id': 'string',
            'name': 'string',
            'description': 'string (optional)',
            'max_members': 'number',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['owner_id + created_at']
    },
    'departments': {
        'description': 'Organization departments or teams',
        'sample_fields': {
            'id': 'uuid',
            'organization_id': 'string',
            'name': 'string',
            'description': 'string (optional)',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': ['organization_id + name']
    },
    'memberships': {
        'description': 'Organization membership and roles',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string',
            'organization_id': 'string',
            'department_id': 'string (optional)',
            'role': 'string (owner|admin|member)',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': [
            'user_id + created_at',
            'organization_id + role + created_at',
            'organization_id + department_id + created_at'
        ]
    },
    'subscriptions': {
        'description': 'Subscription plans and billing state',
        'sample_fields': {
            'id': 'uuid',
            'user_id': 'string (optional, for personal accounts)',
            'business_id': 'string (optional, for business_solo accounts)',
            'organization_id': 'string (optional, for organization accounts)',
            'plan': 'string (personal|solo|org)',
            'status': 'string (active|trial|expired|none)',
            'billing_cycle': 'string (monthly|yearly)',
            'trial_start_date': 'timestamp (optional)',
            'trial_end_date': 'timestamp (optional)',
            'current_period_start': 'timestamp (optional)',
            'current_period_end': 'timestamp (optional)',
            'cancelled_at': 'timestamp (optional)',
            'billing': 'object (optional, amount, currency, payment dates)',
            'payment_integration': 'object (optional, provider, customer_id, subscription_id)',
            'metadata': 'object (optional)',
            'created_at': 'timestamp',
            'updated_at': 'timestamp'
        },
        'indexes': [
            'user_id',
            'business_id',
            'organization_id',
            'status + trial_end_date',
            'status + current_period_end'
        ]
    }
}


def create_collection(collection_name, collection_info):
    """Create a collection with a sample document to ensure it exists"""
    try:
        collection_ref = db.collection(collection_name)
        
        # Check if collection has any documents
        docs = list(collection_ref.limit(1).stream())
        
        if docs:
            print(f"✅ Collection '{collection_name}' already exists with {len(list(collection_ref.stream()))} documents")
            return True
        
        # Create a placeholder document to initialize the collection
        placeholder_id = f"_placeholder_{collection_name}"
        placeholder_doc = {
            '_is_placeholder': True,
            '_description': collection_info['description'],
            '_created_at': datetime.utcnow(),
            '_note': 'This is a placeholder document to initialize the collection. It can be safely deleted.'
        }
        
        collection_ref.document(placeholder_id).set(placeholder_doc)
        print(f"✅ Created collection '{collection_name}' - {collection_info['description']}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating collection '{collection_name}': {e}")
        return False


def verify_collection(collection_name):
    """Verify a collection exists and can be queried"""
    try:
        collection_ref = db.collection(collection_name)
        # Try to get first document
        docs = list(collection_ref.limit(1).stream())
        return True
    except Exception as e:
        print(f"❌ Error verifying collection '{collection_name}': {e}")
        return False


def print_collection_info(collection_name, collection_info):
    """Print detailed information about a collection"""
    print(f"\n{'='*70}")
    print(f"Collection: {collection_name}")
    print(f"Description: {collection_info['description']}")
    print(f"\nRequired Indexes:")
    for index in collection_info['indexes']:
        print(f"  • {index}")
    print(f"\nSample Fields:")
    for field, field_type in collection_info['sample_fields'].items():
        print(f"  • {field}: {field_type}")
    print(f"{'='*70}")


def main():
    """Main function to initialize all collections"""
    print("\n" + "="*70)
    print("🔥 INITIALIZING FIRESTORE COLLECTIONS")
    print("="*70 + "\n")
    
    # Statistics
    total_collections = len(COLLECTIONS)
    created_count = 0
    failed_count = 0
    
    # Create each collection
    for collection_name, collection_info in COLLECTIONS.items():
        if create_collection(collection_name, collection_info):
            created_count += 1
        else:
            failed_count += 1
    
    print(f"\n{'='*70}")
    print("📊 COLLECTION INITIALIZATION SUMMARY")
    print(f"{'='*70}")
    print(f"Total Collections: {total_collections}")
    print(f"✅ Successfully Created/Verified: {created_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"{'='*70}\n")
    
    # Verify all collections
    print("\n" + "="*70)
    print("🔍 VERIFYING ALL COLLECTIONS")
    print("="*70 + "\n")
    
    all_verified = True
    for collection_name in COLLECTIONS.keys():
        if verify_collection(collection_name):
            print(f"✅ {collection_name} - Verified")
        else:
            print(f"❌ {collection_name} - Verification Failed")
            all_verified = False
    
    print(f"\n{'='*70}")
    if all_verified:
        print("✅ ALL COLLECTIONS VERIFIED SUCCESSFULLY")
    else:
        print("⚠️  SOME COLLECTIONS FAILED VERIFICATION")
    print(f"{'='*70}\n")
    
    # Print detailed information
    print("\n" + "="*70)
    print("📋 DETAILED COLLECTION INFORMATION")
    print("="*70)
    
    for collection_name, collection_info in COLLECTIONS.items():
        print_collection_info(collection_name, collection_info)
    
    print("\n" + "="*70)
    print("✅ INITIALIZATION COMPLETE")
    print("="*70)
    print("\nNext Steps:")
    print("1. Deploy indexes: firebase deploy --only firestore:indexes")
    print("2. Deploy rules: firebase deploy --only firestore:rules")
    print("3. Run seed script: python backend/scripts/seed_collections.py")
    print("4. Verify setup: python backend/scripts/verify_firestore.py")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()


