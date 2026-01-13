#!/bin/bash
# Comprehensive Test Runner Script
# Runs all tests and generates coverage report

set -e

echo "🧪 Running Comprehensive Test Suite for OdinRing"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Backend tests
echo -e "\n${YELLOW}📊 Running Backend Tests...${NC}"
cd backend

# Run backend tests with coverage
if python3 -m pytest tests/ -v --cov=. --cov-report=html --cov-report=term-missing --cov-report=xml --tb=short; then
    echo -e "${GREEN}✅ Backend tests passed${NC}"
    BACKEND_PASSED=true
else
    echo -e "${RED}❌ Backend tests failed${NC}"
    BACKEND_PASSED=false
fi

cd ..

# Frontend tests
echo -e "\n${YELLOW}📊 Running Frontend Tests...${NC}"
cd frontend

# Run frontend tests with coverage
if npm test -- --coverage --watchAll=false --passWithNoTests; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    FRONTEND_PASSED=true
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
    FRONTEND_PASSED=false
fi

cd ..

# E2E tests (if Playwright is configured)
if [ -d "frontend/e2e" ]; then
    echo -e "\n${YELLOW}📊 Running E2E Tests...${NC}"
    cd frontend
    
    if npx playwright test; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        E2E_PASSED=true
    else
        echo -e "${RED}❌ E2E tests failed${NC}"
        E2E_PASSED=false
    fi
    
    cd ..
fi

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "=================================================="
echo "Backend Tests: $([ "$BACKEND_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "Frontend Tests: $([ "$FRONTEND_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
if [ -n "$E2E_PASSED" ]; then
    echo "E2E Tests: $([ "$E2E_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
fi

# Coverage reports
echo -e "\n${YELLOW}📈 Coverage Reports${NC}"
echo "=================================================="
echo "Backend Coverage: backend/htmlcov/index.html"
echo "Frontend Coverage: frontend/coverage/index.html"

# Overall result
if [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_PASSED" = true ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi


