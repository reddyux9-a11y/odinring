#!/usr/bin/env python3
"""Test public profile endpoint to diagnose why links aren't showing"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from firestore_db import FirestoreDB
from firebase_config import initialize_firebase

async def test_public_profile():
    initialize_firebase()
    users_db = FirestoreDB('users')
    links_db = FirestoreDB('links')
    
    username = "reddyux9"
    
    print(f"\n{'='*60}")
    print(f"Testing Public Profile Endpoint Logic")
    print(f"{'='*60}\n")
    
    # Step 1: Find user
    print(f"1. Looking up user by username: '{username}'")
    user_doc = await users_db.find_one({"username": username.lower()})
    
    if not user_doc:
        print(f"   ❌ User not found!")
        return
    
    print(f"   ✅ Found user: {user_doc.get('name')} ({user_doc.get('email')})")
    user_id = user_doc.get('id')
    print(f"   User ID: {user_id}")
    print()
    
    # Step 2: Query links with same logic as endpoint
    print(f"2. Querying links with endpoint logic:")
    print(f"   Query: {{'user_id': '{user_id}', 'active': True}}")
    
    links_docs = await links_db.find({
        "user_id": user_id,
        "active": True
    }, sort=[("order", 1)])
    
    print(f"   📊 Raw query returned: {len(links_docs)} documents")
    print()
    
    # Step 3: Process links
    print(f"3. Processing links:")
    links = []
    total_clicks = 0
    
    for idx, link_doc in enumerate(links_docs, 1):
        try:
            links.append(link_doc)
            clicks = link_doc.get('clicks', 0)
            total_clicks += clicks
            print(f"   {idx}. {link_doc.get('title')}")
            print(f"      URL: {link_doc.get('url')}")
            print(f"      Active: {link_doc.get('active')}")
            print(f"      Order: {link_doc.get('order')}")
            print(f"      Clicks: {clicks}")
        except Exception as e:
            print(f"   ❌ Error processing link {idx}: {e}")
        print()
    
    print(f"\n{'='*60}")
    print(f"📊 RESULTS:")
    print(f"{'='*60}")
    print(f"✅ Total links found: {len(links)}")
    print(f"✅ Total clicks: {total_clicks}")
    print()
    
    if len(links) == 0:
        print("⚠️  NO LINKS RETURNED!")
        print("   This matches the API behavior - returning empty links array")
        print()
        
        # Let's try without the active filter
        print("4. Testing without 'active' filter:")
        all_links = await links_db.find({"user_id": user_id})
        print(f"   Found {len(all_links)} total links (active + inactive)")
        
        if len(all_links) > 0:
            print("   ✅ Links exist but query with 'active: True' returns 0")
            print("   This suggests a Firestore query issue!")
            
            # Check first link's active field
            first_link = all_links[0]
            print(f"\n   Checking first link's 'active' field:")
            print(f"     Title: {first_link.get('title')}")
            print(f"     Active value: {first_link.get('active')}")
            print(f"     Active type: {type(first_link.get('active'))}")
            print(f"     Active == True: {first_link.get('active') == True}")
            print(f"     Active is True: {first_link.get('active') is True}")

if __name__ == "__main__":
    asyncio.run(test_public_profile())

