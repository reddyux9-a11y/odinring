#!/bin/bash
# Comprehensive Deployment Script with Pre-flight Checks
# Uses your Vercel token for automated deployment

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🚀 OdinRing Comprehensive Deployment"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Pre-flight checks
echo "🔍 Running pre-flight checks..."
echo ""

# Check Python syntax
echo -n "Checking Python syntax... "
if python3 -c "import ast; ast.parse(open('backend/server.py').read())" 2>&1 > /dev/null; then
    print_status 0 "Python syntax valid"
else
    print_status 1 "Python syntax errors found"
    exit 1
fi

# Check JSON files
echo -n "Checking vercel.json files... "
if python3 -c "import json; json.load(open('backend/vercel.json')); json.load(open('vercel.json'))" 2>&1 > /dev/null; then
    print_status 0 "vercel.json files valid"
else
    print_status 1 "Invalid vercel.json files"
    exit 1
fi

# Check required files
echo -n "Checking required files... "
if [ -f "backend/server.py" ] && [ -f "backend/requirements.txt" ] && [ -f "frontend/package.json" ]; then
    print_status 0 "Required files present"
else
    print_status 1 "Missing required files"
    exit 1
fi

echo ""
echo "✅ All pre-flight checks passed!"
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Authenticate
echo "🔐 Authenticating with Vercel..."
if ! $VERCEL_CMD whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN" 2>&1
fi
print_status 0 "Authenticated"

echo ""
echo "📦 Starting deployment..."
echo ""

# Deploy backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

# Link project if needed
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking backend project..."
    echo "y" | $VERCEL_CMD link --token "$VERCEL_TOKEN" 2>&1 || true
fi

# Deploy
echo "🚀 Deploying to production..."
DEPLOY_OUTPUT=$($VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes 2>&1)
BACKEND_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -n "$BACKEND_URL" ]; then
    echo -e "${GREEN}✅ Backend deployed: $BACKEND_URL${NC}"
    echo "BACKEND_URL=$BACKEND_URL" >> ../.deployment-info
else
    echo -e "${YELLOW}⚠️  Could not extract backend URL from output${NC}"
    echo "$DEPLOY_OUTPUT"
fi

cd ..

echo ""

# Deploy frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Deploying Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

# Link project if needed
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking frontend project..."
    echo "y" | $VERCEL_CMD link --token "$VERCEL_TOKEN" 2>&1 || true
fi

# Deploy
echo "🚀 Deploying to production..."
DEPLOY_OUTPUT=$($VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes 2>&1)
FRONTEND_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1)

if [ -n "$FRONTEND_URL" ]; then
    echo -e "${GREEN}✅ Frontend deployed: $FRONTEND_URL${NC}"
    echo "FRONTEND_URL=$FRONTEND_URL" >> ../.deployment-info
else
    echo -e "${YELLOW}⚠️  Could not extract frontend URL from output${NC}"
    echo "$DEPLOY_OUTPUT"
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test endpoints
if [ -n "$BACKEND_URL" ]; then
    echo "🧪 Testing backend health endpoint..."
    sleep 5  # Wait for deployment to stabilize
    
    if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check failed (may need more time)${NC}"
        echo "   Try: curl $BACKEND_URL/api/health"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Test endpoints: curl $BACKEND_URL/api/health"
echo "3. Check deployment logs in Vercel dashboard"
echo ""

if [ -f ".deployment-info" ]; then
    echo "📝 Deployment URLs saved to .deployment-info"
    cat .deployment-info
fi
