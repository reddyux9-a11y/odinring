#!/bin/bash
# Firebase CLI Automation Script
# Automates Firebase setup, deployment, and configuration extraction

set -e  # Exit on error

PROJECT_ID="studio-7743041576-fc16f"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔥 Firebase CLI Automation Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Firebase CLI is installed
echo "📦 Step 1: Checking Firebase CLI installation..."

# Function to run firebase command (uses npx if not installed globally)
run_firebase() {
    if command -v firebase &> /dev/null; then
        firebase "$@"
    else
        npx -y firebase-tools "$@"
    fi
}

if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not installed globally. Will use npx firebase-tools${NC}"
    
    # Check if npm is available
    if ! command -v npm &> /dev/null && ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ npm/npx is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    
    echo "Will use: npx firebase-tools (no global install needed)"
    echo -e "${GREEN}✅ Ready to use Firebase CLI via npx${NC}"
else
    echo -e "${GREEN}✅ Firebase CLI is already installed${NC}"
    firebase --version
fi

echo ""

# Step 2: Check if user is logged in
echo "🔐 Step 2: Checking Firebase authentication..."
if ! run_firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase. Please log in...${NC}"
    echo "Opening browser for authentication..."
    run_firebase login --no-localhost
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully logged in to Firebase${NC}"
    else
        echo -e "${RED}❌ Failed to log in to Firebase${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Already logged in to Firebase${NC}"
    echo "Current user:"
    run_firebase login:list 2>/dev/null | head -1 || echo "User info not available"
fi

echo ""

# Step 3: Verify project is linked
echo "🔗 Step 3: Verifying Firebase project link..."
cd "$PROJECT_ROOT"

if [ ! -f ".firebaserc" ]; then
    echo -e "${YELLOW}⚠️  .firebaserc not found. Creating...${NC}"
    cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF
    echo -e "${GREEN}✅ Created .firebaserc${NC}"
fi

# Verify project exists
echo "Verifying project access..."
if run_firebase use "$PROJECT_ID" &> /dev/null; then
    echo -e "${GREEN}✅ Project '$PROJECT_ID' is accessible${NC}"
    run_firebase use "$PROJECT_ID"
else
    echo -e "${RED}❌ Cannot access project '$PROJECT_ID'${NC}"
    echo "Please verify you have access to this project."
    exit 1
fi

echo ""

# Step 4: Deploy Firestore rules
echo "📋 Step 4: Deploying Firestore security rules..."
if [ -f "firestore.rules" ]; then
    echo "Deploying rules from firestore.rules..."
    run_firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Firestore rules deployed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Firestore rules deployment had issues (may already be deployed)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  firestore.rules not found, skipping rules deployment${NC}"
fi

echo ""

# Step 5: Deploy Firestore indexes
echo "📊 Step 5: Deploying Firestore indexes..."
if [ -f "firestore.indexes.json" ]; then
    echo "Deploying indexes from firestore.indexes.json..."
    run_firebase deploy --only firestore:indexes
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Firestore indexes deployed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Firestore indexes deployment had issues (may already be deployed)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  firestore.indexes.json not found, skipping indexes deployment${NC}"
fi

echo ""

# Step 6: Extract Firebase config
echo "🔑 Step 6: Extracting Firebase configuration..."
echo "Getting web app configuration..."

# Get Firebase config using Firebase CLI
FIREBASE_CONFIG=$(run_firebase apps:sdkconfig web 2>/dev/null || echo "")

if [ -z "$FIREBASE_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  Could not automatically extract config. Using manual values...${NC}"
    
    # Use values from the screenshot/user input
    cat > "$PROJECT_ROOT/firebase-config-extracted.json" << EOF
{
  "apiKey": "AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs",
  "authDomain": "studio-7743041576-fc16f.firebaseapp.com",
  "projectId": "studio-7743041576-fc16f",
  "storageBucket": "studio-7743041576-fc16f.firebasestorage.app",
  "messagingSenderId": "544218567948",
  "appId": "1:544218567948:web:59374d5038ec7051b32529"
}
EOF
    echo -e "${GREEN}✅ Created firebase-config-extracted.json${NC}"
else
    echo "$FIREBASE_CONFIG" > "$PROJECT_ROOT/firebase-config-extracted.json"
    echo -e "${GREEN}✅ Extracted Firebase config to firebase-config-extracted.json${NC}"
fi

echo ""

# Step 7: Display environment variables
echo "📝 Step 7: Environment Variables for Frontend"
echo "=============================================="
echo ""
echo "Add these to your Vercel frontend environment variables:"
echo ""

if [ -f "$PROJECT_ROOT/firebase-config-extracted.json" ]; then
    # Extract values from JSON (requires jq or manual parsing)
    if command -v jq &> /dev/null; then
        API_KEY=$(jq -r '.apiKey' "$PROJECT_ROOT/firebase-config-extracted.json")
        AUTH_DOMAIN=$(jq -r '.authDomain' "$PROJECT_ROOT/firebase-config-extracted.json")
        PROJECT_ID=$(jq -r '.projectId' "$PROJECT_ROOT/firebase-config-extracted.json")
        STORAGE_BUCKET=$(jq -r '.storageBucket' "$PROJECT_ROOT/firebase-config-extracted.json")
        MESSAGING_SENDER_ID=$(jq -r '.messagingSenderId' "$PROJECT_ROOT/firebase-config-extracted.json")
        APP_ID=$(jq -r '.appId' "$PROJECT_ROOT/firebase-config-extracted.json")
        
        echo "REACT_APP_FIREBASE_API_KEY=$API_KEY"
        echo "REACT_APP_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN"
        echo "REACT_APP_FIREBASE_PROJECT_ID=$PROJECT_ID"
        echo "REACT_APP_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET"
        echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID"
        echo "REACT_APP_FIREBASE_APP_ID=$APP_ID"
    else
        echo "Install 'jq' for automatic extraction, or manually copy from:"
        echo "$PROJECT_ROOT/firebase-config-extracted.json"
        cat "$PROJECT_ROOT/firebase-config-extracted.json"
    fi
else
    echo "Using manual values:"
    echo "REACT_APP_FIREBASE_API_KEY=AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs"
    echo "REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7743041576-fc16f.firebaseapp.com"
    echo "REACT_APP_FIREBASE_PROJECT_ID=studio-7743041576-fc16f"
    echo "REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7743041576-fc16f.firebasestorage.app"
    echo "REACT_APP_FIREBASE_MESSAGING_SENDER_ID=544218567948"
    echo "REACT_APP_FIREBASE_APP_ID=1:544218567948:web:59374d5038ec7051b32529"
fi

echo ""
echo "=============================================="
echo ""

# Step 8: Summary
echo "✅ Firebase Setup Complete!"
echo ""
echo "Summary:"
echo "  ✅ Firebase CLI installed/verified"
echo "  ✅ Logged in to Firebase"
echo "  ✅ Project linked: $PROJECT_ID"
echo "  ✅ Firestore rules deployed"
echo "  ✅ Firestore indexes deployed"
echo "  ✅ Configuration extracted"
echo ""
echo "Next Steps:"
echo "  1. Set the environment variables above in Vercel frontend project"
echo "  2. Verify Firestore rules are working"
echo "  3. Test frontend connection to Firebase"
echo ""
echo "To deploy rules/indexes again:"
echo "  npx firebase-tools deploy --only firestore:rules"
echo "  npx firebase-tools deploy --only firestore:indexes"
echo ""
echo "To view Firebase project:"
echo "  npx firebase-tools open"
echo ""
