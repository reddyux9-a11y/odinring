"""
Fix item user_ids that were created with incorrect user_id
"""
import asyncio
import sys
sys.path.insert(0, '..')
from firestore_db import FirestoreDB

async def fix_item_user_ids():
    db = FirestoreDB()
    
    # The incorrect user_id used when items were created
    OLD_USER_ID = "ea256363-2d58-48b5-bafc-f784aefd5ab8"
    
    # The correct user_id from the users collection
    NEW_USER_ID = "ea256363-2d58-4bd5-bafc-f784aefd5ab8"
    
    print("🔧 Fixing item user_ids...")
    print(f"   Old (incorrect): {OLD_USER_ID}")
    print(f"   New (correct):   {NEW_USER_ID}")
    print()
    
    # Find all items with the old user_id
    items = await db.find('items', {'user_id': OLD_USER_ID})
    
    if not items:
        print("❌ No items found with old user_id")
        print("   Items might already be fixed or were created with correct user_id")
        return
    
    print(f"📦 Found {len(items)} items to fix:")
    for item in items:
        print(f"   - {item.get('name')} (id: {item.get('id')})")
    
    print()
    print("🔄 Updating user_ids...")
    
    updated_count = 0
    for item in items:
        item_id = item.get('id')
        try:
            await db.update_one(
                'items',
                {'id': item_id},
                {'$set': {'user_id': NEW_USER_ID}}
            )
            print(f"   ✅ Updated: {item.get('name')}")
            updated_count += 1
        except Exception as e:
            print(f"   ❌ Failed to update {item.get('name')}: {e}")
    
    print()
    print(f"✅ Fixed {updated_count} out of {len(items)} items!")
    print()
    
    # Verify the fix
    print("🔍 Verifying fix...")
    corrected_items = await db.find('items', {'user_id': NEW_USER_ID})
    print(f"   Items with correct user_id: {len(corrected_items)}")
    
    remaining_old = await db.find('items', {'user_id': OLD_USER_ID})
    print(f"   Items with old user_id: {len(remaining_old)}")
    
    if len(remaining_old) == 0:
        print()
        print("🎉 All items fixed successfully!")
        print("   Now refresh your dashboard - items should appear!")
    else:
        print()
        print("⚠️  Some items still have old user_id")

if __name__ == "__main__":
    asyncio.run(fix_item_user_ids())








