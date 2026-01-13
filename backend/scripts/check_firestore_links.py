#!/usr/bin/env python3
"""
Check Firestore for all links and their details
Shows all links created by all users with timestamps
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
from firestore_db import FirestoreDB
from datetime import datetime, timezone
import json

async def check_firestore_links():
    """Query Firestore for all links and display details"""
    
    print("=" * 80)
    print("🔍 FIRESTORE LINKS CHECK")
    print("=" * 80)
    print()
    
    try:
        # Initialize collections
        links_collection = FirestoreDB('links')
        users_collection = FirestoreDB('users')
        
        # Get all links (no filter)
        print("📡 Querying Firestore for all links...")
        all_links = await links_collection.find({})
        
        if not all_links:
            print("❌ NO LINKS FOUND IN FIRESTORE")
            print()
            print("Possible reasons:")
            print("  1. No users have created links yet")
            print("  2. Database is empty")
            print("  3. Collection name mismatch")
            print()
            return
        
        print(f"✅ Found {len(all_links)} link(s) in Firestore")
        print("=" * 80)
        print()
        
        # Group links by user
        links_by_user = {}
        for link in all_links:
            user_id = link.get('user_id', 'unknown')
            if user_id not in links_by_user:
                links_by_user[user_id] = []
            links_by_user[user_id].append(link)
        
        # Display each user's links
        for user_id, user_links in links_by_user.items():
            print("─" * 80)
            print(f"👤 USER: {user_id}")
            print("─" * 80)
            
            # Try to get user details
            try:
                user = await users_collection.find_one({"id": user_id})
                if user:
                    print(f"   Name: {user.get('name', 'N/A')}")
                    print(f"   Username: {user.get('username', 'N/A')}")
                    print(f"   Email: {user.get('email', 'N/A')}")
                else:
                    print(f"   ⚠️  User details not found (orphaned links?)")
            except Exception as e:
                print(f"   ⚠️  Could not fetch user: {e}")
            
            print()
            print(f"   📊 Total Links: {len(user_links)}")
            print()
            
            # Display each link
            for idx, link in enumerate(user_links, 1):
                print(f"   ┌─ LINK #{idx}")
                print(f"   │")
                print(f"   │  🆔 ID: {link.get('id', 'N/A')}")
                print(f"   │  📌 Title: {link.get('title', 'N/A')}")
                print(f"   │  🔗 URL: {link.get('url', 'N/A')}")
                print(f"   │  🎨 Icon: {link.get('icon', 'N/A')}")
                print(f"   │  📂 Category: {link.get('category', 'N/A')}")
                print(f"   │  🎯 Style: {link.get('style', 'N/A')}")
                print(f"   │  🟢 Active: {link.get('active', False)}")
                print(f"   │  📊 Clicks: {link.get('clicks', 0)}")
                print(f"   │  🔢 Order: {link.get('order', 0)}")
                
                # Timestamps
                created_at = link.get('created_at')
                updated_at = link.get('updated_at')
                
                if created_at:
                    # Handle both datetime objects and timestamp objects
                    if hasattr(created_at, 'timestamp'):
                        # Firestore Timestamp object
                        created_str = datetime.fromtimestamp(created_at.timestamp(), tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
                    elif isinstance(created_at, datetime):
                        created_str = created_at.strftime('%Y-%m-%d %H:%M:%S UTC')
                    else:
                        created_str = str(created_at)
                    print(f"   │  📅 Created: {created_str}")
                else:
                    print(f"   │  📅 Created: N/A")
                
                if updated_at:
                    if hasattr(updated_at, 'timestamp'):
                        updated_str = datetime.fromtimestamp(updated_at.timestamp(), tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
                    elif isinstance(updated_at, datetime):
                        updated_str = updated_at.strftime('%Y-%m-%d %H:%M:%S UTC')
                    else:
                        updated_str = str(updated_at)
                    print(f"   │  🔄 Updated: {updated_str}")
                else:
                    print(f"   │  🔄 Updated: N/A")
                
                # Additional fields
                if link.get('description'):
                    print(f"   │  📝 Description: {link.get('description')}")
                if link.get('phone_number'):
                    print(f"   │  📞 Phone: {link.get('phone_number')}")
                if link.get('scheduled'):
                    print(f"   │  ⏰ Scheduled: Yes")
                    if link.get('publish_date'):
                        print(f"   │     Publish: {link.get('publish_date')}")
                    if link.get('unpublish_date'):
                        print(f"   │     Unpublish: {link.get('unpublish_date')}")
                
                print(f"   └─")
                print()
            
            print()
        
        # Summary
        print("=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        print(f"Total Users with Links: {len(links_by_user)}")
        print(f"Total Links: {len(all_links)}")
        
        # Stats
        active_links = sum(1 for link in all_links if link.get('active', False))
        inactive_links = len(all_links) - active_links
        total_clicks = sum(link.get('clicks', 0) for link in all_links)
        
        print(f"Active Links: {active_links}")
        print(f"Inactive Links: {inactive_links}")
        print(f"Total Clicks: {total_clicks}")
        
        # Category breakdown
        categories = {}
        for link in all_links:
            cat = link.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        print()
        print("Links by Category:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  {cat}: {count}")
        
        print()
        print("=" * 80)
        print("✅ CHECK COMPLETE")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print()
    asyncio.run(check_firestore_links())
    print()








