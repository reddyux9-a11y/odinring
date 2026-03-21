#!/bin/bash
# Script to check and fix chat API security issues
# Run this before deploying any chat-related features

echo "🔒 Chat API Security Check"
echo "=========================="
echo ""

# Check if api/chat/route.ts exists
if [ -f "api/chat/route.ts" ] || [ -f "app/api/chat/route.ts" ] || [ -f "pages/api/chat/route.ts" ]; then
    echo "⚠️  Chat API route found!"
    echo ""
    
    # Find the file
    CHAT_FILE=$(find . -name "route.ts" -path "*/chat/*" 2>/dev/null | head -1)
    
    if [ -n "$CHAT_FILE" ]; then
        echo "📄 Found: $CHAT_FILE"
        echo ""
        
        # Check for security issues
        echo "🔍 Checking for security vulnerabilities..."
        echo ""
        
        # Check 1: Authentication check
        if grep -q "getServerSession\|getSession\|authenticate" "$CHAT_FILE"; then
            echo "✅ Authentication check found"
        else
            echo "❌ MISSING: Authentication check"
            echo "   Add: const session = await getServerSession();"
        fi
        
        # Check 2: User ID validation
        if grep -q "req\.user\.id\|session\.user\.id" "$CHAT_FILE"; then
            echo "✅ User ID from authenticated source found"
        else
            echo "❌ WARNING: May be using userId from request body"
        fi
        
        # Check 3: Authorization check
        if grep -q "userId.*!==.*user\.id\|userId.*!=.*user\.id" "$CHAT_FILE"; then
            echo "⚠️  Found userId comparison - verify it's correct"
        else
            echo "❌ MISSING: Authorization check"
        fi
        
        echo ""
        echo "📋 See CHAT_API_SECURITY_FIX.md for the correct implementation"
    fi
else
    echo "ℹ️  No chat API route found in current codebase"
    echo "   (May be in a PR branch)"
    echo ""
    echo "📋 If adding chat API, follow the security pattern in:"
    echo "   CHAT_API_SECURITY_FIX.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Security check complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
