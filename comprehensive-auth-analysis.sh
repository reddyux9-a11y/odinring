#!/bin/bash

# 🔐 COMPREHENSIVE AUTH STATE ANALYSIS

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║        🔐 COMPREHENSIVE AUTH STATE ANALYSIS               ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Change to project root
cd /Users/sankarreddy/Desktop/odinring-main-2

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 SECTION 1: Firebase Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check frontend Firebase config
if [ -f "frontend/.env" ]; then
    echo "✅ Frontend .env exists"
    echo ""
    echo "🔍 Firebase Environment Variables:"
    
    if grep -q "REACT_APP_FIREBASE_API_KEY" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_API_KEY: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_API_KEY: Missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_AUTH_DOMAIN" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_AUTH_DOMAIN: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_AUTH_DOMAIN: Missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_PROJECT_ID" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_PROJECT_ID: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_PROJECT_ID: Missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_STORAGE_BUCKET" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_STORAGE_BUCKET: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_STORAGE_BUCKET: Missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_MESSAGING_SENDER_ID" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_MESSAGING_SENDER_ID: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_MESSAGING_SENDER_ID: Missing"
    fi
    
    if grep -q "REACT_APP_FIREBASE_APP_ID" frontend/.env; then
        echo "   ✅ REACT_APP_FIREBASE_APP_ID: Set"
    else
        echo "   ❌ REACT_APP_FIREBASE_APP_ID: Missing"
    fi
else
    echo "❌ Frontend .env NOT FOUND"
fi

echo ""

# Check backend Firebase config
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env exists"
    echo ""
    echo "🔍 Backend Environment Variables:"
    
    if grep -q "FIREBASE_PROJECT_ID" backend/.env; then
        echo "   ✅ FIREBASE_PROJECT_ID: Set"
    else
        echo "   ❌ FIREBASE_PROJECT_ID: Missing"
    fi
    
    if grep -q "FIREBASE_DATABASE_ID" backend/.env; then
        echo "   ✅ FIREBASE_DATABASE_ID: Set"
    else
        echo "   ❌ FIREBASE_DATABASE_ID: Missing"
    fi
else
    echo "❌ Backend .env NOT FOUND"
fi

echo ""

# Check service account
if [ -f "backend/firebase-service-account.json" ]; then
    echo "✅ Firebase service account JSON exists"
    
    # Validate JSON structure
    if python3 -c "import json; json.load(open('backend/firebase-service-account.json'))" 2>/dev/null; then
        echo "   ✅ Valid JSON format"
        
        # Check required fields
        project_id=$(python3 -c "import json; print(json.load(open('backend/firebase-service-account.json')).get('project_id', 'N/A'))" 2>/dev/null)
        client_email=$(python3 -c "import json; print(json.load(open('backend/firebase-service-account.json')).get('client_email', 'N/A'))" 2>/dev/null)
        
        echo "   📊 Project ID: $project_id"
        echo "   📧 Client Email: $client_email"
    else
        echo "   ❌ Invalid JSON format"
    fi
else
    echo "❌ Firebase service account JSON NOT FOUND"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 SECTION 2: Auth Implementation Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check frontend auth files
echo "🔍 Frontend Auth Files:"
echo ""

if [ -f "frontend/src/lib/firebase.js" ]; then
    echo "   ✅ firebase.js exists"
    
    # Check for onAuthStateChanged
    if grep -q "onAuthStateChanged" frontend/src/lib/firebase.js; then
        echo "      ✅ Uses onAuthStateChanged"
    else
        echo "      ❌ Missing onAuthStateChanged"
    fi
    
    # Check for persistence
    if grep -q "setPersistence" frontend/src/lib/firebase.js; then
        echo "      ✅ Sets auth persistence"
    else
        echo "      ❌ Missing setPersistence"
    fi
    
    # Check for signInWithRedirect
    if grep -q "signInWithRedirect" frontend/src/lib/firebase.js; then
        echo "      ✅ Uses signInWithRedirect"
    else
        echo "      ⚠️ No signInWithRedirect found"
    fi
else
    echo "   ❌ firebase.js NOT FOUND"
fi

echo ""

if [ -f "frontend/src/contexts/AuthContext.jsx" ]; then
    echo "   ✅ AuthContext.jsx exists"
    
    # Check for Firebase integration
    if grep -q "onAuthChange" frontend/src/contexts/AuthContext.jsx; then
        echo "      ✅ Integrates Firebase auth listener"
    else
        echo "      ⚠️ No Firebase auth listener integration"
    fi
    
    # Check for loginWithGoogle
    if grep -q "loginWithGoogle" frontend/src/contexts/AuthContext.jsx; then
        echo "      ✅ Implements loginWithGoogle"
    else
        echo "      ❌ Missing loginWithGoogle"
    fi
