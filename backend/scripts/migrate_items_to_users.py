"""
Migrate items from separate 'items' collection to user documents
"""
import asyncio
import sys
sys.path.insert(0, '..')
from firestore_db import FirestoreDB

async def migrate_items_to_users():
    db = FirestoreDB()
    
    print("🔄 Migrating items from 'items' collection to user documents...")
    print()
    
    # Get all items
    items = await db.find('items')
    print(f"📦 Found {len(items)} items in 'items' collection")
    
    if len(items) == 0:
        print("✅ No items to migrate")
        return
    
    # Group items by user_id
    items_by_user = {}
    for item in items:
        user_id = item.get('user_id')
        if user_id not in items_by_user:
            items_by_user[user_id] = []
        items_by_user[user_id].append(item)
    
    print(f"👥 Items belong to {len(items_by_user)} users")
    print()
    
    # Migrate each user's items
    migrated_users = 0
    migrated_items = 0
    
    for user_id, user_items in items_by_user.items():
        # Get user document
        user_doc = await db.find_one('users', {'id': user_id})
        
        if not user_doc:
            print(f"⚠️  User {user_id[:8]}... not found - skipping {len(user_items)} items")
            continue
        
        user_email = user_doc.get('email', 'Unknown')
        print(f"📝 Migrating {len(user_items)} items for {user_email}")
        
        # Get existing items in user document (if any)
        existing_items = user_doc.get('items', [])
        existing_item_ids = {item.get('id') for item in existing_items}
        
        # Add new items (avoid duplicates)
        new_items = []
        for item in user_items:
            if item.get('id') not in existing_item_ids:
                new_items.append(item)
        
        if new_items:
            all_items = existing_items + new_items
            
            # Update user document
            await db.update_one(
                'users',
                {'id': user_id},
                {'$set': {'items': all_items}}
            )
            
            print(f"   ✅ Added {len(new_items)} items to user document")
            migrated_items += len(new_items)
        else:
            print(f"   ℹ️  All items already in user document")
        
        migrated_users += 1
    
    print()
    print(f"✅ Migration complete!")
    print(f"   Users updated: {migrated_users}")
    print(f"   Items migrated: {migrated_items}")
    print()
    
    # Verify migration
    print("🔍 Verifying migration...")
    for user_id in items_by_user.keys():
        user_doc = await db.find_one('users', {'id': user_id})
        if user_doc:
            user_items = user_doc.get('items', [])
            user_email = user_doc.get('email', 'Unknown')
            print(f"   {user_email}: {len(user_items)} items in profile")
    
    print()
    print("✅ Verification complete!")
    print()
    print("⚠️  Note: Old 'items' collection still exists")
    print("   You can delete it manually if migration is successful")

if __name__ == "__main__":
    asyncio.run(migrate_items_to_users())








