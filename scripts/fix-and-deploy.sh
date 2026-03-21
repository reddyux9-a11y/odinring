#!/bin/bash
# Complete Fix and Deploy Script
# Removes stale .vercel directories and properly links/deploys

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🔧 Complete Fix and Deploy"
echo "=========================="
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Authenticate
echo "🔐 Authenticating..."
if ! $VERCEL_CMD whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN" 2>&1
fi
echo "✅ Authenticated"
echo ""

# Fix: Remove stale .vercel directory at root (causing issues)
if [ -d ".vercel" ] && [ ! -f ".vercel/project.json" ]; then
    echo "🧹 Removing stale .vercel directory..."
    rm -rf .vercel
    echo "✅ Removed"
    echo ""
fi

# Step 1: Link Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Step 1: Linking Backend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

# Remove stale .vercel if exists
if [ -d ".vercel" ] && [ ! -f ".vercel/project.json" ]; then
    echo "🧹 Removing stale backend .vercel directory..."
    rm -rf .vercel
fi

# Link project
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking backend to Vercel..."
    echo ""
    echo "Options:"
    echo "  1. Link to existing project (if you have one)"
    echo "  2. Create new project (recommended for first time)"
    echo ""
    
    # Try to link (will prompt interactively)
    $VERCEL_CMD link --token "$VERCEL_TOKEN" 2>&1 || {
        echo ""
        echo "⚠️  Linking requires interaction. Please run:"
        echo "   cd backend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        echo ""
        echo "Then choose: Create new project (recommended)"
        cd ..
        exit 1
    }
    
    echo "✅ Backend linked"
else
    echo "✅ Backend already linked"
    cat .vercel/project.json | python3 -m json.tool 2>/dev/null || echo "   (project info available)"
fi

cd ..

echo ""

# Step 2: Link Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Step 2: Linking Frontend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

# Remove stale .vercel if exists
if [ -d ".vercel" ] && [ ! -f ".vercel/project.json" ]; then
    echo "🧹 Removing stale frontend .vercel directory..."
    rm -rf .vercel
fi

# Link project
if [ ! -f ".vercel/project.json" ]; then
    echo "🔗 Linking frontend to Vercel..."
    echo ""
    echo "Options:"
    echo "  1. Link to existing project (if you have one)"
    echo "  2. Create new project (recommended for first time)"
    echo ""
    
    $VERCEL_CMD link --token "$VERCEL_TOKEN" 2>&1 || {
        echo ""
        echo "⚠️  Linking requires interaction. Please run:"
        echo "   cd frontend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        echo ""
        echo "Then choose: Create new project (recommended)"
        cd ..
        exit 1
    }
    
    echo "✅ Frontend linked"
else
    echo "✅ Frontend already linked"
    cat .vercel/project.json | python3 -m json.tool 2>/dev/null || echo "   (project info available)"
fi

cd ..

echo ""

# Step 3: Set Environment Variables (if not set)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Step 3: Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Set environment variables before deploying!"
echo ""
echo "Run: ./scripts/setup-vercel-env-npx.sh"
echo ""
read -p "Have you set environment variables? (y/n): " env_set

if [ "$env_set" != "y" ] && [ "$env_set" != "Y" ]; then
    echo ""
    echo "⚠️  Please set environment variables first:"
    echo "   ./scripts/setup-vercel-env-npx.sh"
    echo ""
    echo "Required variables:"
    echo "  - FIREBASE_PROJECT_ID"
    echo "  - FIREBASE_SERVICE_ACCOUNT_JSON"
    echo "  - JWT_SECRET"
    echo "  - CORS_ORIGINS"
    echo "  - ENV=production"
    echo "  - LOG_LEVEL=INFO"
    echo "  - FRONTEND_URL"
    echo "  - BACKEND_URL"
    echo ""
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Step 4: Deploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Step 4: Deploying to Production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy backend
echo "📦 Deploying Backend..."
cd backend
BACKEND_OUTPUT=$($VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes 2>&1)
BACKEND_URL=$(echo "$BACKEND_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")

if [ -n "$BACKEND_URL" ]; then
    echo "✅ Backend deployed: $BACKEND_URL"
    echo "BACKEND_URL=$BACKEND_URL" > ../.deployment-urls
else
    echo "⚠️  Deployment completed (URL extraction may have failed)"
    echo "$BACKEND_OUTPUT" | tail -10
fi

cd ..

echo ""

# Deploy frontend
echo "📦 Deploying Frontend..."
cd frontend
FRONTEND_OUTPUT=$($VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes 2>&1)
FRONTEND_URL=$(echo "$FRONTEND_OUTPUT" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")

if [ -n "$FRONTEND_URL" ]; then
    echo "✅ Frontend deployed: $FRONTEND_URL"
    echo "FRONTEND_URL=$FRONTEND_URL" >> ../.deployment-urls
else
    echo "⚠️  Deployment completed (URL extraction may have failed)"
    echo "$FRONTEND_OUTPUT" | tail -10
fi

cd ..

echo ""

# Step 5: Verify
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Step 5: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".deployment-urls" ]; then
    echo "📋 Deployment URLs:"
    cat .deployment-urls
    echo ""
    
    if [ -n "$BACKEND_URL" ]; then
        echo "🧪 Testing backend health endpoint..."
        sleep 5
        if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "⚠️  Backend health check failed (may need more time)"
            echo "   Try: curl $BACKEND_URL/api/health"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Update environment variables with actual URLs:"
echo "   - BACKEND_URL=$BACKEND_URL"
echo "   - FRONTEND_URL=$FRONTEND_URL"
echo "2. Test endpoints:"
echo "   - curl $BACKEND_URL/api/health"
echo "   - Visit $FRONTEND_URL"
echo ""
