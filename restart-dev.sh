#!/bin/bash

# OdinRing Development Server Restart Script

# Color codes
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Restarting OdinRing Development Servers...${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Stop existing servers
./stop-dev.sh

echo ""
echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""

# Start servers
./start-dev.sh

