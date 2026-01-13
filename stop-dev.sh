#!/bin/bash

# OdinRing Development Server Stop Script

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping OdinRing Development Servers...${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Stopping $name on port $port (PID: $pid)...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${GREEN}✅ $name is not running${NC}"
    fi
}

# Kill processes by port
kill_port 8000 "Backend"
kill_port 3000 "Frontend"

# Clean up PID files
rm -f .backend.pid .frontend.pid 2>/dev/null

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"

