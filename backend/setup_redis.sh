#!/bin/bash
# Setup Redis for Caching
# This script helps set up Redis for production caching

echo "🔴 Redis Setup Guide"
echo "===================="
echo ""

# Check if Redis is already running
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is already running!"
        redis-cli info server | grep redis_version
        echo ""
        echo "Current Redis URL: ${REDIS_URL:-not set}"
        echo ""
        echo "To use Redis, set in your .env file:"
        echo "  REDIS_URL=redis://localhost:6379"
        exit 0
    fi
fi

echo "Redis is not installed or not running."
echo ""
echo "📦 Installation Options:"
echo ""
echo "1. macOS (Homebrew):"
echo "   brew install redis"
echo "   brew services start redis"
echo ""
echo "2. Linux (Ubuntu/Debian):"
echo "   sudo apt-get update"
echo "   sudo apt-get install redis-server"
echo "   sudo systemctl start redis"
echo ""
echo "3. Docker:"
echo "   docker run -d -p 6379:6379 --name redis redis:latest"
echo ""
echo "4. Cloud Services:"
echo "   - Redis Cloud: https://redis.com/try-free/"
echo "   - AWS ElastiCache: https://aws.amazon.com/elasticache/"
echo "   - Google Cloud Memorystore: https://cloud.google.com/memorystore"
echo ""
echo "🔧 Configuration:"
echo ""
echo "After installing Redis, add to your backend/.env file:"
echo "  REDIS_URL=redis://localhost:6379"
echo ""
echo "If Redis requires a password:"
echo "  REDIS_URL=redis://:password@localhost:6379"
echo ""
echo "For cloud Redis:"
echo "  REDIS_URL=redis://username:password@host:port"
echo ""
echo "📝 Note:"
echo "   If Redis is not available, the system will automatically"
echo "   fall back to in-memory caching (works but not shared across instances)"
echo ""



