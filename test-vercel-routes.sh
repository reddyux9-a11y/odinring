#!/bin/bash
# Vercel Route Testing Script

APP_URL="https://your-app.vercel.app"  # Replace with your actual Vercel URL

echo "🧪 Testing Vercel Routes..."
echo "=============================="
echo "Testing: $APP_URL"
echo ""

ROUTES=(
  "/"
  "/auth"
  "/dashboard"
  "/install"
  "/profile/testuser"
  "/admin/login"
  "/forgot-password"
  "/reset-password"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for route in "${ROUTES[@]}"; do
  URL="${APP_URL}${route}"
  echo -n "Testing ${route}... "
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)
  
  if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 301 ] || [ "$HTTP_CODE" -eq 302 ]; then
    echo "✅ OK ($HTTP_CODE)"
    ((SUCCESS_COUNT++))
  else
    echo "❌ FAILED ($HTTP_CODE)"
    ((FAIL_COUNT++))
  fi
done

echo ""
echo "=============================="
echo "Results: $SUCCESS_COUNT passed, $FAIL_COUNT failed"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ All routes working correctly!"
  exit 0
else
  echo "⚠️  Some routes failed. Check the results above."
  exit 1
fi
