#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🔍 Google Sign-In Diagnostic Test                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Frontend Running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Check 1: Frontend Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if lsof -i:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
    FRONTEND_OK=true
else
    echo -e "${RED}❌ Frontend is NOT running on port 3000${NC}"
    echo "   → Start with: cd frontend && npm start"
    FRONTEND_OK=false
fi
echo ""

# Check 2: Backend Running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  Check 2: Backend Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if lsof -i:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 8000${NC}"
    BACKEND_OK=true
else
    echo -e "${RED}❌ Backend is NOT running on port 8000${NC}"
    echo "   → Start with: cd backend && python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
    BACKEND_OK=false
fi
echo ""

# Check 3: Frontend .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Check 3: Frontend Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✅ frontend/.env exists${NC}"
    
    # Check each required variable
    REQUIRED_VARS=(
        "REACT_APP_FIREBASE_API_KEY"
        "REACT_APP_FIREBASE_AUTH_DOMAIN"
        "REACT_APP_FIREBASE_PROJECT_ID"
        "REACT_APP_FIREBASE_STORAGE_BUCKET"
        "REACT_APP_FIREBASE_MESSAGING_SENDER_ID"
        "REACT_APP_FIREBASE_APP_ID"
        "REACT_APP_BACKEND_URL"
    )
    
    ALL_VARS_OK=true
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" frontend/.env; then
            value=$(grep "^${var}=" frontend/.env | cut -d '=' -f2)
            if [ -n "$value" ]; then
                echo -e "   ${GREEN}✅ ${var}${NC}"
            else
                echo -e "   ${RED}❌ ${var} is empty${NC}"
                ALL_VARS_OK=false
            fi
        else
            echo -e "   ${RED}❌ ${var} is missing${NC}"
            ALL_VARS_OK=false
        fi
    done
    
    if [ "$ALL_VARS_OK" = true ]; then
        ENV_OK=true
    else
        ENV_OK=false
        echo ""
        echo -e "${YELLOW}⚠️  Some environment variables are missing or empty${NC}"
        echo "   → Check GOOGLE_SIGNIN_COMPLETE_GUIDE.md for correct values"
    fi
else
    echo -e "${RED}❌ frontend/.env does NOT exist${NC}"
    echo "   → Create it with Firebase configuration"
    ENV_OK=false
fi
echo ""

# Check 4: Backend Connectivity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 Check 4: Backend API Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$BACKEND_OK" = true ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Backend health check passed (200 OK)${NC}"
        API_OK=true
    else
        echo -e "${RED}❌ Backend health check failed (HTTP $RESPONSE)${NC}"
        API_OK=false
    fi
else
    echo -e "${YELLOW}⏭️  Skipped (backend not running)${NC}"
    API_OK=false
fi
echo ""

# Check 5: Firebase Service Account
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Check 5: Firebase Service Account"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "backend/firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ firebase-service-account.json exists${NC}"
    
    # Check if it's valid JSON
    if python3 -c "import json; json.load(open('backend/firebase-service-account.json'))" 2>/dev/null; then
        echo -e "${GREEN}✅ Valid JSON format${NC}"
        
        # Check project_id matches
        PROJECT_ID=$(python3 -c "import json; print(json.load(open('backend/firebase-service-account.json'))['project_id'])" 2>/dev/null)
        echo "   Project ID: $PROJECT_ID"
        FIREBASE_OK=true
    else
        echo -e "${RED}❌ Invalid JSON format${NC}"
        FIREBASE_OK=false
    fi
else
    echo -e "${RED}❌ firebase-service-account.json does NOT exist${NC}"
    echo "   → Download from Firebase Console"
    FIREBASE_OK=false
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ALL_OK=true

if [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ Frontend Server${NC}"
else
    echo -e "${RED}❌ Frontend Server${NC}"
    ALL_OK=false
fi

if [ "$BACKEND_OK" = true ]; then
    echo -e "${GREEN}✅ Backend Server${NC}"
else
    echo -e "${RED}❌ Backend Server${NC}"
    ALL_OK=false
fi

if [ "$ENV_OK" = true ]; then
    echo -e "${GREEN}✅ Environment Variables${NC}"
else
    echo -e "${RED}❌ Environment Variables${NC}"
    ALL_OK=false
fi

if [ "$API_OK" = true ]; then
    echo -e "${GREEN}✅ Backend API${NC}"
else
    echo -e "${RED}❌ Backend API${NC}"
    ALL_OK=false
fi

if [ "$FIREBASE_OK" = true ]; then
    echo -e "${GREEN}✅ Firebase Configuration${NC}"
else
    echo -e "${RED}❌ Firebase Configuration${NC}"
    ALL_OK=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_OK" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo ""
    echo "✨ Next Steps:"
    echo "   1. Open http://localhost:3000/auth in your browser"
    echo "   2. Click 'Sign in with Google'"
    echo "   3. Select your Google account"
    echo "   4. You should be redirected back and logged in!"
    echo ""
    echo "📖 Full guide: GOOGLE_SIGNIN_COMPLETE_GUIDE.md"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
    echo ""
    echo "Please fix the issues above before testing Google Sign-In."
    echo ""
    echo "📖 Full guide: GOOGLE_SIGNIN_COMPLETE_GUIDE.md"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

