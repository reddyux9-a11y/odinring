#!/bin/bash

# Quick fix for .env files
cd /Users/sankarreddy/Desktop/odinring-main-2

echo "🔧 Fixing .env Files"
echo "===================="
echo ""

# Fix Frontend .env
echo "📁 Frontend .env:"
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > frontend/.env
echo "  ✅ Created/updated frontend/.env"
cat frontend/.env

echo ""
echo "📁 Backend .env:"
if [ ! -s backend/.env ]; then
  echo "  ⚠️  Backend .env is empty or missing"
  echo "  💡 To fix:"
  echo "     1. cp env-template.txt backend/.env"
  echo "     2. Edit backend/.env with your Firebase credentials:"
  echo "        - FIREBASE_PROJECT_ID=your-project-id"
  echo "        - JWT_SECRET=your-secret-minimum-32-chars"
  echo "        - FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json"
else
  echo "  ✅ Backend .env exists"
  echo "  💡 Verify it has: FIREBASE_PROJECT_ID, JWT_SECRET, FIREBASE_SERVICE_ACCOUNT_PATH"
fi

echo ""
echo "✅ Frontend .env fixed!"
echo "⚠️  Backend .env - verify manually if needed"
echo ""
echo "📋 Next: Restart services if needed: npm run kill:all && npm start"
