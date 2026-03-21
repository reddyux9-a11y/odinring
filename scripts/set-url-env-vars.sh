#!/bin/bash
# Set URL-Based Environment Variables
# Run after successful deployment to set CORS_ORIGINS, FRONTEND_URL, BACKEND_URL

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"
API_BASE="https://api.vercel.com"

# Get URLs
BACKEND_URL="${BACKEND_URL:-https://odinring-backend.vercel.app}"
FRONTEND_URL="${FRONTEND_URL:-https://odinring-frontend-2rwt2stpp-odin-rings-projects.vercel.app}"

echo "⚙️  Setting URL-Based Environment Variables"
echo "==========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

cd backend

if [ ! -f ".vercel/project.json" ]; then
    echo "❌ Backend project not linked!"
    exit 1
fi

BACKEND_PROJECT_ID=$(cat .vercel/project.json | python3 -c "import sys, json; print(json.load(sys.stdin).get('projectId', ''))" 2>/dev/null || echo "")

if [ -z "$BACKEND_PROJECT_ID" ]; then
    echo "❌ Could not get backend project ID"
    exit 1
fi

echo "Backend Project ID: $BACKEND_PROJECT_ID"
echo ""

# Function to add/update env var
set_env_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=${3:-production}
    
    echo "Setting $VAR_NAME ($ENV_TYPE) = $VAR_VALUE"
    
    # Try to create
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$VAR_NAME\",\"value\":\"$VAR_VALUE\",\"target\":[\"$ENV_TYPE\"],\"type\":\"encrypted\"}" \
        "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env")
    
    ERROR=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', {}).get('code', ''))" 2>/dev/null || echo "")
    
    if [ "$ERROR" = "conflict" ] || [ "$ERROR" = "ENV_CONFLICT" ]; then
        echo "  (already exists, updating...)"
        # Get env var ID
        ENV_ID=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
            "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env" | \
            python3 -c "
import sys, json
envs = json.load(sys.stdin).get('envs', [])
for e in envs:
    if e.get('key') == '$VAR_NAME' and '$ENV_TYPE' in e.get('target', []):
        print(e.get('id', ''))
        break
" 2>/dev/null || echo "")
        
        if [ -n "$ENV_ID" ]; then
            curl -s -X PATCH \
                -H "Authorization: Bearer $VERCEL_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{\"value\":\"$VAR_VALUE\",\"target\":[\"$ENV_TYPE\"]}" \
                "$API_BASE/v10/projects/$BACKEND_PROJECT_ID/env/$ENV_ID" > /dev/null
            echo "  ✅ Updated"
        else
            echo "  ⚠️  Could not find env var to update"
        fi
    elif [ -n "$ERROR" ]; then
        echo "  ⚠️  Error: $ERROR"
    else
        echo "  ✅ Set"
    fi
}

# Set URL-based variables
set_env_var "CORS_ORIGINS" "$FRONTEND_URL" "production"
set_env_var "FRONTEND_URL" "$FRONTEND_URL" "production"
set_env_var "BACKEND_URL" "$BACKEND_URL" "production"

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ URL-Based Environment Variables Set!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next: Redeploy backend to apply new environment variables"
echo "   cd backend && npx vercel@latest --prod --token \"$VERCEL_TOKEN\""
echo ""
