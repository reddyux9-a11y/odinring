# Service Health Check

**Date:** January 6, 2025  
**Purpose:** Verify all services are running correctly

---

## Pre-Startup Checks

### Environment
- ✅ Python 3.9.6 installed
- ✅ Node.js/npm installed
- ✅ .env file exists in backend
- ✅ Ports 8000 and 3000 are available

---

## Service Status

### Backend (FastAPI)
- **Port:** 8000
- **Status:** Checking...
- **URL:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Frontend (React)
- **Port:** 3000
- **Status:** Checking...
- **URL:** http://localhost:3000

---

## Startup Instructions

### Start Backend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

---

## Health Checks

### Backend Health:
```bash
curl http://localhost:8000/docs
curl http://localhost:8000/api/openapi.json
```

### Frontend Health:
```bash
curl http://localhost:3000
```

---

## Error Detection

Watch for these common errors:

### Backend:
- ❌ Import errors
- ❌ Firebase connection errors
- ❌ Port already in use (8000)
- ❌ Missing environment variables

### Frontend:
- ❌ Module not found errors
- ❌ Port already in use (3000)
- ❌ Compilation errors

---

## Verification Steps

1. Check services are running
2. Test API endpoints
3. Verify frontend loads
4. Check for errors in logs
5. Test authentication flow
