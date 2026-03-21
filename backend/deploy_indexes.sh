#!/bin/bash
# Deploy Firestore Indexes
# This script deploys the optimized Firestore indexes to improve query performance

echo "🔥 Deploying Firestore Indexes..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo ""
    echo "Please install Firebase CLI:"
    echo "  npm install -g firebase-tools"
    echo ""
    echo "Or use the Firebase Console:"
    echo "  1. Go to https://console.firebase.google.com"
    echo "  2. Select your project"
    echo "  3. Navigate to Firestore → Indexes"
    echo "  4. Click 'Deploy' or upload firestore.indexes.json"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged in to Firebase"
    echo "Running: firebase login"
    firebase login
fi

# Deploy indexes
echo "📤 Deploying indexes from firestore.indexes.json..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Indexes deployed successfully!"
    echo ""
    echo "📊 Monitor index build status:"
    echo "   https://console.firebase.google.com/project/_/firestore/indexes"
    echo ""
    echo "⏱️  Index building may take a few minutes for large collections"
else
    echo ""
    echo "❌ Index deployment failed"
    echo "Check the error messages above"
    exit 1
fi



