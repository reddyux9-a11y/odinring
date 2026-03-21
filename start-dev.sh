#!/bin/bash

# OdinRing Development Server Startup Script
# Starts both backend and frontend with hot-reload

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}║             🚀 OdinRing Development Server 🚀                ║${NC}"
echo -e "${BLUE}║                                                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to kill processes on ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use (PID: $pid). Killing process...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Port $port freed${NC}"
    fi
}

# Check if backend is already running
echo -e "${BLUE}🔍 Checking for running processes...${NC}"
kill_port 8000
kill_port 3000
echo ""

# Check if Firebase is configured
echo -e "${BLUE}🔥 Checking Firebase configuration...${NC}"
if [ ! -f "backend/firebase-service-account.json" ]; then
    echo -e "${RED}❌ Firebase service account key not found!${NC}"
    echo -e "${YELLOW}📖 Please follow setup instructions in START_HERE.md${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Firebase configured${NC}"
echo ""

# Check if .env files exist
echo -e "${BLUE}🔍 Checking environment files...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    exit 1
fi
if [ ! -f "frontend/.env" ]; then
    echo -e "${RED}❌ frontend/.env not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Environment files exist${NC}"
echo ""

# Test Firebase connection
echo -e "${BLUE}🧪 Testing Firebase connection...${NC}"
cd backend
python3 test_firebase_connection.py 2>&1 | grep -q "ALL TESTS PASSED"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firebase connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Firebase connection test failed${NC}"
    echo -e "${YELLOW}📖 You may need to enable Firestore API${NC}"
    echo -e "${YELLOW}🔗 https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=studio-7743041576-fc16f${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
cd ..
echo ""

# Start backend in background
echo -e "${BLUE}🔥 Starting Backend Server (FastAPI + Firestore)...${NC}"
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${GREEN}   📡 API: http://localhost:8000${NC}"
echo -e "${GREEN}   📚 Docs: http://localhost:8000/docs${NC}"
echo ""

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/api/debug/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""
echo ""

# Start frontend in background
echo -e "${BLUE}⚛️  Starting Frontend Server (React)...${NC}"
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${GREEN}   🌐 App: http://localhost:3000${NC}"
echo ""

# Wait for frontend to start
echo -e "${BLUE}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""
echo ""

# Display status
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║                  🎉 SERVERS RUNNING! 🎉                       ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Server Status:${NC}"
echo -e "   ${GREEN}✅ Backend:${NC}  http://localhost:8000 (PID: $BACKEND_PID)"
echo -e "   ${GREEN}✅ Frontend:${NC} http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo -e "${BLUE}🔧 Features:${NC}"
echo -e "   ${GREEN}✅ Hot-Reload:${NC} Both servers auto-restart on code changes"
echo -e "   ${GREEN}✅ Firebase:${NC}  Connected to Firestore"
echo -e "   ${GREEN}✅ Google Sign-In:${NC} Ready to use"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:  tail -f backend.log"
echo -e "   Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop servers:${NC}"
echo -e "   Press Ctrl+C or run: ./stop-dev.sh"
echo ""
echo -e "${YELLOW}⚠️  Keep this terminal open!${NC}"
echo ""

# Create PID file for easy cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Wait for user interrupt
trap "echo '' && echo -e '${YELLOW}🛑 Stopping servers...${NC}' && kill $BACKEND_PID $FRONTEND_PID 2>/dev/null && rm -f .backend.pid .frontend.pid && echo -e '${GREEN}✅ Servers stopped${NC}' && exit 0" INT TERM

# Keep script running
echo -e "${GREEN}🚀 Servers are running. Press Ctrl+C to stop.${NC}"
echo ""
wait

