#!/bin/bash

echo "================================================================================"
echo "🔍 LINK RETRIEVAL DEBUG SCRIPT"
echo "================================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check if servers are running
echo "📡 Step 1: Checking if servers are running..."
echo "--------------------------------------------------------------------------------"

BACKEND_PID=$(lsof -ti:8000 2>/dev/null)
FRONTEND_PID=$(lsof -ti:3000 2>/dev/null)

if [ -z "$BACKEND_PID" ]; then
    echo -e "${RED}❌ Backend (port 8000) is NOT running${NC}"
    BACKEND_RUNNING=false
else
    echo -e "${GREEN}✅ Backend (port 8000) is running (PID: $BACKEND_PID)${NC}"
    BACKEND_RUNNING=true
fi

if [ -z "$FRONTEND_PID" ]; then
    echo -e "${RED}❌ Frontend (port 3000) is NOT running${NC}"
    FRONTEND_RUNNING=false
else
    echo -e "${GREEN}✅ Frontend (port 3000) is running (PID: $FRONTEND_PID)${NC}"
    FRONTEND_RUNNING=true
fi

echo ""

# Step 2: Check backend health
if [ "$BACKEND_RUNNING" = true ]; then
    echo "🏥 Step 2: Checking backend health..."
    echo "--------------------------------------------------------------------------------"
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend is responding${NC}"
        echo "Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ Backend not responding to health check${NC}"
    fi
    echo ""
fi

# Step 3: Query Firestore directly for links
echo "🔥 Step 3: Checking Firestore for links..."
echo "--------------------------------------------------------------------------------"
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 << 'PYTHON_SCRIPT'
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from firestore_db import FirestoreDB
from firebase_config import Collections

async def check_links():
    db = FirestoreDB()
    
    # Get all links
    all_links = await db.find(Collections.LINKS)
    print(f"\n📊 Total links in Firestore: {len(all_links)}")
    
    if len(all_links) == 0:
        print("❌ No links found in Firestore!")
        return
    
    # Group by user
    from collections import defaultdict
    links_by_user = defaultdict(list)
    for link in all_links:
        links_by_user[link.get('user_id')].append(link)
    
    print(f"\n👥 Number of users with links: {len(links_by_user)}")
    
    for user_id, links in links_by_user.items():
        # Get user details
        user_doc = await db.find_one(Collections.USERS, {'id': user_id})
        if user_doc:
            print(f"\n{'='*80}")
            print(f"👤 User: {user_doc.get('name')} ({user_doc.get('email')})")
            print(f"🆔 User ID: {user_id}")
            print(f"📊 Links: {len(links)}")
            print(f"{'='*80}")
            for i, link in enumerate(links, 1):
                print(f"  {i}. {link.get('title')} - {link.get('url')}")
                print(f"     ID: {link.get('id')}")
                print(f"     Active: {link.get('active', False)}")
                print(f"     Clicks: {link.get('clicks', 0)}")
        else:
            print(f"\n⚠️  Orphaned links for user_id: {user_id} (user not found)")
            print(f"   Links: {len(links)}")

asyncio.run(check_links())
PYTHON_SCRIPT

echo ""

# Step 4: Test backend API endpoint (if backend is running)
if [ "$BACKEND_RUNNING" = true ]; then
    echo "🔌 Step 4: Testing backend /api/links endpoint..."
    echo "--------------------------------------------------------------------------------"
    echo -e "${YELLOW}⚠️  This requires a valid JWT token${NC}"
    echo ""
    echo "To test manually, run this in your browser console:"
    echo ""
    echo -e "${BLUE}// Get token from localStorage${NC}"
    echo -e "${BLUE}const token = localStorage.getItem('token');${NC}"
    echo -e "${BLUE}console.log('Token:', token);${NC}"
    echo ""
    echo -e "${BLUE}// Test API call${NC}"
    echo -e "${BLUE}fetch('http://localhost:8000/api/links', {${NC}"
    echo -e "${BLUE}  headers: { 'Authorization': \`Bearer \${token}\` }${NC}"
    echo -e "${BLUE}})${NC}"
    echo -e "${BLUE}.then(r => r.json())${NC}"
    echo -e "${BLUE}.then(data => console.log('Links:', data));${NC}"
    echo ""
fi

# Step 5: Check frontend localStorage
echo "💾 Step 5: Frontend localStorage check..."
echo "--------------------------------------------------------------------------------"
echo "Open browser DevTools console and run:"
echo ""
echo -e "${BLUE}// Check if token exists${NC}"
echo -e "${BLUE}const token = localStorage.getItem('token');${NC}"
echo -e "${BLUE}console.log('Token exists:', !!token);${NC}"
echo ""
echo -e "${BLUE}// Decode JWT to see user_id${NC}"
echo -e "${BLUE}if (token) {${NC}"
echo -e "${BLUE}  const payload = JSON.parse(atob(token.split('.')[1]));${NC}"
echo -e "${BLUE}  console.log('JWT user_id:', payload.user_id);${NC}"
echo -e "${BLUE}  console.log('JWT expires:', new Date(payload.exp * 1000));${NC}"
echo -e "${BLUE}  console.log('Token valid?', payload.exp * 1000 > Date.now());${NC}"
echo -e "${BLUE}}${NC}"
echo ""

# Step 6: Recommendations
echo "================================================================================"
echo "💡 RECOMMENDATIONS"
echo "================================================================================"
echo ""

if [ "$BACKEND_RUNNING" = false ]; then
    echo -e "${RED}1. START BACKEND SERVER:${NC}"
    echo "   cd /Users/sankarreddy/Desktop/odinring-main-2/backend"
    echo "   python3 server.py"
    echo ""
fi

if [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${RED}2. START FRONTEND SERVER:${NC}"
    echo "   cd /Users/sankarreddy/Desktop/odinring-main-2/frontend"
    echo "   npm start"
    echo ""
fi

echo -e "${YELLOW}3. CLEAR BROWSER CACHE:${NC}"
echo "   - Open browser DevTools (F12)"
echo "   - Run: localStorage.clear()"
echo "   - Refresh page"
echo ""

echo -e "${YELLOW}4. SIGN IN AGAIN:${NC}"
echo "   - Go to http://localhost:3000/signin"
echo "   - Sign in with your Google account"
echo "   - Check dashboard for links"
echo ""

echo -e "${GREEN}5. CHECK BROWSER CONSOLE:${NC}"
echo "   Look for these logs:"
echo "   - 🔄 loadUserData() called"
echo "   - 📡 Calling GET /links..."
echo "   - 📊 Number of links received: X"
echo "   - 🔗 SimpleLinkManager: Links count: X"
echo ""

echo "================================================================================"
echo "✅ DEBUG SCRIPT COMPLETE"
echo "================================================================================"








