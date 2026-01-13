# Clean Service Startup Guide

**Goal:** Start services without errors  
**Date:** January 11, 2025

---

## ✅ Prerequisites Checklist

Before starting services, verify:

- [ ] Python 3.x installed: `python3 --version`
- [ ] Node.js installed: `node --version`
- [ ] Backend `.env` file exists: `backend/.env`
- [ ] Frontend `.env` file exists: `frontend/.env`
- [ ] Dependencies installed (backend & frontend)
- [ ] Ports 8000 and 3000 are available

---

## 🚀 Clean Startup Procedure

### Step 1: Stop Any Running Services

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2

# Kill any existing services
npm run kill:all

# Verify ports are free
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

---

### Step 2: Verify Configuration Files

#### Backend .env

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend

# Check if .env exists
test -f .env && echo "✅ Backend .env exists" || echo "❌ Backend .env missing"

# Verify .env has required variables
if [ -f .env ]; then
  grep -q "FIREBASE_PROJECT_ID" .env && echo "✅ FIREBASE_PROJECT_ID set" || echo "⚠️  FIREBASE_PROJECT_ID missing"
  grep -q "JWT_SECRET" .env && echo "✅ JWT_SECRET set" || echo "⚠️  JWT_SECRET missing"
fi
```

#### Frontend .env

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend

# Check if .env exists
test -f .env && echo "✅ Frontend .env exists" || echo "❌ Frontend .env missing"

# Create if missing
if [ ! -f .env ]; then
  echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
  echo "✅ Created frontend .env file"
fi

# Verify
grep -q "REACT_APP_BACKEND_URL" .env && echo "✅ REACT_APP_BACKEND_URL set" || echo "⚠️  REACT_APP_BACKEND_URL missing"
```

---

### Step 3: Start Services (Option A - Together)

**Single Terminal (Easiest):**

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm start
```

**Expected Output:**
```
[0] INFO:     Uvicorn running on http://0.0.0.0:8000
[0] INFO:     Application startup complete.
[1] Compiled successfully!
[1] You can now view odinring in the browser.
```

---

### Step 3: Start Services (Option B - Separate Terminals)

**Terminal 1 - Backend:**

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
✅ Firestore connected - X users found
✅ Database initialization complete
```

**Terminal 2 - Frontend:**

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
```

---

## ✅ Verification Steps

### 1. Check Services Are Running

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2

# Check processes
lsof -ti:8000 && echo "✅ Backend running" || echo "❌ Backend not running"
lsof -ti:3000 && echo "✅ Frontend running" || echo "❌ Frontend not running"
```

### 2. Test Backend API

```bash
# Test API docs
curl -s http://localhost:8000/docs | grep -q "OdinRing\|FastAPI" && echo "✅ Backend API accessible" || echo "❌ Backend API not accessible"

# Test API schema
curl -s http://localhost:8000/api/openapi.json | head -5 | grep -q "openapi" && echo "✅ API schema valid" || echo "⚠️  API schema check"
```

### 3. Test Frontend

```bash
# Test frontend
curl -s http://localhost:3000 | head -10 | grep -q "html\|root" && echo "✅ Frontend accessible" || echo "❌ Frontend not accessible"
```

### 4. Use Verification Script

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./verify_services.sh
```

---

## 🎯 Success Indicators

### Backend Success:
- ✅ "Uvicorn running on http://0.0.0.0:8000"
- ✅ "Application startup complete"
- ✅ "Database initialization complete"
- ✅ No error messages
- ✅ Accessible at http://localhost:8000/docs

### Frontend Success:
- ✅ "Compiled successfully!"
- ✅ "You can now view odinring in the browser"
- ✅ No compilation errors
- ✅ Browser opens automatically
- ✅ Accessible at http://localhost:3000

---

## ⚠️ Common Issues & Quick Fixes

### Issue 1: Port Already in Use

```bash
# Kill processes on ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Or use npm script
npm run kill:all
```

### Issue 2: Missing .env Files

**Backend:**
- Ensure `backend/.env` exists with `FIREBASE_PROJECT_ID` and `JWT_SECRET`

**Frontend:**
```bash
cd frontend
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
```

### Issue 3: Missing Dependencies

**Backend:**
```bash
cd backend
pip3 install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
```

### Issue 4: Compilation Errors

**Clear cache and reinstall:**
```bash
cd frontend
rm -rf node_modules/.cache
npm start
```

---

## 📋 Complete Startup Checklist

- [ ] Stopped any existing services
- [ ] Verified backend `.env` exists
- [ ] Verified frontend `.env` exists
- [ ] Started backend (port 8000)
- [ ] Started frontend (port 3000)
- [ ] Backend shows "Application startup complete"
- [ ] Frontend shows "Compiled successfully!"
- [ ] Backend accessible at http://localhost:8000/docs
- [ ] Frontend accessible at http://localhost:3000
- [ ] No error messages in terminals
- [ ] Browser console shows no errors

---

## 🎉 Clean Startup Script

Save this as `clean-start.sh`:

```bash
#!/bin/bash

cd /Users/sankarreddy/Desktop/odinring-main-2

echo "🛑 Stopping existing services..."
npm run kill:all 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

echo "✅ Verifying configuration..."
cd frontend
if [ ! -f .env ]; then
  echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
  echo "✅ Created frontend .env"
fi
cd ..

echo "🚀 Starting services..."
npm start
```

Make it executable:
```bash
chmod +x clean-start.sh
```

Run it:
```bash
./clean-start.sh
```

---

## 📊 Expected Timeline

- **Backend:** Starts in 2-5 seconds
- **Frontend:** Compiles in 15-30 seconds
- **Total:** Services ready in 20-35 seconds

---

## ✅ Success Criteria

Services are successfully started when:

1. ✅ Backend terminal shows "Application startup complete"
2. ✅ Frontend terminal shows "Compiled successfully!"
3. ✅ http://localhost:8000/docs loads (backend API docs)
4. ✅ http://localhost:3000 loads (frontend app)
5. ✅ No error messages in terminals
6. ✅ No error messages in browser console

---

**Last Updated:** January 11, 2025  
**Status:** Ready for clean startup
