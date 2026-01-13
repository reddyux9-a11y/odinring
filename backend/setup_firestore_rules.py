"""
Setup Firestore Security Rules
Creates development-friendly security rules
"""

import sys

def generate_security_rules():
    """Generate Firestore security rules for development"""
    
    print("\n🔐 Firestore Security Rules Setup")
    print("=" * 50)
    
    print("\n📝 Development Rules (allows all access):")
    print("-" * 50)
    
    dev_rules = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if true;  // Anyone can read user profiles
      allow write: if request.auth != null;  // Only authenticated users can write
    }
    
    // Rings collection
    match /rings/{ringId} {
      allow read: if true;  // Anyone can read rings (for public profiles)
      allow write: if request.auth != null;  // Only authenticated users
    }
    
    // Admins collection
    match /admins/{adminId} {
      allow read: if request.auth != null;  // Only authenticated
      allow write: if false;  // No direct writes (use backend)
    }
    
    // Analytics collection
    match /ring_analytics/{analyticsId} {
      allow read: if request.auth != null;  // Only authenticated
      allow write: if request.auth != null;
    }
    
    // Status checks collection
    match /status_checks/{checkId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}"""

    print(dev_rules)
    print("-" * 50)
    
    print("\n⚠️  IMPORTANT: Apply these rules in Firebase Console")
    print("\n📋 Steps to apply:")
    print("   1. Go to: https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore/rules")
    print("   2. Copy the rules shown above")
    print("   3. Paste into the rules editor")
    print("   4. Click 'Publish'")
    
    print("\n🔒 Production Rules (more secure):")
    print("-" * 50)
    
    prod_rules = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read: if true;  // Public profiles
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == userId;
    }
    
    // Rings collection - owners can manage their rings
    match /rings/{ringId} {
      allow read: if true;  // Public access for NFC scanning
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.user_id;
    }
    
    // Admins collection - no direct access (backend only)
    match /admins/{adminId} {
      allow read, write: if false;
    }
    
    // Analytics - only authenticated users
    match /ring_analytics/{analyticsId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;  // Immutable analytics
    }
    
    // Status checks
    match /status_checks/{checkId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}"""

    print(prod_rules)
    print("-" * 50)
    
    print("\n✅ Use Development Rules for now")
    print("✅ Switch to Production Rules before deploying\n")
    
    # Save rules to files
    with open('firestore-rules-dev.txt', 'w') as f:
        f.write(dev_rules)
    print("💾 Saved to: firestore-rules-dev.txt")
    
    with open('firestore-rules-prod.txt', 'w') as f:
        f.write(prod_rules)
    print("💾 Saved to: firestore-rules-prod.txt")
    
    print("\n🔗 Quick Link:")
    print("   https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore/rules")

if __name__ == "__main__":
    generate_security_rules()
    sys.exit(0)

