# Start Services Guide - OdinRing

**Date:** January 6, 2025

---

## 🚀 Quick Start (Recommended)

### Option 1: Start Both Services Together

Open **ONE terminal window** and run:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm start
```

This starts both backend and frontend together. You'll see logs from both services in the same terminal.

---

### Option 2: Start Services in Separate Terminals (Recommended for Development)

Open **TWO terminal windows**:

#### Terminal 1 - Backend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**✅ Success Indicators:**
- "Uvicorn running on http://0.0.0.0:8000"
- "Application startup complete"
- No error messages

**❌ Error Indicators:**
- "PermissionError: Operation not permitted: '.env'" - Check .env file permissions
- "Port 8000 already in use" - Kill existing process: `lsof -ti:8000 | xargs kill -9`
- Import errors - Run: `pip3 install -r requirements.txt`

#### Terminal 2 - Frontend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view odinring in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
```

**✅ Success Indicators:**
- "Compiled successfully!"
- "You can now view odinring in the browser"
- Browser opens automatically to http://localhost:3000

**❌ Error Indicators:**
- "Port 3000 already in use" - Kill existing process: `lsof -ti:3000 | xargs kill -9`
- Module not found - Run: `npm install --legacy-peer-deps`
- Compilation errors - Check error messages in terminal

---

## ✅ Verification Steps

### 1. Check Backend is Running

Open a new terminal and run:

```bash
# Check if port 8000 is in use
lsof -ti:8000 && echo "✅ Backend is running" || echo "❌ Backend is NOT running"

# Test API endpoint
curl http://localhost:8000/docs

# Should return HTML with "OdinRing API" in the content
```

### 2. Check Frontend is Running

```bash
# Check if port 3000 is in use
lsof -ti:3000 && echo "✅ Frontend is running" || echo "❌ Frontend is NOT running"

# Test frontend
curl http://localhost:3000

# Should return HTML content
```

### 3. Test API Endpoints

```bash
# Test OpenAPI schema
curl http://localhost:8000/api/openapi.json | python3 -m json.tool | head -20

# Test API docs
open http://localhost:8000/docs
```

### 4. Open Application

```bash
# Open frontend in browser
open http://localhost:3000

# Or open API docs
open http://localhost:8000/docs
```

---

## 🔍 Troubleshooting

### Backend Won't Start

**Permission Error with .env:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
ls -la .env
# Should show: -rw-r--r-- (readable)

# If permissions are wrong:
chmod 644 .env
```

**Port Already in Use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use npm script:
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run kill:backend
```

**Import Errors:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
pip3 install -r requirements.txt
```

**Firebase Connection Errors:**
- Check `.env` file has correct `FIREBASE_PROJECT_ID`
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` points to valid JSON file
- Check service account file exists: `ls -la firebase-service-account.json`

### Frontend Won't Start

**Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use npm script:
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run kill:frontend
```

**Module Not Found:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Compilation Errors:**
- Check Node.js version: `node --version` (should be >=14.0.0)
- Clear cache and reinstall:
  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install --legacy-peer-deps
  ```

---

## 📊 Service URLs

Once services are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Schema**: http://localhost:8000/api/openapi.json

---

## 🛑 Stop Services

### Stop All Services:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run kill:all
```

### Stop Individual Services:
```bash
# Backend
npm run kill:backend
# Or: lsof -ti:8000 | xargs kill -9

# Frontend
npm run kill:frontend
# Or: lsof -ti:3000 | xargs kill -9
```

### Or Press Ctrl+C in the terminal where services are running

---

## 🔄 Restart Services

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run restart
```

This will kill all running services and restart them.

---

## ✅ Health Check Script

Run this to verify everything is working:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2

echo "=== SERVICE HEALTH CHECK ==="
echo ""
echo "Backend (port 8000):"
if lsof -ti:8000 >/dev/null 2>&1; then
  echo "  ✅ Process running"
  curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" http://localhost:8000/docs
else
  echo "  ❌ NOT RUNNING"
fi

echo ""
echo "Frontend (port 3000):"
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  ✅ Process running"
  curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" http://localhost:3000
else
  echo "  ❌ NOT RUNNING"
fi

echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API Docs: http://localhost:8000/docs"
```

---

## 📝 Notes

1. **Backend** typically starts in 2-5 seconds
2. **Frontend** takes 15-30 seconds to compile (normal for React)
3. Services will keep running until you stop them (Ctrl+C) or close the terminal
4. For production-like behavior, use separate terminal windows to monitor logs
5. The `--reload` flag enables auto-reload on code changes (development mode)

---

**Ready to start?** Follow Option 2 above for the best development experience!
