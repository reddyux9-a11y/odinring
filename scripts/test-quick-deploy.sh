#!/bin/bash
# Test Quick Deploy Script
# Validates everything before actual deployment

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🧪 Testing Quick Deploy (Dry Run)"
echo "=================================="
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Test authentication
echo "1. Testing Vercel authentication..."
if $VERCEL_CMD whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    echo "   ✅ Authentication successful"
    USER_INFO=$($VERCEL_CMD whoami --token "$VERCEL_TOKEN" 2>&1)
    echo "   User: $USER_INFO"
else
    echo "   ❌ Authentication failed"
    echo "   Attempting login..."
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN" 2>&1
fi

echo ""

# Test backend configuration
echo "2. Testing backend configuration..."
cd backend

if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json exists"
    if python3 -c "import json; json.load(open('vercel.json'))" 2>&1 > /dev/null; then
        echo "   ✅ vercel.json is valid JSON"
    else
        echo "   ❌ vercel.json is invalid JSON"
        exit 1
    fi
else
    echo "   ❌ vercel.json not found"
    exit 1
fi

if [ -f "server.py" ]; then
    echo "   ✅ server.py exists"
    if python3 -c "import ast; ast.parse(open('server.py').read())" 2>&1 > /dev/null; then
        echo "   ✅ server.py syntax is valid"
    else
        echo "   ❌ server.py has syntax errors"
        exit 1
    fi
else
    echo "   ❌ server.py not found"
    exit 1
fi

cd ..

echo ""

# Test frontend configuration
echo "3. Testing frontend configuration..."
cd frontend

if [ -f "package.json" ]; then
    echo "   ✅ package.json exists"
    if node -e "JSON.parse(require('fs').readFileSync('package.json'))" 2>&1 > /dev/null; then
        echo "   ✅ package.json is valid JSON"
    else
        echo "   ❌ package.json is invalid JSON"
        exit 1
    fi
else
    echo "   ❌ package.json not found"
    exit 1
fi

cd ..

echo ""

# Check if projects are linked
echo "4. Checking project linkage..."
if [ -f "backend/.vercel/project.json" ]; then
    echo "   ✅ Backend project is linked"
    cat backend/.vercel/project.json | python3 -m json.tool 2>/dev/null || echo "   (project info available)"
else
    echo "   ⚠️  Backend project not linked (will be linked during deployment)"
fi

if [ -f "frontend/.vercel/project.json" ]; then
    echo "   ✅ Frontend project is linked"
    cat frontend/.vercel/project.json | python3 -m json.tool 2>/dev/null || echo "   (project info available)"
else
    echo "   ⚠️  Frontend project not linked (will be linked during deployment)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All checks passed! Ready for deployment."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To deploy, run:"
echo "  ./scripts/quick-deploy.sh"
echo ""
