#!/bin/bash
# Check Vercel API Status and Deployment Information
# Uses Vercel API to get real-time deployment status

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"
API_BASE="https://api.vercel.com"

echo "🔍 Checking Vercel API Status"
echo "=============================="
echo ""

# Test 1: Authentication
echo "1. Testing Authentication..."
AUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v2/user")
HTTP_CODE=$(echo "$AUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    USERNAME=$(echo "$AUTH_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('username', 'unknown'))" 2>/dev/null || echo "unknown")
    USER_ID=$(echo "$AUTH_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', 'unknown'))" 2>/dev/null || echo "unknown")
    echo "   ✅ Authenticated as: $USERNAME (ID: $USER_ID)"
else
    echo "   ❌ Authentication failed (HTTP $HTTP_CODE)"
    echo "   Response: $AUTH_BODY"
    exit 1
fi

echo ""

# Test 2: List Projects
echo "2. Listing Projects..."
PROJECTS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v9/projects")
PROJECTS_HTTP_CODE=$(echo "$PROJECTS_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
PROJECTS_BODY=$(echo "$PROJECTS_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$PROJECTS_HTTP_CODE" = "200" ]; then
    PROJECT_COUNT=$(echo "$PROJECTS_BODY" | python3 -c "import sys, json; projects = json.load(sys.stdin).get('projects', []); print(len(projects))" 2>/dev/null || echo "0")
    echo "   ✅ Found $PROJECT_COUNT project(s)"
    echo ""
    
    if [ "$PROJECT_COUNT" -gt 0 ]; then
        echo "   Projects:"
        echo "$PROJECTS_BODY" | python3 -c "
import sys, json
projects = json.load(sys.stdin).get('projects', [])
for p in projects:
    print(f\"      - {p.get('name', 'unknown')} (ID: {p.get('id', 'unknown')})\")
    print(f\"        Created: {p.get('createdAt', 'unknown')}\")
    print(f\"        Framework: {p.get('framework', 'unknown')}\")
    print(\"\")
" 2>/dev/null || echo "      (Could not parse projects)"
    fi
else
    echo "   ⚠️  Could not list projects (HTTP $PROJECTS_HTTP_CODE)"
    echo "   Response: $PROJECTS_BODY"
fi

echo ""

# Test 3: Check Deployments
echo "3. Checking Recent Deployments..."
DEPLOYMENTS_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v6/deployments?limit=10")
DEPLOYMENTS_HTTP_CODE=$(echo "$DEPLOYMENTS_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
DEPLOYMENTS_BODY=$(echo "$DEPLOYMENTS_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$DEPLOYMENTS_HTTP_CODE" = "200" ]; then
    DEPLOYMENT_COUNT=$(echo "$DEPLOYMENTS_BODY" | python3 -c "import sys, json; deployments = json.load(sys.stdin).get('deployments', []); print(len(deployments))" 2>/dev/null || echo "0")
    echo "   ✅ Found $DEPLOYMENT_COUNT recent deployment(s)"
    echo ""
    
    if [ "$DEPLOYMENT_COUNT" -gt 0 ]; then
        echo "   Recent Deployments:"
        echo "$DEPLOYMENTS_BODY" | python3 -c "
import sys, json
from datetime import datetime
deployments = json.load(sys.stdin).get('deployments', [])
for d in deployments[:5]:
    name = d.get('name', 'unknown')
    url = d.get('url', 'unknown')
    state = d.get('readyState', 'unknown')
    created = d.get('createdAt', 0)
    created_str = datetime.fromtimestamp(created/1000).strftime('%Y-%m-%d %H:%M:%S') if created else 'unknown'
    print(f\"      - {name}\")
    print(f\"        URL: https://{url}\")
    print(f\"        State: {state}\")
    print(f\"        Created: {created_str}\")
    print(\"\")
" 2>/dev/null || echo "      (Could not parse deployments)"
    fi
else
    echo "   ⚠️  Could not list deployments (HTTP $DEPLOYMENTS_HTTP_CODE)"
fi

echo ""

# Test 4: Check CLI Status
echo "4. Checking Vercel CLI Status..."
if command -v vercel &> /dev/null; then
    VERCEL_VERSION=$(vercel --version 2>/dev/null || echo "unknown")
    echo "   ✅ Vercel CLI installed: $VERCEL_VERSION"
    
    # Test CLI authentication
    if vercel whoami --token "$VERCEL_TOKEN" &> /dev/null; then
        CLI_USER=$(vercel whoami --token "$VERCEL_TOKEN" 2>&1)
        echo "   ✅ CLI authenticated: $CLI_USER"
    else
        echo "   ⚠️  CLI authentication failed"
    fi
else
    echo "   ⚠️  Vercel CLI not installed globally"
    echo "   Using npx vercel@latest instead"
    
    if npx vercel@latest whoami --token "$VERCEL_TOKEN" &> /dev/null; then
        CLI_USER=$(npx vercel@latest whoami --token "$VERCEL_TOKEN" 2>&1)
        echo "   ✅ npx vercel authenticated: $CLI_USER"
    else
        echo "   ⚠️  npx vercel authentication failed"
    fi
fi

echo ""

# Test 5: Check Project Linking Status
echo "5. Checking Project Linking Status..."
if [ -f "backend/.vercel/project.json" ]; then
    BACKEND_PROJECT_ID=$(cat backend/.vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
    echo "   ✅ Backend linked: $BACKEND_PROJECT_ID"
else
    echo "   ❌ Backend not linked"
fi

if [ -f "frontend/.vercel/project.json" ]; then
    FRONTEND_PROJECT_ID=$(cat frontend/.vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', 'NOT_FOUND'))" 2>/dev/null || echo "NOT_FOUND")
    echo "   ✅ Frontend linked: $FRONTEND_PROJECT_ID"
else
    echo "   ❌ Frontend not linked"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Status Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "API Status: ✅ Connected"
echo "Authentication: ✅ Valid"
echo "Projects: $PROJECT_COUNT found"
echo "Deployments: $DEPLOYMENT_COUNT recent"
echo ""
echo "📋 Next Steps:"
if [ ! -f "backend/.vercel/project.json" ] || [ ! -f "frontend/.vercel/project.json" ]; then
    echo "1. Link projects: ./scripts/link-and-setup.sh"
fi
echo "2. Set environment variables: ./scripts/setup-env-vars.sh"
echo "3. Deploy: ./scripts/quick-deploy.sh"
echo ""
