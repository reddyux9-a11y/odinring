#!/bin/bash
# Stop all OdinRing development services

echo "🛑 Stopping OdinRing Services..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to stop process by port
stop_by_port() {
    local port=$1
    local service_name=$2
    
    echo -n "Checking $service_name (port $port)... "
    
    # Find process using the port
    PID=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$PID" ]; then
        echo -e "${YELLOW}Not running${NC}"
    else
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Stopped (PID: $PID)${NC}"
        else
            echo -e "${RED}Failed to stop${NC}"
        fi
    fi
}

# Function to stop process by name
stop_by_name() {
    local process_name=$1
    local display_name=$2
    
    echo -n "Checking $display_name... "
    
    # Find process by name
    PIDS=$(pgrep -f "$process_name" 2>/dev/null)
    
    if [ -z "$PIDS" ]; then
        echo -e "${YELLOW}Not running${NC}"
    else
        pkill -9 -f "$process_name" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Stopped${NC}"
        else
            echo -e "${RED}Failed to stop${NC}"
        fi
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BACKEND SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Stop FastAPI/Uvicorn (common ports)
stop_by_port 8000 "FastAPI Backend"
stop_by_port 8080 "Backend (alt port)"
stop_by_name "uvicorn.*server:app" "Uvicorn Server"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FRONTEND SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Stop React (common ports)
stop_by_port 3000 "React Frontend"
stop_by_port 3001 "React (alt port)"
stop_by_name "react-scripts start" "React Scripts"
stop_by_name "npm.*start" "npm start"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DATABASE SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Stop Firebase emulator
stop_by_port 8080 "Firebase Emulator"
stop_by_port 9099 "Firebase Auth Emulator"
stop_by_port 8081 "Firestore Emulator"
stop_by_name "firebase.*emulators:start" "Firebase Emulators"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OTHER SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Stop Playwright test server
stop_by_port 5000 "Test Server"

# Stop any Python development servers
stop_by_name "python.*runserver" "Python Dev Server"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Service shutdown complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To verify all services stopped, run:"
echo "  lsof -i :3000,8000,8080"
echo ""








