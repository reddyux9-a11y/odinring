#!/bin/bash
# Start all OdinRing development services

echo "🚀 Starting OdinRing Services..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PROJECT ROOT: $SCRIPT_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Creating .env from env-template.txt..."
    if [ -f "env-template.txt" ]; then
        cp env-template.txt .env
        echo -e "${GREEN}✅ Created .env file${NC}"
        echo -e "${YELLOW}⚠️  Please update .env with your actual values${NC}"
        echo ""
    fi
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CHECKING PORTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_port 8000; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use (Backend)${NC}"
    echo "Run './stop_services.sh' first or manually stop the service"
    exit 1
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use (Frontend)${NC}"
    echo "Run './stop_services.sh' first or manually stop the service"
    exit 1
fi

echo -e "${GREEN}✅ Ports 3000 and 8000 are available${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STARTING BACKEND (FastAPI)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python3 not found${NC}"
    exit 1
fi

# Start backend in background
cd backend

echo "📦 Installing backend dependencies..."
pip3 install -q -r requirements.txt 2>/dev/null || echo "Dependencies already installed"

echo "🔥 Starting FastAPI server on http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

# Start uvicorn in background with output to log file
nohup python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

if check_port 8000; then
    echo -e "${GREEN}✅ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may have failed to start. Check logs/backend.log${NC}"
fi

cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STARTING FRONTEND (React)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}⚠️  npm not found${NC}"
    exit 1
fi

cd frontend

echo "📦 Installing frontend dependencies..."
npm install --silent 2>/dev/null || echo "Dependencies already installed"

echo "⚛️  Starting React server on http://localhost:3000"
echo ""

# Start React in background with output to log file
BROWSER=none nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for React to start (this may take 10-30 seconds)..."
sleep 10

if check_port 3000; then
    echo -e "${GREEN}✅ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is still starting. Check logs/frontend.log${NC}"
fi

cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 ODINRING IS RUNNING!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Frontend:     http://localhost:3000"
echo "🔥 Backend API:  http://localhost:8000"
echo "📚 API Docs:     http://localhost:8000/docs"
echo ""
echo "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  logs/backend.log"
echo "  Frontend: logs/frontend.log"
echo ""
echo "To view logs in real-time:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "To stop services:"
echo "  ./stop_services.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"








