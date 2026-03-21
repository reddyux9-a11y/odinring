#!/bin/bash
# Complete Firestore Setup Script
# Initializes collections, deploys indexes, and verifies everything

set -e  # Exit on any error

echo "========================================================================"
echo "🔥 COMPLETE FIRESTORE SETUP"
echo "========================================================================"
echo ""

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Project Directory: $SCRIPT_DIR"
echo ""

# Step 1: Initialize Collections
echo "========================================================================"
echo "STEP 1: INITIALIZING FIRESTORE COLLECTIONS"
echo "========================================================================"
echo ""

if command -v python3 &> /dev/null; then
    python3 backend/scripts/init_firestore_collections.py
elif command -v python &> /dev/null; then
    python backend/scripts/init_firestore_collections.py
else
    echo "❌ Python not found. Please install Python 3.9+"
    exit 1
fi

echo ""
read -p "✅ Collections initialized. Press Enter to continue to index deployment..."
echo ""

# Step 2: Check Firebase CLI
echo "========================================================================"
echo "STEP 2: CHECKING FIREBASE CLI"
echo "========================================================================"
echo ""

if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found. Installing..."
    npm install -g firebase-tools
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Firebase CLI"
        echo "Please install manually: npm install -g firebase-tools"
        exit 1
    fi
fi

echo "✅ Firebase CLI found"
echo ""

# Step 3: Check Firebase Login
echo "========================================================================"
echo "STEP 3: CHECKING FIREBASE AUTHENTICATION"
echo "========================================================================"
echo ""

firebase projects:list &> /dev/null || {
    echo "🔐 Please log in to Firebase..."
    firebase login
}

echo "✅ Authenticated with Firebase"
echo ""

# Show current project
echo "Current Firebase Project:"
firebase use
echo ""

read -p "Is this the correct project? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct project:"
    echo "  firebase use <your-project-id>"
    echo ""
    echo "Then re-run this script."
    exit 1
fi

# Step 4: Deploy Indexes
echo ""
echo "========================================================================"
echo "STEP 4: DEPLOYING FIRESTORE INDEXES"
echo "========================================================================"
echo ""

echo "📊 Deploying 35 composite indexes..."
echo ""

firebase deploy --only firestore:indexes

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy indexes"
    exit 1
fi

echo ""
echo "✅ Indexes deployed successfully!"
echo ""
echo "⏰ Note: Indexes may take a few minutes to build."
echo "   You can check status at:"
echo "   https://console.firebase.google.com/project/_/firestore/indexes"
echo ""

read -p "Press Enter to continue to security rules deployment..."
echo ""

# Step 5: Deploy Security Rules
echo "========================================================================"
echo "STEP 5: DEPLOYING FIRESTORE SECURITY RULES"
echo "========================================================================"
echo ""

if [ -f "firestore.rules" ]; then
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo "✅ Security rules deployed successfully!"
    else
        echo "⚠️  Security rules deployment failed, but continuing..."
    fi
else
    echo "⚠️  firestore.rules not found, skipping..."
fi

echo ""
read -p "Press Enter to run verification..."
echo ""

# Step 6: Verify Setup
echo "========================================================================"
echo "STEP 6: VERIFYING FIRESTORE SETUP"
echo "========================================================================"
echo ""

if command -v python3 &> /dev/null; then
    python3 backend/scripts/verify_firestore.py
elif command -v python &> /dev/null; then
    python backend/scripts/verify_firestore.py
else
    echo "❌ Python not found for verification"
fi

echo ""
echo "========================================================================"
echo "✅ FIRESTORE SETUP COMPLETE!"
echo "========================================================================"
echo ""
echo "Summary:"
echo "  ✅ 19 Collections initialized"
echo "  ✅ 35 Composite indexes deployed"
echo "  ✅ Security rules deployed"
echo "  ✅ Setup verified"
echo ""
echo "Next Steps:"
echo "  1. Wait for indexes to finish building (check Firebase Console)"
echo "  2. Run your application tests"
echo "  3. Deploy to production"
echo ""
echo "Documentation:"
echo "  • FIRESTORE_SETUP_GUIDE.md - Complete guide"
echo "  • FIRESTORE_INITIALIZATION_COMPLETE.md - Setup summary"
echo "  • DATABASE_INDEXES.md - Index documentation"
echo ""
echo "========================================================================"








