#!/bin/bash
# Deploy Free Trial Feature to Vercel
# Uses Vercel API to trigger deployments

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"
API_BASE="https://api.vercel.com"

echo "🚀 Deploying Free Trial Feature to Vercel"
echo "=========================================="
echo ""

# Get project IDs (you may need to update these)
BACKEND_PROJECT_ID="prj_JAGHhGR1tYUvCYzsm0vvoWjnHqE4"
FRONTEND_PROJECT_ID="prj_g56cPNlsiAzthwqYN6p0WbO5ha0A"

echo "📦 Triggering Backend Deployment..."
BACKEND_DEPLOY=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"target\":\"production\"}" \
    "$API_BASE/v13/deployments?projectId=$BACKEND_PROJECT_ID&forceNew=1")

BACKEND_DEPLOY_ID=$(echo "$BACKEND_DEPLOY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null || echo "")

if [ -n "$BACKEND_DEPLOY_ID" ]; then
    echo "✅ Backend deployment triggered: $BACKEND_DEPLOY_ID"
    echo "   View at: https://vercel.com/deployments"
else
    echo "⚠️  Backend deployment may have failed"
    echo "   Response: $BACKEND_DEPLOY"
fi

echo ""

echo "📦 Triggering Frontend Deployment..."
FRONTEND_DEPLOY=$(curl -s -X POST \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"target\":\"production\"}" \
    "$API_BASE/v13/deployments?projectId=$FRONTEND_PROJECT_ID&forceNew=1")

FRONTEND_DEPLOY_ID=$(echo "$FRONTEND_DEPLOY" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', ''))" 2>/dev/null || echo "")

if [ -n "$FRONTEND_DEPLOY_ID" ]; then
    echo "✅ Frontend deployment triggered: $FRONTEND_DEPLOY_ID"
    echo "   View at: https://vercel.com/deployments"
else
    echo "⚠️  Frontend deployment may have failed"
    echo "   Response: $FRONTEND_DEPLOY"
fi

echo ""
echo "=========================================="
echo "✅ Deployment requests sent!"
echo ""
echo "📋 Next Steps:"
echo "1. Check deployment status at: https://vercel.com/dashboard"
echo "2. Wait for builds to complete (usually 2-5 minutes)"
echo "3. Test the free trial feature at: https://odinring-frontend.vercel.app/billing/choose-plan"
echo ""
