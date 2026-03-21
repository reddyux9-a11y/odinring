#!/bin/bash
# Quick deployment script using your Vercel token
# Usage: ./scripts/quick-deploy.sh [backend|frontend|both]

set -e

# Your Vercel token
VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

DEPLOY_TARGET="${1:-both}"

echo "🚀 Quick Vercel Deployment"
echo "=========================="
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Login if needed
if ! $VERCEL_CMD whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    echo "🔐 Authenticating with Vercel..."
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN"
fi

echo "✅ Authenticated"
echo ""

# Deploy backend
if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    if [ -d "backend" ]; then
        echo "📦 Deploying Backend..."
        cd backend
        $VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes
        cd ..
        echo "✅ Backend deployed"
        echo ""
    fi
fi

# Deploy frontend
if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    if [ -d "frontend" ]; then
        echo "📦 Deploying Frontend..."
        cd frontend
        $VERCEL_CMD --prod --token "$VERCEL_TOKEN" --yes
        cd ..
        echo "✅ Frontend deployed"
        echo ""
    fi
fi

echo "✅ Deployment complete!"
