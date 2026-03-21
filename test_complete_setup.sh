#!/bin/bash

# Complete Firebase Setup Test Script
# Tests all components of the migration

echo "🧪 Testing Complete Firebase Setup"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Change to backend directory
cd /Users/sankarreddy/Desktop/odinring-main-2/backend || exit 1

echo "📋 Test 1: Check Firebase Service Account Key"
echo "----------------------------------------------"
if [ -f "firebase-service-account.json" ]; then
    test_result 0 "Service account key file exists"
    
    # Validate JSON
    if python3 -c "import json; json.load(open('firebase-service-account.json'))" 2>/dev/null; then
        test_result 0 "Service account key is valid JSON"
    else
        test_result 1 "Service account key is invalid JSON"
    fi
else
    test_result 1 "Service account key file not found"
fi
echo ""

echo "📋 Test 2: Check Backend Environment Variables"
echo "----------------------------------------------"
if [ -f ".env" ]; then
    test_result 0 "Backend .env file exists"
    
    # Check required variables
    if grep -q "FIREBASE_PROJECT_ID" .env; then
        test_result 0 "FIREBASE_PROJECT_ID is set"
    else
        test_result 1 "FIREBASE_PROJECT_ID is missing"
    fi
    
    if grep -q "FIREBASE_SERVICE_ACCOUNT_PATH" .env; then
        test_result 0 "FIREBASE_SERVICE_ACCOUNT_PATH is set"
    else
        test_result 1 "FIREBASE_SERVICE_ACCOUNT_PATH is missing"
    fi
else
    test_result 1 "Backend .env file not found"
fi
echo ""

echo "📋 Test 3: Check Python Dependencies"
echo "----------------------------------------------"
if pip3 show firebase-admin &>/dev/null; then
    test_result 0 "firebase-admin package installed"
else
    test_result 1 "firebase-admin package not installed"
fi

if pip3 show fastapi &>/dev/null; then
    test_result 0 "fastapi package installed"
else
    test_result 1 "fastapi package not installed"
fi
echo ""

echo "📋 Test 4: Check Firebase Configuration Files"
echo "----------------------------------------------"
if [ -f "firebase_config.py" ]; then
    test_result 0 "firebase_config.py exists"
else
    test_result 1 "firebase_config.py not found"
fi

if [ -f "firestore_db.py" ]; then
    test_result 0 "firestore_db.py exists"
else
    test_result 1 "firestore_db.py not found"
fi

if [ -f "seed_firestore.py" ]; then
    test_result 0 "seed_firestore.py exists"
else
    test_result 1 "seed_firestore.py not found"
fi
echo ""

echo "📋 Test 5: Check Frontend Configuration"
echo "----------------------------------------------"
cd ../frontend || exit 1

if [ -f ".env" ]; then
    test_result 0 "Frontend .env file exists"
    
    if grep -q "REACT_APP_FIREBASE_API_KEY" .env; then
        test_result 0 "REACT_APP_FIREBASE_API_KEY is set"
    else
        test_result 1 "REACT_APP_FIREBASE_API_KEY is missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_PROJECT_ID" .env; then
        test_result 0 "REACT_APP_FIREBASE_PROJECT_ID is set"
    else
        test_result 1 "REACT_APP_FIREBASE_PROJECT_ID is missing"
    fi
else
    test_result 1 "Frontend .env file not found"
fi
echo ""

echo "📋 Test 6: Check Firebase Client Files"
echo "----------------------------------------------"
if [ -f "src/lib/firebase.js" ]; then
    test_result 0 "firebase.js client library exists"
else
    test_result 1 "firebase.js client library not found"
fi

if [ -f "src/components/GoogleSignInButton.jsx" ]; then
    test_result 0 "GoogleSignInButton component exists"
else
    test_result 1 "GoogleSignInButton component not found"
fi
echo ""

echo "📋 Test 7: Check Node Dependencies"
echo "----------------------------------------------"
if [ -d "node_modules/firebase" ]; then
    test_result 0 "Firebase SDK installed"
else
    test_result 1 "Firebase SDK not installed"
fi
echo ""

echo "📋 Test 8: Test Firebase Connection"
echo "----------------------------------------------"
cd ../backend || exit 1
echo "Running Firebase connection test..."
if python3 test_firebase_connection.py 2>&1 | grep -q "ALL TESTS PASSED"; then
    test_result 0 "Firebase connection successful"
else
    echo -e "${YELLOW}⚠️  Firebase connection test failed${NC}"
    echo "This is expected if Firestore API is not enabled yet"
    echo "👉 Enable it at: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=studio-7743041576-fc16f"
    test_result 1 "Firebase connection (needs Firestore API enabled)"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Your setup is complete!"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Enable Firestore API (if not done yet)"
    echo "   2. Run: cd backend && python3 seed_firestore.py"
    echo "   3. Start backend: python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
    echo "   4. Start frontend: cd ../frontend && npm start"
    echo ""
elif [ $TESTS_FAILED -eq 1 ] && [ $TESTS_PASSED -gt 10 ]; then
    echo -e "${YELLOW}⚠️  Almost there!${NC}"
    echo ""
    echo "Most tests passed. The failing test is likely:"
    echo "   - Firestore API not enabled yet"
    echo ""
    echo "👉 Enable it at:"
    echo "   https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=studio-7743041576-fc16f"
    echo ""
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please review the failed tests above and fix them."
    echo "See COMPLETE_FIREBASE_SETUP.md for detailed instructions."
    echo ""
fi

exit $TESTS_FAILED

