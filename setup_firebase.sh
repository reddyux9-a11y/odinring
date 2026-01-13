#!/bin/bash

# Automated Firebase Setup Script
# This script automates the Firebase migration and setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/sankarreddy/Desktop/odinring-main-2"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔥 Firebase Automated Setup Script  ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check if service account key exists
echo -e "${YELLOW}[1/8]${NC} Checking for Firebase service account key..."
if [ -f "$BACKEND_DIR/firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ Service account key found!${NC}"
else
    echo -e "${RED}❌ Service account key NOT found${NC}"
    echo ""
    echo -e "${YELLOW}📝 Please download your Firebase service account key:${NC}"
    echo ""
    echo "   1. Open this URL in your browser:"
    echo -e "      ${BLUE}https://console.firebase.google.com/project/studio-7743041576-fc16f/settings/serviceaccounts/adminsdk${NC}"
    echo ""
    echo "   2. Click 'Generate new private key'"
    echo "   3. Save the downloaded JSON file as:"
    echo -e "      ${BLUE}$BACKEND_DIR/firebase-service-account.json${NC}"
    echo ""
    echo "   4. Run this script again:"
    echo -e "      ${BLUE}bash setup_firebase.sh${NC}"
    echo ""
    exit 1
fi

# Step 2: Check Python dependencies
echo -e "${YELLOW}[2/8]${NC} Checking Python dependencies..."
cd "$BACKEND_DIR"
if pip3 show firebase-admin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Firebase Admin SDK installed${NC}"
else
    echo -e "${YELLOW}⏳ Installing Firebase Admin SDK...${NC}"
    pip3 install -r requirements.txt --user
    echo -e "${GREEN}✅ Firebase Admin SDK installed${NC}"
fi

# Step 3: Test Firebase connection
echo -e "${YELLOW}[3/8]${NC} Testing Firebase connection..."
python3 test_firebase_connection.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firebase connection successful${NC}"
else
    echo -e "${RED}❌ Firebase connection failed${NC}"
    exit 1
fi

# Step 4: Seed database
echo -e "${YELLOW}[4/8]${NC} Seeding Firestore database..."
python3 seed_firestore.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database seeded successfully${NC}"
else
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

# Step 5: Check frontend dependencies
echo -e "${YELLOW}[5/8]${NC} Checking frontend dependencies..."
cd "$FRONTEND_DIR"
if [ -d "node_modules/firebase" ]; then
    echo -e "${GREEN}✅ Firebase SDK installed${NC}"
else
    echo -e "${YELLOW}⏳ Installing Firebase SDK...${NC}"
    npm install firebase --legacy-peer-deps
    echo -e "${GREEN}✅ Firebase SDK installed${NC}"
fi

# Step 6: Verify environment files
echo -e "${YELLOW}[6/8]${NC} Verifying environment files..."
if [ -f "$BACKEND_DIR/.env" ]; then
    echo -e "${GREEN}✅ Backend .env exists${NC}"
else
    echo -e "${RED}❌ Backend .env missing${NC}"
    exit 1
fi

if [ -f "$FRONTEND_DIR/.env" ]; then
    echo -e "${GREEN}✅ Frontend .env exists${NC}"
else
    echo -e "${RED}❌ Frontend .env missing${NC}"
    exit 1
fi

# Step 7: Enable Google Authentication instructions
echo -e "${YELLOW}[7/8]${NC} Google Authentication setup..."
echo ""
echo -e "${YELLOW}📝 To enable Google Sign-In:${NC}"
echo ""
echo "   1. Go to Firebase Console:"
echo -e "      ${BLUE}https://console.firebase.google.com/project/studio-7743041576-fc16f/authentication/providers${NC}"
echo ""
echo "   2. Click 'Google' provider"
echo "   3. Enable it and save"
echo ""
read -p "   Press ENTER after enabling Google Sign-In..."
echo -e "${GREEN}✅ Google Sign-In ready${NC}"

# Step 8: Final summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🎉 Setup Complete! 🎉            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Firebase initialized${NC}"
echo -e "${GREEN}✅ Database seeded${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Google Sign-In enabled${NC}"
echo ""
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo ""
echo "   ${BLUE}Terminal 1 - Start Backend:${NC}"
echo "   cd $BACKEND_DIR"
echo "   python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "   ${BLUE}Terminal 2 - Start Frontend:${NC}"
echo "   cd $FRONTEND_DIR"
echo "   npm start"
echo ""
echo "   ${BLUE}Then open:${NC} http://localhost:3000"
echo ""
echo -e "${GREEN}🔐 Default Admin Credentials:${NC}"
echo "   URL: http://localhost:3000/admin-login"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  Change admin password in production!${NC}"
echo ""

