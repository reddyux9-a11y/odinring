#!/bin/bash
# Link Vercel Projects
# Links backend and frontend to Vercel projects

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🔗 Linking Vercel Projects"
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

# Link backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Linking Backend Project..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Backend already linked"
    echo "Project Info:"
    cat .vercel/project.json | python3 -m json.tool 2>/dev/null || cat .vercel/project.json
else
    echo "Linking backend to Vercel..."
    echo ""
    echo "When prompted:"
    echo "  - Select 'Link to existing project' or 'Create new project'"
    echo "  - Choose your backend project name"
    echo ""
    
    # Non-interactive linking (will prompt if needed)
    $VERCEL_CMD link --token "$VERCEL_TOKEN" --yes 2>&1 || {
        echo ""
        echo "⚠️  Automatic linking failed. Please run manually:"
        echo "   cd backend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        echo ""
    }
fi

cd ..

echo ""

# Link frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Linking Frontend Project..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd frontend

if [ -f ".vercel/project.json" ]; then
    echo "✅ Frontend already linked"
    echo "Project Info:"
    cat .vercel/project.json | python3 -m json.tool 2>/dev/null || cat .vercel/project.json
else
    echo "Linking frontend to Vercel..."
    echo ""
    echo "When prompted:"
    echo "  - Select 'Link to existing project' or 'Create new project'"
    echo "  - Choose your frontend project name"
    echo ""
    
    $VERCEL_CMD link --token "$VERCEL_TOKEN" --yes 2>&1 || {
        echo ""
        echo "⚠️  Automatic linking failed. Please run manually:"
        echo "   cd frontend"
        echo "   $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
        echo ""
    }
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Linking Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo "1. Set environment variables: ./scripts/setup-vercel-env-npx.sh"
echo "2. Deploy: ./scripts/quick-deploy.sh"
echo ""
