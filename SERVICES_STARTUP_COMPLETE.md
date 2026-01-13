# Services Startup - Complete Guide

**Goal:** Start services without errors  
**Status:** Ready

---

## ✅ Quick Start (Recommended)

### Option 1: Use Clean Startup Script

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./clean-start.sh
```

This script will:
- Stop any existing services
- Verify configuration files
- Start both services
- Show status

---

### Option 2: Manual Start (Single Terminal)

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm start
```

---

### Option 3: Manual Start (Separate Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

---

## ✅ Success Indicators

### Backend (FastAPI)
- ✅ "Uvicorn running on http://0.0.0.0:8000"
- ✅ "Application startup complete"
- ✅ "Database initialization complete"
- ✅ No error messages
- ✅ Accessible at http://localhost:8000/docs

### Frontend (React)
- ✅ "Compiled successfully!"
- ✅ "You can now view odinring in the browser"
- ✅ No compilation errors
- ✅ Accessible at http://localhost:3000

---

## 🔍 Verify Services

### Quick Check:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
./verify_services.sh
```

### Manual Check:
```bash
# Check processes
lsof -ti:8000 && echo "✅ Backend running" || echo "❌ Backend not running"
lsof -ti:3000 && echo "✅ Frontend running" || echo "❌ Frontend not running"

# Test endpoints
curl http://localhost:8000/docs | head -5
curl http://localhost:3000 | head -5
```

---

## 📊 Service URLs

Once started:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **API Schema:** http://localhost:8000/api/openapi.json

---

## ⚠️ If Services Don't Start

1. **Check configuration:**
   - Backend `.env` exists
   - Frontend `.env` exists (with `REACT_APP_BACKEND_URL=http://localhost:8000`)

2. **Stop existing services:**
   ```bash
   npm run kill:all
   ```

3. **Check for errors:**
   - Look at terminal output
   - Check browser console (F12)

4. **Try clean start:**
   ```bash
   ./clean-start.sh
   ```

---

## 📋 Pre-Startup Checklist

- [ ] Backend `.env` file exists
- [ ] Frontend `.env` file exists
- [ ] Ports 8000 and 3000 are available
- [ ] Dependencies installed (backend & frontend)
- [ ] Python 3.x installed
- [ ] Node.js installed

---

**Status:** Ready to start services cleanly! ✅
