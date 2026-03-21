#!/bin/bash
# Generate JWT_SECRET for OdinRing

echo "🔐 Generating JWT_SECRET for OdinRing"
echo "======================================"
echo ""

# Check if openssl is available
if command -v openssl &> /dev/null; then
    echo "✅ Using OpenSSL to generate secure random secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    echo ""
    echo "📋 Your JWT_SECRET (copy this value):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$JWT_SECRET"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Length: ${#JWT_SECRET} characters (minimum required: 32)"
    echo ""
    echo "💡 Copy this value and set it in Vercel as:"
    echo "   Variable Name: JWT_SECRET"
    echo "   Value: $JWT_SECRET"
    echo ""
    
    # Optionally save to clipboard (macOS)
    if command -v pbcopy &> /dev/null; then
        echo "$JWT_SECRET" | pbcopy
        echo "📋 Secret copied to clipboard (macOS)"
    fi
    
elif command -v python3 &> /dev/null; then
    echo "✅ Using Python to generate secure random secret..."
    JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    echo ""
    echo "📋 Your JWT_SECRET (copy this value):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$JWT_SECRET"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Length: ${#JWT_SECRET} characters (minimum required: 32)"
    echo ""
    
    # Optionally save to clipboard (macOS)
    if command -v pbcopy &> /dev/null; then
        echo "$JWT_SECRET" | pbcopy
        echo "📋 Secret copied to clipboard (macOS)"
    fi
    
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js to generate secure random secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo ""
    echo "📋 Your JWT_SECRET (copy this value):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$JWT_SECRET"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Length: ${#JWT_SECRET} characters (minimum required: 32)"
    echo ""
    
    # Optionally save to clipboard (macOS)
    if command -v pbcopy &> /dev/null; then
        echo "$JWT_SECRET" | pbcopy
        echo "📋 Secret copied to clipboard (macOS)"
    fi
    
else
    echo "❌ No suitable tool found (openssl, python3, or node)"
    echo ""
    echo "Please install one of:"
    echo "  - OpenSSL: brew install openssl (macOS)"
    echo "  - Python 3: Already installed on most systems"
    echo "  - Node.js: brew install node (macOS)"
    exit 1
fi

echo ""
echo "🔒 Security Notes:"
echo "  - Keep this secret secure and never commit it to git"
echo "  - Use different secrets for development and production"
echo "  - Store it in Vercel environment variables (not in code)"
echo ""