else
    echo "   ❌ AuthContext.jsx NOT FOUND"
fi

echo ""

if [ -f "frontend/src/components/GoogleSignInButton.jsx" ]; then
    echo "   ✅ GoogleSignInButton.jsx exists"
    
    # Check for redirect result handling
    if grep -q "getRedirectResult" frontend/src/components/GoogleSignInButton.jsx; then
        echo "      ✅ Handles redirect results"
    else
        echo "      ⚠️ No redirect result handling"
    fi
else
    echo "   ❌ GoogleSignInButton.jsx NOT FOUND"
fi

echo ""

if [ -f "frontend/src/pages/AuthPage.jsx" ]; then
    echo "   ✅ AuthPage.jsx exists"
    
    # Check for email/password forms
    if grep -q "email" frontend/src/pages/AuthPage.jsx && grep -q "password" frontend/src/pages/AuthPage.jsx; then
        echo "      ✅ Includes email/password forms"
    else
        echo "      ⚠️ No email/password forms"
    fi
else
    echo "   ❌ AuthPage.jsx NOT FOUND"
fi

echo ""

# Check backend auth files
echo "🔍 Backend Auth Files:"
echo ""

if [ -f "backend/firebase_config.py" ]; then
    echo "   ✅ firebase_config.py exists"
else
    echo "   ❌ firebase_config.py NOT FOUND"
fi

if [ -f "backend/firestore_db.py" ]; then
    echo "   ✅ firestore_db.py exists"
else
    echo "   ❌ firestore_db.py NOT FOUND"
fi

if [ -f "backend/server.py" ]; then
    echo "   ✅ server.py exists"
    
    # Check for MongoDB remnants
    mongo_count=$(grep -c "mongo\|pymongo\|Motor" backend/server.py 2>/dev/null || echo "0")
    if [ "$mongo_count" -eq 0 ]; then
        echo "      ✅ No MongoDB references"
    else
        echo "      ⚠️ Found $mongo_count MongoDB references (should be 0)"
    fi
    
    # Check for Firestore usage
    if grep -q "FirestoreDB" backend/server.py; then
        echo "      ✅ Uses FirestoreDB"
    else
        echo "      ❌ Missing FirestoreDB usage"
    fi
else
    echo "   ❌ server.py NOT FOUND"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 SECTION 3: Code Quality Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Checking for deprecated patterns..."
echo ""

# Check for auth.currentUser (deprecated)
current_user_count=$(grep -r "auth\.currentUser" frontend/src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs)
if [ "$current_user_count" -eq 0 ]; then
    echo "   ✅ No auth.currentUser usage (good - using onAuthStateChanged)"
else
    echo "   ⚠️ Found $current_user_count instances of auth.currentUser"
    echo "      Should use onAuthStateChanged instead"
fi

# Check for multiple Firebase initializations
init_count=$(grep -r "initializeApp" frontend/src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs)
if [ "$init_count" -eq 1 ]; then
    echo "   ✅ Single Firebase initialization (correct)"
else
    echo "   ⚠️ Found $init_count Firebase initializations (should be 1)"
fi

# Check for MongoDB remnants
echo ""
echo "🔍 Checking for MongoDB remnants..."
echo ""

mongo_frontend=$(grep -r "mongo\|MongoDB" frontend/src --include="*.js" --include="*.jsx" 2>/dev/null | wc -l | xargs)
if [ "$mongo_frontend" -eq 0 ]; then
    echo "   ✅ Frontend: No MongoDB references"
else
    echo "   ⚠️ Frontend: Found $mongo_frontend MongoDB references"
fi

mongo_backend=$(grep -r "mongo\|pymongo\|Motor" backend --include="*.py" --exclude="*test*" 2>/dev/null | wc -l | xargs)
if [ "$mongo_backend" -eq 0 ]; then
    echo "   ✅ Backend: No MongoDB references"
else
    echo "   ⚠️ Backend: Found $mongo_backend MongoDB references"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 SECTION 4: Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if servers are running
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "   ✅ Backend: Running on port 8000"
else
    echo "   ❌ Backend: Not running"
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   ✅ Frontend: Running on port 3000"
else
    echo "   ❌ Frontend: Not running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋 SECTION 5: Firestore Connection Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "ℹ️ Firestore connection will be tested next..."
echo "   → Run: python3 backend/test_firestore_connection.py"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 ANALYSIS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Next Steps:"
echo ""
echo "   1. Review analysis results above"
echo "   2. Fix any ❌ or ⚠️ issues"
echo "   3. Run: python3 backend/test_firestore_connection.py"
echo "   4. Start servers and begin testing"
echo ""



