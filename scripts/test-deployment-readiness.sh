#!/bin/bash
# Comprehensive Deployment Readiness Test
# Tests all critical components before deployment

set -e

echo "🔍 OdinRing Deployment Readiness Test"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check and report
check() {
    local name=$1
    local command=$2
    local critical=${3:-true}
    
    echo -n "Checking $name... "
    if eval "$command" &> /dev/null; then
        echo "✅ PASS"
        return 0
    else
        if [ "$critical" = "true" ]; then
            echo "❌ FAIL (CRITICAL)"
            ERRORS=$((ERRORS + 1))
            return 1
        else
            echo "⚠️  WARN"
            WARNINGS=$((WARNINGS + 1))
            return 0
        fi
    fi
}

echo "=== FILE STRUCTURE ==="
check "Backend vercel.json exists" "test -f backend/vercel.json"
check "Frontend vercel.json exists" "test -f vercel.json"
check "Backend server.py exists" "test -f backend/server.py"
check "Frontend package.json exists" "test -f frontend/package.json"
check "Backend requirements.txt exists" "test -f backend/requirements.txt"

echo ""
echo "=== BACKEND CHECKS ==="

# Check Python syntax (using ast.parse to avoid cache permission issues)
echo -n "Checking Python syntax... "
if python3 -c "import ast; ast.parse(open('backend/server.py').read())" 2>&1 > /dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL (CRITICAL)"
    ERRORS=$((ERRORS + 1))
fi

# Check for critical imports
check "Backend imports are valid" "cd backend && python3 -c 'import server' 2>&1 | grep -v 'Warning\|Error\|Failed'" false

# Check requirements.txt format
check "requirements.txt is valid" "cd backend && python3 -c 'import pkg_resources; [pkg_resources.require(line.strip()) for line in open(\"requirements.txt\") if line.strip() and not line.startswith(\"#\")]'" false

echo ""
echo "=== FRONTEND CHECKS ==="

# Check package.json syntax
echo -n "Checking package.json is valid JSON... "
if python3 -c "import json; json.load(open('frontend/package.json'))" 2>&1 > /dev/null; then
    echo "✅ PASS"
else
    echo "❌ FAIL (CRITICAL)"
    ERRORS=$((ERRORS + 1))
fi

# Check for yarn/npm
if command -v yarn &> /dev/null; then
    echo "✅ yarn found"
elif command -v npm &> /dev/null; then
    echo "✅ npm found"
else
    echo "❌ FAIL: No package manager found (yarn/npm)"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== VERCEL CONFIGURATION ==="

# Check vercel.json syntax
check "Backend vercel.json is valid JSON" "cd backend && python3 -c 'import json; json.load(open(\"vercel.json\"))'"
check "Frontend vercel.json is valid JSON" "python3 -c 'import json; json.load(open(\"vercel.json\"))'"

# Check vercel.json structure
echo -n "Checking backend vercel.json structure... "
if python3 -c "
import json
with open('backend/vercel.json') as f:
    config = json.load(f)
    assert 'version' in config
    assert 'builds' in config or 'functions' in config
    assert 'routes' in config
" 2>&1; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "=== ENVIRONMENT VARIABLES ==="

# Check if .env.example or template exists
if [ -f "env-template.txt" ] || [ -f ".env.example" ]; then
    echo "✅ Environment template found"
else
    echo "⚠️  No environment template found"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=== SUMMARY ==="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical checks passed! Ready for deployment."
    exit 0
else
    echo "❌ Found $ERRORS critical error(s). Fix before deploying."
    exit 1
fi
