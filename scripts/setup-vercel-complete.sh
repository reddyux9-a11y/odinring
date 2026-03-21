#!/bin/bash
# Complete Vercel Setup: Link Projects + Set Environment Variables
# Automated setup using Vercel API

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

echo "🚀 Complete Vercel Setup"
echo "========================"
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Step 1: Link Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Linking Backend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Backend already linked"
    BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "   Project ID: $BACKEND_PROJECT_ID"
else
    echo "🔗 Linking backend..."
    echo ""
    echo "⚠️  This requires interactive input. Please:"
    echo "   1. Choose 'Create new project'"
    echo "   2. Name it: odinring-backend"
    echo "   3. Press Enter for defaults"
    echo ""
    
    $VERCEL_CMD link --token "$VERCEL_TOKEN" || {
        echo ""
        echo "❌ Linking failed. Please run manually:"
        echo "   cd backend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        cd ..
        exit 1
    }
    
    BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "✅ Backend linked: $BACKEND_PROJECT_ID"
fi

cd ..

echo ""

# Step 2: Link Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Linking Frontend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Frontend already linked"
    FRONTEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "   Project ID: $FRONTEND_PROJECT_ID"
else
    echo "🔗 Linking frontend..."
    echo ""
    echo "⚠️  This requires interactive input. Please:"
    echo "   1. Choose 'Create new project'"
    echo "   2. Name it: odinring-frontend"
    echo "   3. Press Enter for defaults"
    echo ""
    
    $VERCEL_CMD link --token "$VERCEL_TOKEN" || {
        echo ""
        echo "❌ Linking failed. Please run manually:"
        echo "   cd frontend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        cd ..
        exit 1
    }
    
    FRONTEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "✅ Frontend linked: $FRONTEND_PROJECT_ID"
fi

cd ..

echo ""

# Step 3: Deploy to get URLs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Deploying to Get URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Deploy backend
echo "📦 Deploying backend..."
cd backend
BACKEND_DEPLOY=$(echo "y" | $VERCEL_CMD --prod --token "$VERCEL_TOKEN" 2>&1 | tee /tmp/backend-deploy.log)
BACKEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/backend-deploy.log | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    # Try to extract from deployment output
    BACKEND_URL=$(echo "$BACKEND_DEPLOY" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")
fi

if [ -n "$BACKEND_URL" ]; then
    echo "✅ Backend deployed: $BACKEND_URL"
else
    echo "⚠️  Backend deployment may have succeeded, but URL not extracted"
    echo "   Check Vercel dashboard for URL"
fi

cd ..

echo ""

# Deploy frontend
echo "📦 Deploying frontend..."
cd frontend
FRONTEND_DEPLOY=$(echo "y" | $VERCEL_CMD --prod --token "$VERCEL_TOKEN" 2>&1 | tee /tmp/frontend-deploy.log)
FRONTEND_URL=$(grep -o 'https://[^ ]*\.vercel\.app' /tmp/frontend-deploy.log | head -1 || echo "")

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(echo "$FRONTEND_DEPLOY" | grep -o 'https://[^ ]*\.vercel\.app' | head -1 || echo "")
fi

if [ -n "$FRONTEND_URL" ]; then
    echo "✅ Frontend deployed: $FRONTEND_URL"
else
    echo "⚠️  Frontend deployment may have succeeded, but URL not extracted"
    echo "   Check Vercel dashboard for URL"
fi

cd ..

echo ""

# Step 4: Set Environment Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Setting Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate JWT_SECRET if not set
if [ -z "$JWT_SECRET" ]; then
    echo "🔐 Generating JWT_SECRET..."
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "✅ Generated: $JWT_SECRET"
    echo ""
fi

# Firebase values from screenshot
FIREBASE_PROJECT_ID="studio-7743041576-fc16f"
FIREBASE_SERVICE_ACCOUNT_JSON="${FIREBASE_SERVICE_ACCOUNT_JSON:-}"

# Set defaults if URLs not extracted
if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="https://odinring-backend.vercel.app"
    echo "⚠️  Using default backend URL: $BACKEND_URL"
fi

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://odinring-frontend.vercel.app"
    echo "⚠️  Using default frontend URL: $FRONTEND_URL"
fi

# Set backend environment variables
echo "Setting backend environment variables..."
cd backend

# Function to set env var
set_env_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=${3:-production}
    
    echo "  Setting $VAR_NAME for $ENV_TYPE..."
    echo "$VAR_VALUE" | $VERCEL_CMD env add "$VAR_NAME" "$ENV_TYPE" --token "$VERCEL_TOKEN" <<< "$VAR_VALUE" 2>&1 | grep -v "Enter" || true
}

# Set all backend env vars
set_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "production"
set_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "preview"
set_env_var "FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID" "development"

set_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "production"
set_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "preview"
set_env_var "FIREBASE_SERVICE_ACCOUNT_JSON" "$FIREBASE_SERVICE_ACCOUNT_JSON" "development"

set_env_var "JWT_SECRET" "$JWT_SECRET" "production"
set_env_var "JWT_SECRET" "$JWT_SECRET" "preview"
set_env_var "JWT_SECRET" "$JWT_SECRET" "development"

set_env_var "CORS_ORIGINS" "$FRONTEND_URL" "production"
set_env_var "CORS_ORIGINS" "$FRONTEND_URL" "preview"
set_env_var "CORS_ORIGINS" "$FRONTEND_URL" "development"

set_env_var "ENV" "production" "production"
set_env_var "ENV" "preview" "preview"
set_env_var "ENV" "development" "development"

set_env_var "LOG_LEVEL" "INFO" "production"
set_env_var "LOG_LEVEL" "INFO" "preview"
set_env_var "LOG_LEVEL" "DEBUG" "development"

set_env_var "FRONTEND_URL" "$FRONTEND_URL" "production"
set_env_var "FRONTEND_URL" "$FRONTEND_URL" "preview"
set_env_var "FRONTEND_URL" "$FRONTEND_URL" "development"

set_env_var "BACKEND_URL" "$BACKEND_URL" "production"
set_env_var "BACKEND_URL" "$BACKEND_URL" "preview"
set_env_var "BACKEND_URL" "$BACKEND_URL" "development"

cd ..

echo ""
echo "✅ Environment variables set"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend:"
echo "  URL: $BACKEND_URL"
echo "  Project ID: $BACKEND_PROJECT_ID"
echo ""
echo "Frontend:"
echo "  URL: $FRONTEND_URL"
echo "  Project ID: $FRONTEND_PROJECT_ID"
echo ""
echo "📋 Next: Redeploy to apply environment variables"
echo "   cd backend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo "   cd frontend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo ""
