#!/bin/bash
# Step-by-step linking and environment variable setup
# Uses Vercel CLI with clear instructions

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-}"

echo "🔗 Link Projects & Set Environment Variables"
echo "============================================="
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

# Step 1: Link Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Link Backend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Backend already linked"
    BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "   Project ID: $BACKEND_PROJECT_ID"
else
    echo "⚠️  Backend not linked. Please run:"
    echo ""
    echo "   cd backend"
    echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    echo ""
    echo "   When prompted:"
    echo "   1. Select 'Create new project'"
    echo "   2. Name: odinring-backend"
    echo "   3. Press Enter for all other defaults"
    echo ""
    echo "Press Enter when done, or Ctrl+C to exit..."
    read
    
    if [ ! -f ".vercel/project.json" ]; then
        echo "❌ Backend still not linked. Please run the command above."
        cd ..
        exit 1
    fi
    
    BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "✅ Backend linked: $BACKEND_PROJECT_ID"
fi

cd ..

echo ""

# Step 2: Link Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Link Frontend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Frontend already linked"
    FRONTEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "   Project ID: $FRONTEND_PROJECT_ID"
else
    echo "⚠️  Frontend not linked. Please run:"
    echo ""
    echo "   cd frontend"
    echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    echo ""
    echo "   When prompted:"
    echo "   1. Select 'Create new project'"
    echo "   2. Name: odinring-frontend"
    echo "   3. Press Enter for all other defaults"
    echo ""
    echo "Press Enter when done, or Ctrl+C to exit..."
    read
    
    if [ ! -f ".vercel/project.json" ]; then
        echo "❌ Frontend still not linked. Please run the command above."
        cd ..
        exit 1
    fi
    
    FRONTEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")
    echo "✅ Frontend linked: $FRONTEND_PROJECT_ID"
fi

cd ..

echo ""

# Step 3: Set Environment Variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Set Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate JWT_SECRET
echo "🔐 Generating JWT_SECRET..."
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ Generated: $JWT_SECRET"
echo ""

# Firebase values
FIREBASE_PROJECT_ID="studio-7743041576-fc16f"
FIREBASE_SERVICE_ACCOUNT_JSON="${FIREBASE_SERVICE_ACCOUNT_JSON:-}"

echo "Setting backend environment variables..."
cd backend

# Set variables using Vercel CLI
echo "FIREBASE_PROJECT_ID" | $VERCEL_CMD env add production --token "$VERCEL_TOKEN" <<< "$FIREBASE_PROJECT_ID" 2>&1 | tail -1 || echo "  (may already exist)"
echo "FIREBASE_SERVICE_ACCOUNT_JSON" | $VERCEL_CMD env add production --token "$VERCEL_TOKEN" <<< "$FIREBASE_SERVICE_ACCOUNT_JSON" 2>&1 | tail -1 || echo "  (may already exist)"
echo "JWT_SECRET" | $VERCEL_CMD env add production --token "$VERCEL_TOKEN" <<< "$JWT_SECRET" 2>&1 | tail -1 || echo "  (may already exist)"
echo "ENV" | $VERCEL_CMD env add production --token "$VERCEL_TOKEN" <<< "production" 2>&1 | tail -1 || echo "  (may already exist)"
echo "LOG_LEVEL" | $VERCEL_CMD env add production --token "$VERCEL_TOKEN" <<< "INFO" 2>&1 | tail -1 || echo "  (may already exist)"

# These will be set after first deployment
echo "⚠️  Note: CORS_ORIGINS, FRONTEND_URL, and BACKEND_URL will be set after first deployment"
echo "   (We need the deployment URLs first)"

cd ..

echo ""
echo "✅ Environment variables set for backend"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy backend: cd backend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo "2. Deploy frontend: cd frontend && $VERCEL_CMD --prod --token \"$VERCEL_TOKEN\""
echo "3. Get deployment URLs from Vercel dashboard"
echo "4. Set remaining env vars (CORS_ORIGINS, FRONTEND_URL, BACKEND_URL)"
echo "5. Redeploy both projects"
echo ""
