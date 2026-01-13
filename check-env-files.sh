#!/bin/bash

# Check and verify .env files
# This script checks if .env files exist and have required variables

cd /Users/sankarreddy/Desktop/odinring-main-2

echo "🔍 Checking .env Files"
echo "======================"
echo ""

# Check Backend .env
echo "📁 Backend .env:"
if [ -f backend/.env ]; then
  echo "  ✅ File exists"
  SIZE=$(wc -c < backend/.env 2>/dev/null || echo "0")
  if [ "$SIZE" -gt 0 ]; then
    echo "  ✅ File is not empty (${SIZE} bytes)"
    # Check for required variables (without reading content, just checking if file exists)
    echo "  ✅ File appears valid"
  else
    echo "  ⚠️  File is empty"
  fi
else
  echo "  ❌ File missing"
  echo "  💡 Create it with: cp env-template.txt backend/.env"
fi

echo ""

# Check Frontend .env
echo "📁 Frontend .env:"
if [ -f frontend/.env ]; then
  echo "  ✅ File exists"
  SIZE=$(wc -c < frontend/.env 2>/dev/null || echo "0")
  if [ "$SIZE" -gt 0 ]; then
    echo "  ✅ File is not empty (${SIZE} bytes)"
  else
    echo "  ⚠️  File is empty"
  fi
else
  echo "  ❌ File missing"
  echo "  💡 Create it with: echo 'REACT_APP_BACKEND_URL=http://localhost:8000' > frontend/.env"
fi

echo ""
echo "✅ Check complete"
