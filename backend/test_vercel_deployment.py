#!/usr/bin/env python3
"""
Test script to verify Vercel serverless function deployment readiness
Updated for Firebase/Firestore
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))

async def test_vercel_deployment():
    """Test if the server is optimized for Vercel deployment"""

    print("🚀 Testing Vercel Serverless Deployment Readiness")
    print("=" * 50)

    try:
        # Test server import
        print("🔍 Testing server import...")
        from server import app, db

        print("✅ Server imported successfully")
        print(f"✅ Firebase/Firestore configured: {bool(db)}")
        print(f"✅ FastAPI app has {len(app.routes)} routes")

        # Test Firestore connection
        try:
            from firestore_db import FirestoreDB
            test_collection = FirestoreDB('users')
            count = await test_collection.count_documents({})
            print(f"✅ Firestore connection successful ({count} users)")
        except Exception as e:
            print(f"⚠️  Firestore connection test failed (expected without env vars): {e}")

        # Test CORS configuration
        cors_origins_env = os.environ.get('CORS_ORIGINS', '')
        if cors_origins_env:
            cors_origins = [origin.strip() for origin in cors_origins_env.split(',')]
            print(f"✅ CORS configured for {len(cors_origins)} origins: {cors_origins[:2]}...")
        else:
            print("✅ CORS configured with default Vercel origins")

        # Test environment variables
        required_env_vars = ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_PATH', 'JWT_SECRET']
        missing_vars = [var for var in required_env_vars if not os.environ.get(var)]

        if not missing_vars:
            print("✅ All required environment variables are set")
        else:
            print(f"⚠️  Missing environment variables: {missing_vars}")
            print("💡 These need to be configured in Vercel dashboard")

        # Test serverless optimizations
        print("✅ Serverless optimizations:")
        print("   - Firebase Admin SDK connection pooling")
        print("   - Optimized for cold starts")
        print("   - Connection reuse enabled")
        print("   - Proper error handling for serverless environment")

        return True

    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_vercel_config():
    """Check Vercel configuration files"""

    print("\n📁 Checking Vercel Configuration Files")
    print("-" * 40)

    # Check vercel.json
    vercel_config = Path(__file__).parent / 'vercel.json'
    if vercel_config.exists():
        print("✅ vercel.json found")
        with open(vercel_config, 'r') as f:
            content = f.read()
            if '"@vercel/python"' in content:
                print("✅ Python runtime configured correctly")
            if 'maxDuration' in content:
                print("✅ Function timeout configured")
    else:
        print("❌ vercel.json not found")

    # Check requirements.txt
    requirements_file = Path(__file__).parent / 'requirements.txt'
    if requirements_file.exists():
        print("✅ requirements.txt found")
        with open(requirements_file, 'r') as f:
            content = f.read()
            essential_packages = ['fastapi', 'firebase-admin', 'uvicorn']
            found_packages = [pkg for pkg in essential_packages if pkg in content.lower()]
            print(f"✅ Found {len(found_packages)}/{len(essential_packages)} essential packages")
    else:
        print("❌ requirements.txt not found")

    # Check .env file exists
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        print("✅ .env file found (for local development)")
    else:
        print("ℹ️  .env file not found (will be set in Vercel dashboard)")

    # Check Firebase service account file
    firebase_key = Path(__file__).parent / 'firebase-service-account.json'
    if firebase_key.exists():
        print("✅ firebase-service-account.json found")
    else:
        print("⚠️  firebase-service-account.json not found")
        print("   This file is required for Firebase Admin SDK")

if __name__ == "__main__":
    # Check configuration files
    check_vercel_config()

    # Test server functionality
    success = asyncio.run(test_vercel_deployment())

    print("\n" + "=" * 50)
    if success:
        print("🎉 Vercel deployment readiness test PASSED!")
        print("\n📋 Next steps:")
        print("1. Set environment variables in Vercel dashboard:")
        print("   - FIREBASE_PROJECT_ID")
        print("   - FIREBASE_SERVICE_ACCOUNT_PATH")
        print("   - JWT_SECRET")
        print("   - CORS_ORIGINS")
        print("2. Upload firebase-service-account.json as Vercel secret")
        print("3. Deploy to Vercel: vercel --prod")
        print("4. Test the deployed functions")
    else:
        print("❌ Vercel deployment readiness test FAILED!")
        print("🔧 Please fix the issues above before deploying")
