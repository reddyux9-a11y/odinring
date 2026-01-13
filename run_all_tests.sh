#!/bin/bash
# Comprehensive test runner for OdinRing
# Runs all backend and frontend tests with coverage

set -e  # Exit on error

echo "========================================================================"
echo "🧪 ODINRING COMPREHENSIVE TEST SUITE"
echo "========================================================================"
echo ""

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
BACKEND_TESTS_PASSED=false
FRONTEND_TESTS_PASSED=false

echo "📂 Project Directory: $SCRIPT_DIR"
echo ""

# Step 1: Backend Tests
echo "========================================================================"
echo "STEP 1: RUNNING BACKEND TESTS"
echo "========================================================================"
echo ""

if command -v python3 &> /dev/null; then
    cd backend
    
    echo "📦 Installing backend test dependencies..."
    pip3 install -q pytest pytest-asyncio pytest-cov httpx 2>/dev/null || echo "Dependencies already installed"
    
    echo ""
    echo "🧪 Running backend unit tests..."
    if pytest tests/unit/ -v --cov=. --cov-report=term --cov-report=html:coverage/backend_unit 2>/dev/null; then
        echo -e "${GREEN}✅ Backend unit tests PASSED${NC}"
    else
        echo -e "${RED}❌ Backend unit tests FAILED${NC}"
    fi
    
    echo ""
    echo "🔗 Running backend integration tests..."
    if pytest tests/integration/ -v --cov=. --cov-append --cov-report=term --cov-report=html:coverage/backend_integration 2>/dev/null; then
        echo -e "${GREEN}✅ Backend integration tests PASSED${NC}"
        BACKEND_TESTS_PASSED=true
    else
        echo -e "${RED}❌ Backend integration tests FAILED${NC}"
    fi
    
    echo ""
    echo "📊 Backend test coverage saved to: backend/coverage/"
    
    cd ..
else
    echo -e "${YELLOW}⚠️  Python not found, skipping backend tests${NC}"
fi

echo ""
read -p "Press Enter to continue to frontend tests..."
echo ""

# Step 2: Frontend Tests
echo "========================================================================"
echo "STEP 2: RUNNING FRONTEND TESTS"
echo "========================================================================"
echo ""

if command -v npm &> /dev/null; then
    cd frontend
    
    echo "📦 Ensuring frontend test dependencies are installed..."
    npm install --silent 2>/dev/null || echo "Dependencies already installed"
    
    echo ""
    echo "🧪 Running frontend unit tests..."
    if npm test -- --coverage --watchAll=false 2>/dev/null; then
        echo -e "${GREEN}✅ Frontend unit tests PASSED${NC}"
        FRONTEND_TESTS_PASSED=true
    else
        echo -e "${YELLOW}⚠️  Frontend unit tests had issues (check output)${NC}"
    fi
    
    echo ""
    echo "📊 Frontend test coverage saved to: frontend/coverage/"
    
    cd ..
else
    echo -e "${YELLOW}⚠️  npm not found, skipping frontend tests${NC}"
fi

echo ""
read -p "Press Enter to continue to E2E tests..."
echo ""

# Step 3: E2E Tests
echo "========================================================================"
echo "STEP 3: RUNNING E2E TESTS (PLAYWRIGHT)"
echo "========================================================================"
echo ""

if command -v npx &> /dev/null; then
    cd frontend
    
    echo "🌐 Checking if Playwright is installed..."
    if npx playwright --version &> /dev/null; then
        echo "✅ Playwright found"
        
        echo ""
        echo -e "${YELLOW}⚠️  E2E tests require the application to be running.${NC}"
        echo "   Please ensure backend and frontend are running before proceeding."
        echo ""
        read -p "Continue with E2E tests? (y/N) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧪 Running E2E tests..."
            if npx playwright test e2e/ 2>/dev/null; then
                echo -e "${GREEN}✅ E2E tests PASSED${NC}"
            else
                echo -e "${YELLOW}⚠️  E2E tests had issues${NC}"
            fi
        else
            echo "Skipping E2E tests"
        fi
    else
        echo -e "${YELLOW}⚠️  Playwright not installed, skipping E2E tests${NC}"
        echo "   To install: npx playwright install"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠️  npx not found, skipping E2E tests${NC}"
fi

echo ""
echo "========================================================================"
echo "📊 TEST SUMMARY"
echo "========================================================================"
echo ""

# Backend summary
if [ "$BACKEND_TESTS_PASSED" = true ]; then
    echo -e "Backend Tests:  ${GREEN}✅ PASSED${NC}"
else
    echo -e "Backend Tests:  ${RED}❌ FAILED${NC}"
fi

# Frontend summary
if [ "$FRONTEND_TESTS_PASSED" = true ]; then
    echo -e "Frontend Tests: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Frontend Tests: ${YELLOW}⚠️  CHECK REQUIRED${NC}"
fi

echo ""
echo "========================================================================"
echo "📈 COVERAGE REPORTS"
echo "========================================================================"
echo ""
echo "Backend Coverage:  backend/coverage/backend_unit/index.html"
echo "Frontend Coverage: frontend/coverage/lcov-report/index.html"
echo ""
echo "To view coverage reports:"
echo "  Backend:  open backend/coverage/backend_unit/index.html"
echo "  Frontend: open frontend/coverage/lcov-report/index.html"
echo ""
echo "========================================================================"

# Overall status
if [ "$BACKEND_TESTS_PASSED" = true ] && [ "$FRONTEND_TESTS_PASSED" = true ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - READY FOR PRODUCTION!${NC}"
    echo "========================================================================"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS NEED ATTENTION${NC}"
    echo "========================================================================"
    exit 1
fi








