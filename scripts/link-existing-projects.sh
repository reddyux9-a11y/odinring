#!/bin/bash
# Link to Existing Vercel Projects
# Gets project IDs and links them

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"
API_BASE="https://api.vercel.com"

echo "🔗 Linking to Existing Projects"
echo "==============================="
echo ""

# Get account info
ACCOUNT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v2/user")
ORG_ID=$(echo "$ACCOUNT_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null || echo "")

# Get projects
PROJECTS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_BASE/v9/projects")

# Get backend project
BACKEND_PROJECT_ID=$(echo "$PROJECTS" | python3 -c "
import sys, json
projects = json.load(sys.stdin).get('projects', [])
for p in projects:
    if p.get('name') == 'odinring-backend':
        print(p.get('id'))
        break
" 2>/dev/null || echo "")

# Get frontend project
FRONTEND_PROJECT_ID=$(echo "$PROJECTS" | python3 -c "
import sys, json
projects = json.load(sys.stdin).get('projects', [])
for p in projects:
    if p.get('name') == 'odinring-frontend':
        print(p.get('id'))
        break
" 2>/dev/null || echo "")

# Link backend
if [ -n "$BACKEND_PROJECT_ID" ]; then
    echo "✅ Found backend project: $BACKEND_PROJECT_ID"
    mkdir -p backend/.vercel
    cat > backend/.vercel/project.json <<EOF
{
  "projectId": "$BACKEND_PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF
    echo "✅ Backend linked"
else
    echo "❌ Backend project not found"
fi

echo ""

# Link frontend
if [ -n "$FRONTEND_PROJECT_ID" ]; then
    echo "✅ Found frontend project: $FRONTEND_PROJECT_ID"
    mkdir -p frontend/.vercel
    cat > frontend/.vercel/project.json <<EOF
{
  "projectId": "$FRONTEND_PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF
    echo "✅ Frontend linked"
else
    echo "❌ Frontend project not found"
fi

echo ""

if [ -n "$BACKEND_PROJECT_ID" ] && [ -n "$FRONTEND_PROJECT_ID" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Projects Linked!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Backend Project ID: $BACKEND_PROJECT_ID"
    echo "Frontend Project ID: $FRONTEND_PROJECT_ID"
    echo ""
    echo "📋 Next: Set environment variables and deploy"
    echo ""
else
    echo "❌ Could not link all projects"
    exit 1
fi
