# 🚀 Development Server Guide

## Quick Start

### Option 1: Automated Script (Recommended)
```bash
./start-dev.sh
```

This single command:
- ✅ Checks Firebase configuration
- ✅ Kills any processes on ports 8000 and 3000
- ✅ Tests Firebase connection
- ✅ Starts backend with hot-reload
- ✅ Starts frontend with hot-reload
- ✅ Displays status and logs

### Option 2: Using npm (Alternative)
```bash
# Install concurrently first
npm install

# Start both servers
npm start

# Or start individually
npm run start:backend   # Backend only
npm run start:frontend  # Frontend only
```

### Option 3: Manual (Traditional)
```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm start
```

---

## 🎯 Available Scripts

### Startup Commands
```bash
./start-dev.sh          # Start both servers (recommended)
npm start               # Start both servers via npm
npm run dev             # Same as npm start
npm run start:backend   # Start backend only
npm run start:frontend  # Start frontend only
```

### Stop Commands
```bash
./stop-dev.sh           # Stop all servers
npm run kill:all        # Kill all processes
npm run kill:backend    # Kill backend only
npm run kill:frontend   # Kill frontend only
```

### Restart Commands
```bash
./restart-dev.sh        # Restart both servers
npm run restart         # Restart via npm
npm run restart:backend # Restart backend only
npm run restart:frontend # Restart frontend only
```

### Setup Commands
```bash
npm run setup           # Full setup (install + test + seed)
npm run install:all     # Install all dependencies
npm run install:backend # Install backend dependencies
npm run install:frontend # Install frontend dependencies
npm run test:firebase   # Test Firebase connection
npm run seed            # Seed database
```

---

## 🔥 Hot-Reload Features

### Backend Hot-Reload
**Powered by:** Uvicorn's `--reload` flag

**What triggers reload:**
- ✅ Changes to `.py` files in `backend/`
- ✅ Changes to `server.py`
- ✅ Changes to `firebase_config.py`
- ✅ Changes to `firestore_db.py`

**What doesn't trigger reload:**
- ❌ Changes to `.env` files (requires manual restart)
- ❌ Changes to `requirements.txt` (requires manual restart)

**Manual restart needed for:**
```bash
./restart-dev.sh
# or
npm run restart:backend
```

### Frontend Hot-Reload
**Powered by:** React's built-in Hot Module Replacement (HMR)

**What triggers reload:**
- ✅ Changes to `.jsx` files
- ✅ Changes to `.js` files
- ✅ Changes to `.css` files
- ✅ Changes to components
- ✅ Changes to pages

**What doesn't trigger reload:**
- ❌ Changes to `.env` files (requires manual restart)
- ❌ Changes to `package.json` (requires manual restart)

**Manual restart needed for:**
```bash
./restart-dev.sh
# or
npm run restart:frontend
```

---

## 📊 Server Status

### Check if servers are running
```bash
# Check backend
curl http://localhost:8000/api/debug/health

# Check frontend
curl http://localhost:3000

# Check ports
lsof -i:8000  # Backend
lsof -i:3000  # Frontend
```

### View logs
```bash
# Real-time logs
tail -f backend.log
tail -f frontend.log

# Last 50 lines
tail -50 backend.log
tail -50 frontend.log

# Search logs
grep "error" backend.log
grep "Firebase" backend.log
```

---

## 🛠️ Troubleshooting

### Port Already in Use

**Problem:** "Address already in use" error

**Solution 1:** Use stop script
```bash
./stop-dev.sh
./start-dev.sh
```

**Solution 2:** Kill manually
```bash
# Kill backend (port 8000)
lsof -ti:8000 | xargs kill -9

# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Or use npm
npm run kill:all
```

**Solution 3:** Use different ports
```bash
# Backend on different port
cd backend
python3 -m uvicorn server:app --reload --port 8001

# Frontend on different port
cd frontend
PORT=3001 npm start
```

### Hot-Reload Not Working

**Backend not reloading:**
```bash
# Check if --reload flag is present
ps aux | grep uvicorn

# Restart with reload explicitly
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Frontend not reloading:**
```bash
# Check if webpack dev server is running
ps aux | grep webpack

# Clear cache and restart
cd frontend
rm -rf node_modules/.cache
npm start
```

### Firebase Connection Issues

**Test connection:**
```bash
cd backend
python3 test_firebase_connection.py
```

**If fails:**
1. Check `backend/.env` has correct Firebase config
2. Check `firebase-service-account.json` exists
3. Enable Firestore API in Firebase Console

### Environment Variables Not Loading

**Backend:**
```bash
# Check .env file
cat backend/.env

# Restart server (env vars loaded on startup)
./restart-dev.sh
```

**Frontend:**
```bash
# Check .env file
cat frontend/.env

# Important: React env vars must start with REACT_APP_
# Restart frontend
npm run restart:frontend
```

---

## 📝 Best Practices

### 1. Always Use Start Script
```bash
# ✅ Good - checks everything before starting
./start-dev.sh

# ❌ Avoid - might have stale processes
python3 -m uvicorn server:app --reload
```

### 2. Check Logs Regularly
```bash
# Open in separate terminals
tail -f backend.log
tail -f frontend.log
```

### 3. Stop Properly
```bash
# ✅ Good - clean shutdown
./stop-dev.sh

# ❌ Avoid - might leave orphan processes
Ctrl+C in terminal
```

### 4. Restart After Config Changes
```bash
# After changing .env or installing packages
./restart-dev.sh
```

### 5. Test After Changes
```bash
# Test backend
curl http://localhost:8000/api/debug/health

# Test frontend
open http://localhost:3000
```

---

## 🎯 Development Workflow

### Starting Your Day
```bash
1. cd /Users/sankarreddy/Desktop/odinring-main-2
2. ./start-dev.sh
3. Wait for "SERVERS RUNNING!" message
4. Open http://localhost:3000
5. Start coding!
```

### During Development
```bash
# Code changes auto-reload ✅
# Just save your files and refresh browser

# If you change .env or package.json:
./restart-dev.sh
```

### Ending Your Day
```bash
./stop-dev.sh
# or press Ctrl+C in the start-dev.sh terminal
```

---

## 📊 Server URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React app |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Admin Login** | http://localhost:3000/admin-login | Admin panel |
| **Health Check** | http://localhost:8000/api/debug/health | Server health status |

---

## 🔧 Advanced Configuration

### Custom Ports

**Backend:**
```bash
cd backend
python3 -m uvicorn server:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
PORT=3001 npm start
```

**Update backend URL in frontend:**
```bash
# Edit frontend/.env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Watch Additional Files

**Backend - watch specific directories:**
```bash
cd backend
uvicorn server:app --reload --reload-dir=. --reload-include="*.py"
```

**Frontend - disable hot reload:**
```bash
cd frontend
FAST_REFRESH=false npm start
```

---

## 🎉 Summary

### Recommended Daily Workflow
1. **Start:** `./start-dev.sh`
2. **Code:** Files auto-reload on save
3. **Test:** http://localhost:3000
4. **Stop:** `./stop-dev.sh` or Ctrl+C

### Key Benefits
✅ Hot-reload on both frontend and backend
✅ Automatic process management
✅ Firebase connection verification
✅ Detailed logging
✅ Easy restart with `./restart-dev.sh`
✅ Clean shutdown with `./stop-dev.sh`

### Need Help?
- Check logs: `tail -f backend.log` or `tail -f frontend.log`
- Test Firebase: `npm run test:firebase`
- Kill stuck processes: `npm run kill:all`
- Full restart: `./restart-dev.sh`

---

**Happy Coding! 🚀**

