#!/usr/bin/env python3
"""
Diagnose why links aren't showing in frontend
Checks for user ID mismatches and other issues
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from firestore_db import FirestoreDB
import json

async def diagnose():
    print("=" * 80)
    print("🔍 LINK RETRIEVAL DIAGNOSTIC")
    print("=" * 80)
    print()
    
    users_collection = FirestoreDB('users')
    links_collection = FirestoreDB('links')
    
    # Get all users
    print("📋 Step 1: Getting all users...")
    all_users = await users_collection.find({})
    print(f"   Found {len(all_users)} user(s)")
    print()
    
    # Get all links  
    print("📋 Step 2: Getting all links...")
    all_links = await links_collection.find({})
    print(f"   Found {len(all_links)} link(s)")
    print()
    
    # Check each user
    for user in all_users:
        print("─" * 80)
        print(f"👤 USER: {user.get('name')} ({user.get('username')})")
        print(f"   Email: {user.get('email')}")
        print(f"   User ID: {user.get('id')}")
        print()
        
        # Find links for this user
        user_links = [link for link in all_links if link.get('user_id') == user.get('id')]
        print(f"   📊 Links for this user: {len(user_links)}")
        
        if len(user_links) > 0:
            print("   ✅ Links found:")
            for link in user_links:
                print(f"      - {link.get('title')} ({link.get('id')})")
        else:
            print("   ⚠️  NO LINKS FOUND FOR THIS USER")
            
            # Check if there are links with different user_id
            if len(all_links) > 0:
                print()
                print("   🔍 Checking if links exist with different user_id...")
                unique_user_ids = set(link.get('user_id') for link in all_links)
                print(f"   Found {len(unique_user_ids)} unique user_id(s) in links collection:")
                for uid in unique_user_ids:
                    count = sum(1 for link in all_links if link.get('user_id') == uid)
                    match = "✅ MATCH" if uid == user.get('id') else "❌ MISMATCH"
                    print(f"      {uid}: {count} link(s) {match}")
        
        print()
    
    print("=" * 80)
    print("🔎 DIAGNOSIS COMPLETE")
    print("=" * 80)
    print()
    
    # Summary
    if len(all_users) == 0:
        print("❌ NO USERS FOUND")
        print("   Issue: No users registered")
        return
    
    if len(all_links) == 0:
        print("❌ NO LINKS FOUND")
        print("   Issue: No links have been created")
        return
    
    # Check for orphaned links
    user_ids = set(user.get('id') for user in all_users)
    link_user_ids = set(link.get('user_id') for link in all_links)
    orphaned = link_user_ids - user_ids
    
    if orphaned:
        print("⚠️  ORPHANED LINKS DETECTED")
        print(f"   {len(orphaned)} user_id(s) in links have no matching user:")
        for uid in orphaned:
            count = sum(1 for link in all_links if link.get('user_id') == uid)
            print(f"   - {uid}: {count} link(s)")
        print()
    
    # Check for users with no links
    users_without_links = [u for u in all_users if u.get('id') not in link_user_ids]
    if users_without_links:
        print("ℹ️  USERS WITHOUT LINKS")
        for user in users_without_links:
            print(f"   - {user.get('username')} ({user.get('email')})")
        print()
    
    # Root cause analysis
    print("💡 LIKELY ROOT CAUSE:")
    print()
    
    if len(all_users) == 1 and len(link_user_ids) == 1 and list(link_user_ids)[0] != all_users[0].get('id'):
        print("❗ USER ID MISMATCH")
        print(f"   User in database: {all_users[0].get('id')}")
        print(f"   User ID in links: {list(link_user_ids)[0]}")
        print()
        print("   SOLUTION:")
        print("   The user likely logged in with a different account than the one")
        print("   that created the links. Either:")
        print("   1. Log in with the account that created the links, OR")
        print("   2. Run the fix script to update link ownership")
        print()
        
        # Offer to fix
        print("   To fix automatically, run:")
        print(f"   python3 scripts/fix_link_ownership.py {all_users[0].get('id')}")
    elif len(all_users) == 1 and len(all_links) > 0 and list(link_user_ids)[0] == all_users[0].get('id'):
        print("✅ NO ISSUES DETECTED")
        print("   User ID matches, links should be visible.")
        print()
        print("   If links still not showing, check:")
        print("   1. Browser console for errors")
        print("   2. Network tab for API calls")
        print("   3. JWT token validity")
        print("   4. Backend logs")
    else:
        print("❓ UNCLEAR")
        print("   Manual investigation needed.")
        print("   Check the detailed output above.")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(diagnose())








