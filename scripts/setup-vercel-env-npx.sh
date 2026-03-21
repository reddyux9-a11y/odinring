#!/bin/bash
# Vercel Environment Variables Setup Script (using npx - no global install needed)
# This script uses npx to run Vercel CLI without requiring global installation

set -e

echo "🔐 OdinRing Vercel Environment Variables Setup (npx version)"
echo "============================================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo "✅ npm found"
echo ""

# Check if logged in (using npx)
echo "🔍 Checking Vercel login status..."
if ! npx vercel@latest whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "   Run: npx vercel@latest login"
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Function to prompt for variable
prompt_variable() {
    local var_name=$1
    local description=$2
    local example=$3
    local is_secret=${4:-false}
    local is_required=${5:-true}
    
    echo ""
    echo "📝 $var_name"
    echo "   Description: $description"
    if [ -n "$example" ]; then
        echo "   Example: $example"
    fi
    
    if [ "$is_secret" = true ]; then
        echo "   ⚠️  This is a secret value - it will be hidden"
    fi
    
    if [ "$is_required" = true ]; then
        echo "   ⚠️  REQUIRED"
    else
        echo "   ℹ️  Optional"
    fi
    
    read -p "   Enter value (or press Enter to skip): " value
    
    if [ -z "$value" ] && [ "$is_required" = true ]; then
        echo "   ❌ This variable is required! Skipping..."
        return 1
    fi
    
    if [ -n "$value" ]; then
        echo "   Setting $var_name..."
        echo "$value" | npx vercel@latest env add "$var_name" production
        echo "   ✅ $var_name set successfully"
        return 0
    else
        echo "   ⏭️  Skipped"
        return 1
    fi
}

echo "🚀 Starting environment variable setup..."
echo ""
echo "This script will prompt you for each required environment variable."
echo "You can skip optional variables by pressing Enter."
echo ""

# Required variables
echo "=== REQUIRED VARIABLES ==="

prompt_variable \
    "FIREBASE_PROJECT_ID" \
    "Your Firebase project ID" \
    "odinring-production" \
    false \
    true

prompt_variable \
    "FIREBASE_SERVICE_ACCOUNT_JSON" \
    "Complete Firebase service account JSON (single line)" \
    '{"type":"service_account",...}' \
    true \
    true

prompt_variable \
    "JWT_SECRET" \
    "Secret key for JWT tokens (min 32 characters)" \
    "$(openssl rand -hex 32 2>/dev/null || echo 'generate-with-openssl-rand-hex-32')" \
    true \
    true

prompt_variable \
    "CORS_ORIGINS" \
    "Comma-separated list of allowed CORS origins" \
    "https://your-frontend.vercel.app" \
    false \
    true

prompt_variable \
    "ENV" \
    "Environment identifier" \
    "production" \
    false \
    true

prompt_variable \
    "LOG_LEVEL" \
    "Logging level (must be INFO or higher)" \
    "INFO" \
    false \
    true

prompt_variable \
    "FRONTEND_URL" \
    "Your frontend application URL" \
    "https://your-frontend.vercel.app" \
    false \
    true

prompt_variable \
    "BACKEND_URL" \
    "Your backend API URL" \
    "https://your-backend.vercel.app" \
    false \
    true

# Optional variables
echo ""
echo "=== OPTIONAL VARIABLES ==="
echo "Press Enter to skip any optional variables"

prompt_variable \
    "STRIPE_SECRET_KEY" \
    "Stripe secret key (if billing enabled)" \
    "sk_live_..." \
    true \
    false

prompt_variable \
    "STRIPE_WEBHOOK_SECRET" \
    "Stripe webhook secret (if billing enabled)" \
    "whsec_..." \
    true \
    false

prompt_variable \
    "STRIPE_PUBLISHABLE_KEY" \
    "Stripe publishable key (if billing enabled)" \
    "pk_live_..." \
    false \
    false

prompt_variable \
    "OPENAI_API_KEY" \
    "OpenAI API key (if AI features enabled)" \
    "sk-..." \
    true \
    false

prompt_variable \
    "ANTHROPIC_API_KEY" \
    "Anthropic API key (if AI features enabled)" \
    "sk-ant-..." \
    true \
    false

prompt_variable \
    "SENTRY_DSN" \
    "Sentry DSN for error tracking (recommended)" \
    "https://...@sentry.io/..." \
    false \
    false

echo ""
echo "============================================================"
echo "✅ Environment variable setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify all variables are set: npx vercel@latest env ls production"
echo "2. Deploy to production: npx vercel@latest --prod"
echo "3. Test health endpoint: curl https://your-backend-url/api/health"
echo ""
echo "💡 For detailed instructions, see: VERCEL_ENV_SETUP_GUIDE.md"
