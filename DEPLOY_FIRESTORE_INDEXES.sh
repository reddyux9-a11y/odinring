#!/bin/bash
# Deploy Firestore Indexes
# This script installs Firebase CLI (if needed) and deploys Firestore indexes

set -e  # Exit on error

echo "🔥 Firestore Indexes Deployment Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if command -v firebase &> /dev/null; then
    echo -e "${GREEN}✅ Firebase CLI is already installed${NC}"
    firebase --version
else
    echo -e "${YELLOW}⚠️  Firebase CLI not found${NC}"
    echo ""
    echo "Installing Firebase CLI..."
    echo "This requires Node.js and npm to be installed."
    echo ""
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        echo ""
        echo "Please install Node.js and npm first:"
        echo "  - Visit: https://nodejs.org/"
        echo "  - Or use: brew install node (on macOS)"
        exit 1
    fi
    
    # Try to install Firebase CLI
    echo "Running: npm install -g firebase-tools"
    if npm install -g firebase-tools; then
        echo -e "${GREEN}✅ Firebase CLI installed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Global installation failed (may require sudo)${NC}"
        echo ""
        echo "Please install Firebase CLI manually:"
        echo "  sudo npm install -g firebase-tools"
        echo ""
        echo "Or use the Firebase Console web interface:"
        echo "  https://console.firebase.google.com/project/studio-7743041576-fc16f/firestore/indexes"
        exit 1
    fi
fi

echo ""
echo "Checking Firebase login status..."
if firebase projects:list &> /dev/null; then
    echo -e "${GREEN}✅ Already logged in to Firebase${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo ""
    echo "Please login to Firebase:"
    echo "  firebase login"
    echo ""
    echo "This will open a browser window for authentication."
    read -p "Press Enter to continue with login, or Ctrl+C to cancel..."
    firebase login
fi

echo ""
echo "Setting Firebase project..."
PROJECT_ID="studio-7743041576-fc16f"
firebase use "$PROJECT_ID" 2>/dev/null || firebase use --add "$PROJECT_ID"

echo ""
echo "📤 Deploying Firestore indexes..."
echo "File: firestore.indexes.json"
echo ""

if firebase deploy --only firestore:indexes; then
    echo ""
    echo -e "${GREEN}✅ Indexes deployed successfully!${NC}"
    echo ""
    echo "📊 Monitor index build status:"
    echo "  https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
    echo ""
    echo -e "${YELLOW}⏱️  Note: Index building may take 5-10 minutes for large collections${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Wait for indexes to finish building (check Firebase Console)"
    echo "2. Verify all indexes show 'Enabled' status"
    echo "3. Test queries that use these indexes"
else
    echo ""
    echo -e "${RED}❌ Index deployment failed${NC}"
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "  - Not logged in to Firebase (run: firebase login)"
    echo "  - Wrong project selected (run: firebase use $PROJECT_ID)"
    echo "  - Invalid index syntax (check firestore.indexes.json)"
    exit 1
fi



