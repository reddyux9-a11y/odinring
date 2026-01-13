#!/bin/bash

# Fix .env files - Create or verify required variables
cd /Users/sankarreddy/Desktop/odinring-main-2

echo "🔧 Fixing .env Files"
echo "===================="
echo ""

# Fix Frontend .env (can be created safely)
echo "📁 Frontend .env:"
if [ ! -f frontend/.env ]; then
  echo "  ❌ Missing - Creating..."
  echo "REACT_APP_BACKEND_URL=http://localhost:8000" > frontend/.env
  echo "  ✅ Created frontend/.env"
elif [ ! -s frontend/.env ]; then
  echo "  ⚠️  Empty - Fixing..."
  echo "REACT_APP_BACKEND_URL=http://localhost:8000" > frontend/.env
  echo "  ✅ Fixed frontend/.env"
else
  # Check if REACT_APP_BACKEND_URL exists
  if ! grep -q "REACT_APP_BACKEND_URL" frontend/.env 2>/dev/null; then
    echo "  ⚠️  Missing REACT_APP_BACKEND_URL - Adding..."
    echo "" >> frontend/.env
    echo "REACT_APP_BACKEND_URL=http://localhost:8000" >> frontend/.env
    echo "  ✅ Added REACT_APP_BACKEND_URL"
  else
    echo "  ✅ Frontend .env exists and has REACT_APP_BACKEND_URL"
  fi
fi

echo ""

# Check Backend .env (cannot create - user must configure)
echo "📁 Backend .env:"
if [ ! -f backend/.env ]; then
  echo "  ❌ Missing"
  echo "  ⚠️  Cannot auto-create (requires Firebase credentials)"
  echo "  💡 Copy template: cp env-template.txt backend/.env"
  echo "  💡 Then edit backend/.env with your Firebase project ID and JWT secret"
elif [ ! -s backend/.env ]; then
  echo "  ⚠️  Empty"
  echo "  ⚠️  Cannot auto-fix (requires Firebase credentials)"
  echo "  💡 Copy template: cp env-template.txt backend/.env"
  echo "  💡 Then edit backend/.env with your Firebase project ID and JWT secret"
else
  echo "  ✅ Backend .env exists and is not empty"
  echo "  💡 If you see errors, verify it has:"
  echo "     - FIREBASE_PROJECT_ID"
  echo "     - FIREBASE_SERVICE_ACCOUNT_PATH"
  echo "     - JWT_SECRET (at least 32 characters)"
fi

echo ""
echo "✅ Fix complete"
echo ""
echo "📋 Next Steps:"
echo "   1. Frontend .env should be fixed automatically"
echo "   2. If backend .env is missing, copy env-template.txt to backend/.env"
echo "   3. Edit backend/.env with your Firebase credentials"
echo "   4. Restart services if needed"
