#!/bin/bash
# Deploy Firestore indexes to Firebase

echo "========================================================================"
echo "🔥 DEPLOYING FIRESTORE INDEXES"
echo "========================================================================"
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "📝 Checking Firebase authentication..."
firebase login:ci --no-localhost 2>/dev/null || firebase login

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

echo ""
echo "📂 Project root: $PROJECT_ROOT"
echo "📄 Indexes file: $PROJECT_ROOT/firestore.indexes.json"
echo ""

# Verify indexes file exists
if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ firestore.indexes.json not found!"
    exit 1
fi

echo "✅ Indexes file found"
echo ""

# Show what will be deployed
echo "========================================================================"
echo "📋 INDEXES TO BE DEPLOYED"
echo "========================================================================"
echo ""

# Count indexes
INDEX_COUNT=$(grep -o '"collectionGroup"' firestore.indexes.json | wc -l)
echo "Total composite indexes: $INDEX_COUNT"
echo ""

# Extract collection names
echo "Collections with indexes:"
grep '"collectionGroup"' firestore.indexes.json | sed 's/.*"collectionGroup": "\(.*\)".*/  • \1/' | sort -u
echo ""

# Ask for confirmation
read -p "Deploy these indexes to Firebase? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "========================================================================"
echo "🚀 DEPLOYING TO FIREBASE"
echo "========================================================================"
echo ""

# Deploy indexes
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================================================"
    echo "✅ INDEXES DEPLOYED SUCCESSFULLY"
    echo "========================================================================"
    echo ""
    echo "⏰ Note: Index creation may take several minutes to complete."
    echo "   You can check the status in Firebase Console:"
    echo "   https://console.firebase.google.com/project/_/firestore/indexes"
    echo ""
    echo "Next steps:"
    echo "1. Wait for indexes to finish building (check Firebase Console)"
    echo "2. Deploy Firestore rules: ./backend/scripts/deploy_rules.sh"
    echo "3. Verify setup: python backend/scripts/verify_firestore.py"
    echo ""
    echo "========================================================================"
else
    echo ""
    echo "========================================================================"
    echo "❌ INDEX DEPLOYMENT FAILED"
    echo "========================================================================"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure you're logged into Firebase: firebase login"
    echo "2. Check your Firebase project: firebase use"
    echo "3. Verify firestore.indexes.json is valid JSON"
    echo "4. Check Firebase Console for error details"
    echo ""
    exit 1
fi








