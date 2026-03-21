#!/bin/bash
# Set Firebase environment variables in Vercel automatically

set -e

VERCEL_TOKEN="${VERCEL_TOKEN:-CytdA0p8Mj0pVsK1Pa1D28jQ}"
FRONTEND_PROJECT_ID="prj_g56cPNlsiAzthwqYN6p0WbO5ha0A"

# Firebase config values (from Firebase Console)
FIREBASE_API_KEY="AIzaSyBQ5u38tm0592eKWXIDHxCDD4IN8Pqz4cs"
FIREBASE_AUTH_DOMAIN="studio-7743041576-fc16f.firebaseapp.com"
FIREBASE_PROJECT_ID="studio-7743041576-fc16f"
FIREBASE_STORAGE_BUCKET="studio-7743041576-fc16f.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="544218567948"
FIREBASE_APP_ID="1:544218567948:web:59374d5038ec7051b32529"

echo "🔥 Setting Firebase Environment Variables in Vercel"
echo "=================================================="
echo ""

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local env_type=${3:-production}  # production, preview, or development
    
    echo "Setting $key for $env_type..."
    
    # Use Vercel API to set environment variable
    # Use "plain" type for Firebase config (not sensitive secrets)
    response=$(curl -s -X POST "https://api.vercel.com/v10/projects/$FRONTEND_PROJECT_ID/env" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"value\": \"$value\",
            \"type\": \"plain\",
            \"target\": [\"production\", \"preview\", \"development\"]
        }" 2>&1)
    
    # Check if variable already exists (conflict)
    if echo "$response" | grep -q "ENV_CONFLICT\|already exists"; then
        echo "  ⚠️  Variable already exists, updating..."
        
        # Get existing variable ID
        env_id=$(curl -s -X GET "https://api.vercel.com/v10/projects/$FRONTEND_PROJECT_ID/env?key=$key" \
            -H "Authorization: Bearer $VERCEL_TOKEN" | \
            python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('envs', [{}])[0].get('id', ''))" 2>/dev/null || echo "")
        
        if [ -n "$env_id" ]; then
            # Update existing variable
            curl -s -X PATCH "https://api.vercel.com/v10/projects/$FRONTEND_PROJECT_ID/env/$env_id" \
                -H "Authorization: Bearer $VERCEL_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                    \"value\": \"$value\",
                    \"type\": \"plain\",
                    \"target\": [\"production\", \"preview\", \"development\"]
                }" > /dev/null
            
            echo "  ✅ Updated $key"
        else
            echo "  ⚠️  Could not update $key (ID not found)"
        fi
    elif echo "$response" | grep -q "error\|Error"; then
        echo "  ❌ Error setting $key: $response"
    else
        echo "  ✅ Set $key"
    fi
}

# Set all Firebase environment variables
set_env_var "REACT_APP_FIREBASE_API_KEY" "$FIREBASE_API_KEY"
set_env_var "REACT_APP_FIREBASE_AUTH_DOMAIN" "$FIREBASE_AUTH_DOMAIN"
set_env_var "REACT_APP_FIREBASE_PROJECT_ID" "$FIREBASE_PROJECT_ID"
set_env_var "REACT_APP_FIREBASE_STORAGE_BUCKET" "$FIREBASE_STORAGE_BUCKET"
set_env_var "REACT_APP_FIREBASE_MESSAGING_SENDER_ID" "$FIREBASE_MESSAGING_SENDER_ID"
set_env_var "REACT_APP_FIREBASE_APP_ID" "$FIREBASE_APP_ID"

echo ""
echo "✅ Firebase environment variables set!"
echo ""
echo "Next steps:"
echo "  1. Redeploy frontend to apply changes"
echo "  2. Test Firebase connection in browser"
echo "  3. Check browser console for any errors"
echo ""
