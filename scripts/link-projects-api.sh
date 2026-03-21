#!/bin/bash
# Link Vercel Projects using API
# Creates projects if needed, then links them

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"

echo "🔗 Linking Vercel Projects via API"
echo "==================================="
echo ""

# Get user/team info
echo "1. Getting account information..."
ACCOUNT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user)
USER_ID=$(echo "$ACCOUNT_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id', ''))" 2>/dev/null || echo "")
TEAM_ID=$(echo "$ACCOUNT_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('username', ''))" 2>/dev/null || echo "")

if [ -z "$USER_ID" ]; then
    echo "❌ Could not get account info"
    exit 1
fi

echo "✅ Account: $TEAM_ID"
echo ""

# Function to create or get project
create_or_get_project() {
    local PROJECT_NAME=$1
    local PROJECT_DIR=$2
    
    echo "📦 Creating/Getting project: $PROJECT_NAME"
    
    # Check if project exists
    PROJECTS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects")
    PROJECT_ID=$(echo "$PROJECTS" | python3 -c "
import sys, json
projects = json.load(sys.stdin).get('projects', [])
for p in projects:
    if p.get('name') == '$PROJECT_NAME':
        print(p.get('id'))
        break
" 2>/dev/null || echo "")
    
    if [ -n "$PROJECT_ID" ]; then
        echo "✅ Project exists: $PROJECT_ID"
    else
        # Create project
        echo "Creating new project..."
        CREATE_RESPONSE=$(curl -s -X POST \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$PROJECT_NAME\"}" \
            "https://api.vercel.com/v9/projects")
        
        PROJECT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
        
        if [ -z "$PROJECT_ID" ]; then
            echo "❌ Failed to create project"
            echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
            return 1
        fi
        
        echo "✅ Project created: $PROJECT_ID"
    fi
    
    # Create .vercel directory and project.json
    mkdir -p "$PROJECT_DIR/.vercel"
    
    # Get org ID (use user ID as fallback)
    ORG_ID=$(echo "$ACCOUNT_INFO" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('id', ''))" 2>/dev/null || echo "$USER_ID")
    
    # Write project.json
    cat > "$PROJECT_DIR/.vercel/project.json" <<EOF
{
  "projectId": "$PROJECT_ID",
  "orgId": "$ORG_ID"
}
EOF
    
    echo "✅ Linked to: $PROJECT_DIR/.vercel/project.json"
    echo ""
    
    echo "$PROJECT_ID"
}

# Link backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Backend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PROJECT_ID=$(create_or_get_project "odinring-backend" "backend")
echo "Backend Project ID: $BACKEND_PROJECT_ID"

echo ""

# Link frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Frontend Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_PROJECT_ID=$(create_or_get_project "odinring-frontend" "frontend")
echo "Frontend Project ID: $FRONTEND_PROJECT_ID"

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Projects Linked!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend:"
echo "  Project ID: $BACKEND_PROJECT_ID"
echo "  Config: backend/.vercel/project.json"
echo ""
echo "Frontend:"
echo "  Project ID: $FRONTEND_PROJECT_ID"
echo "  Config: frontend/.vercel/project.json"
echo ""
echo "📋 Next: Set environment variables and deploy"
echo ""
