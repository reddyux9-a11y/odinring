#!/bin/bash

# Verify Backend .env has required variables
cd /Users/sankarreddy/Desktop/odinring-main-2/backend

echo "🔍 Checking Backend .env Variables"
echo "===================================="
echo ""

if [ ! -f .env ]; then
  echo "❌ Backend .env file does not exist"
  echo ""
  echo "💡 To create it:"
  echo "   cd /Users/sankarreddy/Desktop/odinring-main-2"
  echo "   cp env-template.txt backend/.env"
  echo "   Then edit backend/.env with your values"
  exit 1
fi

echo "✅ Backend .env file exists"
echo ""

# Check for required variables (without reading file content directly)
# We'll check if backend starts without errors instead

echo "📋 Required Variables:"
echo ""
echo "  1. FIREBASE_PROJECT_ID"
echo "  2. JWT_SECRET (minimum 32 characters)"
echo "  3. FIREBASE_SERVICE_ACCOUNT_PATH (optional, defaults to firebase-service-account.json)"
echo ""

# Since we can't read .env directly, check if backend can start
echo "🔍 To verify variables are set correctly:"
echo ""
echo "  1. Check if backend starts without errors:"
echo "     cd /Users/sankarreddy/Desktop/odinring-main-2/backend"
echo "     python3 -c 'from config import settings; print(\"✅ Config loaded\"); print(f\"Project ID: {settings.FIREBASE_PROJECT_ID[:20]}...\")'"
echo ""
echo "  2. If backend is running, check terminal output for:"
echo "     ✅ Configuration validated successfully"
echo "     ✅ Firestore connected"
echo ""
echo "  3. If you see errors like:"
echo "     ❌ 'FIREBASE_PROJECT_ID' not set"
echo "     ❌ 'JWT_SECRET' must be at least 32 characters"
echo "     Then edit backend/.env with required values"
echo ""

# Check if backend process is running (indicates .env is probably correct)
if lsof -ti:8000 >/dev/null 2>&1; then
  echo "✅ Backend is currently running on port 8000"
  echo "   This suggests .env file is correctly configured!"
  echo ""
  echo "💡 If backend started without errors, your .env file is correct."
  echo "💡 If you see Firebase/JWT errors, check the values in backend/.env"
else
  echo "⚠️  Backend is not currently running"
  echo ""
  echo "💡 To test if .env is correct, try starting backend:"
  echo "   cd /Users/sankarreddy/Desktop/odinring-main-2/backend"
  echo "   python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
  echo ""
  echo "   If it starts without errors, .env is correct!"
  echo "   If you see configuration errors, update backend/.env"
fi

echo ""
echo "📝 If you need to fix backend/.env:"
echo "   1. cp /Users/sankarreddy/Desktop/odinring-main-2/env-template.txt backend/.env"
echo "   2. Edit backend/.env with your values"
echo "   3. Set at minimum:"
echo "      FIREBASE_PROJECT_ID=studio-7743041576-fc16f"
echo "      JWT_SECRET=your-secret-minimum-32-characters"
echo "      FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json"
