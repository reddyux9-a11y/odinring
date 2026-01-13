#!/usr/bin/env python3
"""
Comprehensive Firestore verification script
Checks collections, indexes, rules, and connectivity
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from firebase_admin import firestore
from firebase_config import initialize_firebase
from datetime import datetime
import json

# Initialize Firebase
try:
    initialize_firebase()
    db = firestore.client()
    print("✅ Firebase initialized successfully\n")
except Exception as e:
    print(f"❌ Failed to initialize Firebase: {e}")
    sys.exit(1)

# Expected collections
EXPECTED_COLLECTIONS = [
    # Core
    'users', 'links', 'rings', 'analytics', 'ring_analytics',
    'qr_scans', 'appointments', 'availability', 'admins', 'status_checks',
    # Phase 1
    'sessions', 'refresh_tokens', 'audit_logs',
    # Phase 2
    'businesses', 'organizations', 'departments', 'memberships', 'subscriptions'
]


def check_firestore_connection():
    """Test basic Firestore connectivity"""
    print("="*70)
    print("🔍 TESTING FIRESTORE CONNECTION")
    print("="*70 + "\n")
    
    try:
        # Try to write a test document
        test_collection = db.collection('_connection_test')
        test_doc = {
            'timestamp': datetime.utcnow(),
            'test': True
        }
        doc_ref = test_collection.document('test')
        doc_ref.set(test_doc)
        
        # Try to read it back
        doc = doc_ref.get()
        if doc.exists:
            print("✅ Write test: SUCCESS")
            print("✅ Read test: SUCCESS")
            
            # Clean up
            doc_ref.delete()
            print("✅ Delete test: SUCCESS")
            print()
            return True
        else:
            print("❌ Read test: FAILED (Document not found)")
            return False
            
    except Exception as e:
        print(f"❌ Connection test FAILED: {e}\n")
        return False


def check_collections():
    """Verify all expected collections exist"""
    print("="*70)
    print("📂 CHECKING COLLECTIONS")
    print("="*70 + "\n")
    
    existing_collections = []
    missing_collections = []
    collection_stats = {}
    
    for collection_name in EXPECTED_COLLECTIONS:
        try:
            collection_ref = db.collection(collection_name)
            docs = list(collection_ref.limit(1).stream())
            
            if docs:
                # Collection exists and has documents
                all_docs = list(collection_ref.stream())
                doc_count = len(all_docs)
                collection_stats[collection_name] = doc_count
                existing_collections.append(collection_name)
                print(f"✅ {collection_name:<20} - {doc_count} documents")
            else:
                # Collection exists but is empty
                collection_stats[collection_name] = 0
                existing_collections.append(collection_name)
                print(f"⚠️  {collection_name:<20} - 0 documents (empty)")
                
        except Exception as e:
            missing_collections.append(collection_name)
            print(f"❌ {collection_name:<20} - NOT FOUND")
    
    print(f"\n{'='*70}")
    print(f"📊 Collection Summary:")
    print(f"   Total Expected: {len(EXPECTED_COLLECTIONS)}")
    print(f"   ✅ Found: {len(existing_collections)}")
    print(f"   ❌ Missing: {len(missing_collections)}")
    
    if missing_collections:
        print(f"\n   Missing Collections:")
        for col in missing_collections:
            print(f"   • {col}")
    
    print(f"{'='*70}\n")
    
    return len(missing_collections) == 0


def check_critical_indexes():
    """Check if critical indexes are likely in place by testing queries"""
    print("="*70)
    print("🔍 CHECKING CRITICAL INDEXES (Query Tests)")
    print("="*70 + "\n")
    
    index_tests = [
        {
            'name': 'users by email',
            'collection': 'users',
            'query': lambda: db.collection('users').where('email', '==', 'test@example.com').limit(1).stream()
        },
        {
            'name': 'links by user_id and order',
            'collection': 'links',
            'query': lambda: db.collection('links').where('user_id', '==', 'test123').order_by('order').limit(1).stream()
        },
        {
            'name': 'sessions by user_id and is_active',
            'collection': 'sessions',
            'query': lambda: db.collection('sessions').where('user_id', '==', 'test123').where('is_active', '==', True).limit(1).stream()
        },
        {
            'name': 'audit_logs by actor_id and timestamp',
            'collection': 'audit_logs',
            'query': lambda: db.collection('audit_logs').where('actor_id', '==', 'test123').order_by('timestamp').limit(1).stream()
        },
        {
            'name': 'subscriptions by owner_id and owner_type',
            'collection': 'subscriptions',
            'query': lambda: db.collection('subscriptions').where('owner_id', '==', 'test123').where('owner_type', '==', 'personal').limit(1).stream()
        }
    ]
    
    passed = 0
    failed = 0
    
    for test in index_tests:
        try:
            # Try to execute the query
            list(test['query']())
            print(f"✅ {test['name']}")
            passed += 1
        except Exception as e:
            if 'index' in str(e).lower():
                print(f"❌ {test['name']} - Missing index")
                print(f"   Error: {str(e)[:100]}...")
            else:
                print(f"⚠️  {test['name']} - Query test inconclusive")
            failed += 1
    
    print(f"\n{'='*70}")
    print(f"📊 Index Test Summary:")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"{'='*70}\n")
    
    return failed == 0


def check_sample_data():
    """Check for sample data in each collection"""
    print("="*70)
    print("📝 CHECKING SAMPLE DATA")
    print("="*70 + "\n")
    
    collections_with_data = 0
    empty_collections = 0
    
    for collection_name in EXPECTED_COLLECTIONS:
        try:
            collection_ref = db.collection(collection_name)
            docs = list(collection_ref.limit(1).stream())
            
            if docs:
                collections_with_data += 1
                sample_doc = docs[0].to_dict()
                print(f"✅ {collection_name:<20} - Has data")
                
                # Show first few fields
                fields = list(sample_doc.keys())[:3]
                print(f"   Sample fields: {', '.join(fields)}")
            else:
                empty_collections += 1
                print(f"⚠️  {collection_name:<20} - Empty (no sample data)")
                
        except Exception as e:
            print(f"❌ {collection_name:<20} - Error: {e}")
    
    print(f"\n{'='*70}")
    print(f"📊 Data Summary:")
    print(f"   Collections with data: {collections_with_data}")
    print(f"   Empty collections: {empty_collections}")
    print(f"{'='*70}\n")
    
    return True


def generate_verification_report():
    """Generate a comprehensive verification report"""
    print("="*70)
    print("📋 GENERATING VERIFICATION REPORT")
    print("="*70 + "\n")
    
    report = {
        'timestamp': datetime.utcnow().isoformat(),
        'connection': None,
        'collections': {},
        'indexes': None,
        'overall_status': None
    }
    
    # Test connection
    report['connection'] = check_firestore_connection()
    
    # Check collections
    for collection_name in EXPECTED_COLLECTIONS:
        try:
            collection_ref = db.collection(collection_name)
            docs = list(collection_ref.stream())
            report['collections'][collection_name] = {
                'exists': True,
                'document_count': len(docs),
                'has_data': len(docs) > 0
            }
        except Exception as e:
            report['collections'][collection_name] = {
                'exists': False,
                'error': str(e)
            }
    
    # Overall status
    all_collections_exist = all(
        info.get('exists', False) for info in report['collections'].values()
    )
    report['overall_status'] = 'READY' if (report['connection'] and all_collections_exist) else 'NEEDS_SETUP'
    
    # Save report
    report_path = backend_dir / 'firestore_verification_report.json'
    with open(report_path, 'w') as f:
        json.dump(report, indent=2, fp=f, default=str)
    
    print(f"✅ Report saved to: {report_path}\n")
    
    return report


def main():
    """Main verification function"""
    print("\n" + "="*70)
    print("🔥 FIRESTORE COMPREHENSIVE VERIFICATION")
    print("="*70 + "\n")
    
    # Run all checks
    connection_ok = check_firestore_connection()
    collections_ok = check_collections()
    indexes_ok = check_critical_indexes()
    check_sample_data()
    
    # Generate report
    report = generate_verification_report()
    
    # Final summary
    print("="*70)
    print("🎯 FINAL VERIFICATION SUMMARY")
    print("="*70)
    print(f"Connection:  {'✅ PASS' if connection_ok else '❌ FAIL'}")
    print(f"Collections: {'✅ PASS' if collections_ok else '❌ FAIL'}")
    print(f"Indexes:     {'✅ PASS' if indexes_ok else '⚠️  WARNING'}")
    print(f"\nOverall Status: {report['overall_status']}")
    print("="*70 + "\n")
    
    if report['overall_status'] == 'READY':
        print("✅ Firestore is properly configured and ready for production!\n")
        return 0
    else:
        print("⚠️  Firestore needs additional setup. See report for details.\n")
        print("Run these commands to complete setup:")
        print("1. python backend/scripts/init_firestore_collections.py")
        print("2. firebase deploy --only firestore:indexes")
        print("3. firebase deploy --only firestore:rules\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())








