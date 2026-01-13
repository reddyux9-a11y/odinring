#!/bin/bash

# OdinRing Clean Startup Script
# Stops existing services and starts them cleanly

cd /Users/sankarreddy/Desktop/odinring-main-2

echo "🛑 Stopping existing services..."
npm run kill:all 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo "✅ Verifying configuration..."

# Check backend .env
cd backend
if [ ! -f .env ]; then
  echo "❌ Backend .env missing - please create it with required variables"
  exit 1
fi
echo "✅ Backend .env exists"
cd ..

# Check/create frontend .env
cd frontend
if [ ! -f .env ]; then
  echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
  echo "✅ Created frontend .env"
else
  echo "✅ Frontend .env exists"
fi
cd ..

echo ""
echo "🚀 Starting services..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop services"
echo ""

npm start
