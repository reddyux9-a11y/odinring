#!/bin/bash
# Automated Vercel Deployment Script
# Uses Vercel API token for automated deployments

set -e

echo "🚀 OdinRing Automated Vercel Deployment"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "   Install with: npm i -g vercel"
    echo "   Or use npx: npx vercel@latest"
    exit 1
fi

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Check for Vercel token
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️  VERCEL_TOKEN not set in environment"
    echo ""
    echo "Set it with:"
    echo "  export VERCEL_TOKEN='your-token-here'"
    echo ""
    echo "Or add to your shell profile (~/.zshrc or ~/.bash_profile):"
    echo "  export VERCEL_TOKEN='your-token-here'"
    echo ""
    read -p "Enter Vercel token now (or press Enter to skip): " token_input
    if [ -n "$token_input" ]; then
        export VERCEL_TOKEN="$token_input"
    else
        echo "❌ Vercel token required for automated deployment"
        exit 1
    fi
fi

echo "✅ Vercel token found"
echo ""

# Check if logged in
if ! $VERCEL_CMD whoami &> /dev/null; then
    echo "🔐 Logging in to Vercel..."
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN"
fi

echo "✅ Authenticated with Vercel"
echo ""

# Ask for deployment type
echo "Select deployment type:"
echo "1. Production (--prod)"
echo "2. Preview (default)"
read -p "Enter choice [1-2] (default: 2): " deploy_type

if [ "$deploy_type" = "1" ]; then
    DEPLOY_FLAG="--prod"
    echo "🚀 Deploying to PRODUCTION..."
else
    DEPLOY_FLAG=""
    echo "🚀 Deploying to PREVIEW..."
fi

echo ""

# Deploy backend
if [ -d "backend" ]; then
    echo "📦 Deploying Backend..."
    cd backend
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        echo "🔗 Linking project to Vercel..."
        $VERCEL_CMD link --yes --token "$VERCEL_TOKEN"
    fi
    
    echo "🚀 Deploying backend..."
    $VERCEL_CMD deploy $DEPLOY_FLAG --token "$VERCEL_TOKEN"
    
    cd ..
    echo "✅ Backend deployed"
    echo ""
fi

# Deploy frontend
if [ -d "frontend" ]; then
    echo "📦 Deploying Frontend..."
    cd frontend
    
    # Check if project is linked
    if [ ! -f ".vercel/project.json" ]; then
        echo "🔗 Linking project to Vercel..."
        $VERCEL_CMD link --yes --token "$VERCEL_TOKEN"
    fi
    
    echo "🚀 Deploying frontend..."
    $VERCEL_CMD deploy $DEPLOY_FLAG --token "$VERCEL_TOKEN"
    
    cd ..
    echo "✅ Frontend deployed"
    echo ""
fi

echo "========================================"
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Check deployment status in Vercel dashboard"
echo "2. Test your endpoints"
echo "3. Verify environment variables are set"
echo ""
