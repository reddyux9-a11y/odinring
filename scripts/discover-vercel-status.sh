#!/bin/bash
# Discover Current Vercel Deployment Status
# Maps what's actually deployed and configured

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🔍 Discovering Vercel Deployment Status"
echo "========================================"
echo ""

# Use npx if vercel not found globally
if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
else
    VERCEL_CMD="npx vercel@latest"
fi

# Test authentication
echo "1. Testing Authentication..."
if $VERCEL_CMD whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    USER_INFO=$($VERCEL_CMD whoami --token "$VERCEL_TOKEN" 2>&1)
    echo "   ✅ Authenticated as: $USER_INFO"
else
    echo "   ⚠️  Not authenticated, attempting login..."
    echo "$VERCEL_TOKEN" | $VERCEL_CMD login --token "$VERCEL_TOKEN" 2>&1 || true
fi

echo ""

# List projects
echo "2. Listing Vercel Projects..."
echo "   (This may take a moment...)"
echo ""

PROJECTS_OUTPUT=$($VERCEL_CMD ls --token "$VERCEL_TOKEN" 2>&1 || echo "ERROR")

if echo "$PROJECTS_OUTPUT" | grep -q "ERROR\|error\|Error"; then
    echo "   ⚠️  Could not list projects (may need to link first)"
    echo "   Output: $PROJECTS_OUTPUT"
else
    echo "$PROJECTS_OUTPUT"
    echo ""
    echo "   📋 Projects found above"
fi

echo ""

# Check backend project
echo "3. Checking Backend Project Status..."
cd backend 2>/dev/null || { echo "   ❌ backend/ directory not found"; exit 1; }

if [ -f ".vercel/project.json" ]; then
    echo "   ✅ Backend project is linked"
    echo "   Project Info:"
    cat .vercel/project.json | python3 -m json.tool 2>/dev/null || cat .vercel/project.json
    echo ""
    
    # Get project details
    PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
    ORG_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('orgId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
    
    echo "   Project ID: $PROJECT_ID"
    echo "   Org ID: $ORG_ID"
    
    # Check deployments
    echo ""
    echo "   Recent Deployments:"
    $VERCEL_CMD ls --token "$VERCEL_TOKEN" 2>&1 | head -5 || echo "   (Could not list deployments)"
else
    echo "   ⚠️  Backend project not linked"
    echo "   Run: cd backend && $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
fi

cd ..

echo ""

# Check frontend project
echo "4. Checking Frontend Project Status..."
if [ -d "frontend" ]; then
    cd frontend
    
    if [ -f ".vercel/project.json" ]; then
        echo "   ✅ Frontend project is linked"
        echo "   Project Info:"
        cat .vercel/project.json | python3 -m json.tool 2>/dev/null || cat .vercel/project.json
        echo ""
        
        PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
        ORG_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('orgId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
        
        echo "   Project ID: $PROJECT_ID"
        echo "   Org ID: $ORG_ID"
    else
        echo "   ⚠️  Frontend project not linked"
        echo "   Run: cd frontend && $VERCEL_CMD link --token \"$VERCEL_TOKEN\""
    fi
    
    cd ..
else
    echo "   ❌ frontend/ directory not found"
fi

echo ""

# Check environment variables (if projects are linked)
echo "5. Checking Environment Variables..."
echo "   (Note: This requires project to be linked)"
echo ""

if [ -f "backend/.vercel/project.json" ]; then
    echo "   Backend Environment Variables:"
    cd backend
    $VERCEL_CMD env ls production --token "$VERCEL_TOKEN" 2>&1 | head -20 || echo "   (Could not list - may need to link project)"
    cd ..
else
    echo "   ⚠️  Backend not linked - cannot check env vars"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STATUS SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "backend/.vercel/project.json" ]; then
    echo "✅ Backend: Linked to Vercel"
else
    echo "❌ Backend: Not linked"
fi

if [ -f "frontend/.vercel/project.json" ]; then
    echo "✅ Frontend: Linked to Vercel"
else
    echo "❌ Frontend: Not linked"
fi

echo ""
echo "📋 Next Steps:"
echo "1. If projects not linked, run: ./scripts/link-vercel-projects.sh"
echo "2. Set environment variables: ./scripts/setup-vercel-env-npx.sh"
echo "3. Deploy: ./scripts/quick-deploy.sh"
echo ""
