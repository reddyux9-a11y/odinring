#!/bin/bash

# 🔄 Clean Restart Script - Kills old processes and starts fresh

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🔄 CLEAN RESTART - KILL & START             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Kill existing processes
echo "📌 Step 1: Killing existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 2
echo "   ✅ Ports cleared"
echo ""

# Step 2: Verify ports are free
echo "📌 Step 2: Verifying ports are free..."
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "   ❌ Port 8000 still in use!"
    exit 1
fi
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   ❌ Port 3000 still in use!"
    exit 1
fi
echo "   ✅ Ports 8000 and 3000 are free"
echo ""

# Step 3: Start backend
echo "📌 Step 3: Starting backend server..."
cd backend
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
echo "   🚀 Backend started (PID: $BACKEND_PID)"
sleep 3
echo ""

# Step 4: Start frontend
echo "📌 Step 4: Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..
echo "   🚀 Frontend started (PID: $FRONTEND_PID)"
sleep 3
echo ""

# Step 5: Verify servers
echo "📌 Step 5: Verifying servers..."
sleep 5

if lsof -ti:8000 >/dev/null 2>&1; then
    echo "   ✅ Backend running on http://localhost:8000"
else
    echo "   ❌ Backend failed to start!"
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   ✅ Frontend running on http://localhost:3000"
else
    echo "   ❌ Frontend failed to start!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 SERVERS RUNNING!"
echo ""
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   Docs:     http://localhost:8000/docs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 NEXT STEP: Open TESTING_SCRIPT.md and begin Phase 1!"
echo ""
echo "   → Start with TEST-1: onAuthStateChanged verification"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To stop servers: npm run stop (or kill -9 $BACKEND_PID $FRONTEND_PID)"
echo ""



