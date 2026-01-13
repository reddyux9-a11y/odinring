#!/usr/bin/env python3
"""
Test script to verify MongoDB Atlas connection works properly
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def test_mongodb_connection():
    """Test MongoDB Atlas connection with the same configuration as the server"""

    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'odinring')

    if not mongo_url:
        print("❌ MONGO_URL environment variable not set")
        return False

    print(f"🔄 Testing MongoDB connection to: {mongo_url}")
    print(f"📊 Database name: {db_name}")

    try:
        # Create client with the same configuration as server.py
        client = AsyncIOMotorClient(
            mongo_url,
            serverSelectionTimeoutMS=60000,
            connectTimeoutMS=60000,
            socketTimeoutMS=60000,
            maxPoolSize=10,
            retryWrites=True,
            tls=True,
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False,
            tlsCAFile=None,
            compressors="zlib",
            maxIdleTimeMS=30000,
        )

        db = client[db_name]

        # Test connection with ping
        print("🏓 Pinging MongoDB server...")
        ping_result = await client.admin.command('ping')
        print(f"✅ Ping successful: {ping_result}")

        # Test database operations
        print("📝 Testing database operations...")

        # Test inserting a test document
        test_collection = db.test_connection
        test_doc = {
            "test": "connection_test",
            "timestamp": "2025-10-11T07:35:51.025473238Z"
        }

        result = await test_collection.insert_one(test_doc)
        print(f"✅ Insert successful: {result.inserted_id}")

        # Test querying the document
        retrieved_doc = await test_collection.find_one({"test": "connection_test"})
        print(f"✅ Query successful: {retrieved_doc}")

        # Clean up test document
        await test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Cleanup successful")

        # Close connection
        client.close()
        print("✅ Connection closed successfully")

        return True

    except Exception as e:
        print(f"❌ Connection test failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error details: {str(e)}")

        # Check if it's an SSL/TLS error
        if "SSL" in str(e) or "TLS" in str(e):
            print("🔍 This appears to be an SSL/TLS configuration issue")
            print("💡 Make sure your MongoDB Atlas connection string includes proper TLS parameters")
            print("💡 Connection string should include: tls=true&tlsAllowInvalidCertificates=false")

        return False

if __name__ == "__main__":
    success = asyncio.run(test_mongodb_connection())
    if success:
        print("\n🎉 MongoDB connection test PASSED!")
        print("✅ Your configuration should work in production")
    else:
        print("\n❌ MongoDB connection test FAILED!")
        print("🔧 Please check your configuration and try again")
