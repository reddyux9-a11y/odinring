#!/bin/bash

# OdinRing Services Health Check Script
# Run this script to verify all services are running correctly

echo "🔍 OdinRing Services Health Check"
echo "=================================="
echo ""

cd /Users/sankarreddy/Desktop/odinring-main-2

# Check Backend
echo "📡 Backend (Port 8000):"
if lsof -ti:8000 >/dev/null 2>&1; then
  echo "  ✅ Process is running"
  
  # Test HTTP endpoint
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ HTTP Status: $HTTP_CODE (OK)"
    echo "  ✅ API Documentation: http://localhost:8000/docs"
  else
    echo "  ⚠️  HTTP Status: $HTTP_CODE (may still be starting)"
  fi
  
  # Test API schema
  if curl -s http://localhost:8000/api/openapi.json >/dev/null 2>&1; then
    echo "  ✅ API Schema: http://localhost:8000/api/openapi.json"
  fi
else
  echo "  ❌ NOT RUNNING"
  echo "  💡 Start with: cd backend && python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"
fi

echo ""
echo "🌐 Frontend (Port 3000):"
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ✅ Process is running"
  
  # Test HTTP endpoint
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "  ✅ HTTP Status: $HTTP_CODE (OK)"
    echo "  ✅ Application: http://localhost:3000"
  else
    echo "  ⏳ HTTP Status: $HTTP_CODE (may still be compiling)"
    echo "  💡 React apps take 15-30 seconds to compile"
  fi
else
  echo "  ❌ NOT RUNNING"
  echo "  💡 Start with: cd frontend && npm start"
fi

echo ""
echo "📊 Summary:"
BACKEND_RUNNING=$(lsof -ti:8000 >/dev/null 2>&1 && echo "YES" || echo "NO")
FRONTEND_RUNNING=$(lsof -ti:3000 >/dev/null 2>&1 && echo "YES" || echo "NO")

if [ "$BACKEND_RUNNING" = "YES" ] && [ "$FRONTEND_RUNNING" = "YES" ]; then
  echo "  ✅ All services are running!"
  echo ""
  echo "🌐 Access your application:"
  echo "   Frontend: http://localhost:3000"
  echo "   API Docs: http://localhost:8000/docs"
elif [ "$BACKEND_RUNNING" = "YES" ]; then
  echo "  ⚠️  Backend running, Frontend not running"
elif [ "$FRONTEND_RUNNING" = "YES" ]; then
  echo "  ⚠️  Frontend running, Backend not running"
else
  echo "  ❌ No services are running"
  echo ""
  echo "💡 To start both services:"
  echo "   cd /Users/sankarreddy/Desktop/odinring-main-2"
  echo "   npm start"
fi

echo ""
echo "=================================="
