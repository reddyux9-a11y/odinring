#!/bin/bash

# Quick Setup Script for Firestore Database
# This guides you through creating and seeding the database

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          🔥 FIRESTORE DATABASE QUICK SETUP 🔥               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Database Creation Required"
echo ""
echo "Firestore databases must be created via the Firebase Console."
echo "This cannot be done programmatically."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 STEP 1: Create Firestore Database"
echo ""
echo "1. Open this link in your browser:"
echo "   👉 https://console.cloud.google.com/datastore/setup?project=studio-7743041576-fc16f"
echo ""
echo "2. Click 'Create database'"
echo ""
echo "3. Select:"
echo "   • Mode: Firestore Native Mode"
echo "   • Start in: Production mode"
echo "   • Location: nam5 (or us-central1)"
echo ""
echo "4. Click 'Enable'"
echo ""
echo "5. Wait 30-60 seconds for creation to complete"
echo ""

# Ask user to confirm
read -p "Press ENTER after you've created the database in the console..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 Testing database connection..."
echo ""

# Test connection
python3 test_firestore_api.py

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Database is ready! Now seeding..."
    echo ""
    
    # Seed the database
    cd backend
    python3 seed_firestore.py
    cd ..
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "✅ DATABASE SETUP COMPLETE!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📋 NEXT STEPS:"
        echo ""
        echo "1. Add 'localhost' to authorized domains:"
        echo "   👉 https://console.firebase.google.com/project/studio-7743041576-fc16f/authentication/settings"
        echo ""
        echo "2. Restart backend server:"
        echo "   npm run restart:backend"
        echo ""
        echo "3. Open your app:"
        echo "   http://localhost:3000"
        echo ""
        echo "4. Test Google Sign-In!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    else
        echo ""
        echo "❌ Seeding failed. Please check the errors above."
        echo ""
    fi
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "❌ Database connection failed."
    echo ""
    echo "Please make sure:"
    echo "  • Database was created successfully"
    echo "  • Wait 60 seconds after creation"
    echo "  • Selected 'Firestore Native Mode'"
    echo ""
    echo "Then run this script again:"
    echo "  ./quick_setup.sh"
    echo ""
fi

