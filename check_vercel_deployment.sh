#!/bin/bash

# Vercel Deployment Diagnostic Script
# Checks common issues that cause 404 errors

echo "🔍 Vercel Deployment Diagnostic"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./check_vercel_deployment.sh https://your-backend.vercel.app${NC}"
    echo ""
    echo "Or set BACKEND_URL environment variable:"
    echo "export BACKEND_URL=https://your-backend.vercel.app"
    echo "./check_vercel_deployment.sh"
    exit 1
fi

BACKEND_URL=${1:-$BACKEND_URL}

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}Error: Backend URL required${NC}"
    exit 1
fi

echo "Testing backend: $BACKEND_URL"
echo ""

# Test 1: Root endpoint
echo "1. Testing root endpoint (/)..."
ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/")
if [ "$ROOT_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Root endpoint working (HTTP $ROOT_RESPONSE)${NC}"
    curl -s "$BACKEND_URL/" | head -c 200
    echo ""
else
    echo -e "${RED}❌ Root endpoint failed (HTTP $ROOT_RESPONSE)${NC}"
fi
echo ""

# Test 2: API root
echo "2. Testing API root (/api/)..."
API_ROOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/")
if [ "$API_ROOT_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API root working (HTTP $API_ROOT_RESPONSE)${NC}"
    curl -s "$BACKEND_URL/api/" | head -c 200
    echo ""
else
    echo -e "${RED}❌ API root failed (HTTP $API_ROOT_RESPONSE)${NC}"
fi
echo ""

# Test 3: Health check
echo "3. Testing health check (/api/status)..."
STATUS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/status")
if [ "$STATUS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health check working (HTTP $STATUS_RESPONSE)${NC}"
    curl -s "$BACKEND_URL/api/status"
    echo ""
else
    echo -e "${RED}❌ Health check failed (HTTP $STATUS_RESPONSE)${NC}"
    echo "Response:"
    curl -s "$BACKEND_URL/api/status"
    echo ""
fi
echo ""

# Test 4: Check CORS headers
echo "4. Testing CORS configuration..."
CORS_HEADER=$(curl -s -I -H "Origin: https://test.com" "$BACKEND_URL/api/status" | grep -i "access-control-allow-origin" || echo "NOT_FOUND")
if [ "$CORS_HEADER" != "NOT_FOUND" ]; then
    echo -e "${GREEN}✅ CORS headers present${NC}"
    echo "   $CORS_HEADER"
else
    echo -e "${YELLOW}⚠️  CORS headers not found${NC}"
fi
echo ""

# Test 5: Check SSL
echo "5. Testing SSL certificate..."
SSL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://${BACKEND_URL#https://}" 2>&1)
if echo "$SSL_CHECK" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ SSL certificate valid${NC}"
else
    echo -e "${YELLOW}⚠️  SSL check inconclusive${NC}"
fi
echo ""

# Summary
echo "================================"
echo "Diagnostic Summary"
echo "================================"

if [ "$ROOT_RESPONSE" = "200" ] && [ "$API_ROOT_RESPONSE" = "200" ] && [ "$STATUS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ All endpoints working!${NC}"
    echo ""
    echo "Your backend is deployed correctly."
    echo "If you're still seeing 404 errors:"
    echo "  1. Check frontend is pointing to correct backend URL"
    echo "  2. Verify CORS_ORIGINS includes frontend URL"
    echo "  3. Check browser console for specific errors"
else
    echo -e "${RED}❌ Some endpoints are failing${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Check Vercel Function Logs for errors"
    echo "  2. Verify environment variables are set"
    echo "  3. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON string"
    echo "  4. Check vercel.json routing configuration"
    echo ""
    echo "See VERCEL_DEPLOYMENT_TROUBLESHOOTING.md for detailed fixes"
fi

echo ""
