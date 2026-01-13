# OdinRing Local Development Setup Guide

This guide will help you set up and run the OdinRing application locally on your machine.

## Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** and npm (for frontend)
- **MongoDB Atlas account** (free tier available) or local MongoDB instance
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd odinring-main-2
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip3 install -r requirements.txt
```

#### Create Backend Environment File

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cat > .env << EOF
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/odinring?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false
DB_NAME=odinring
JWT_SECRET=local-dev-secret-key-change-this-in-production-at-least-32-characters-long
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
EOF
```

**Important:** Replace the `MONGO_URL` with your actual MongoDB Atlas connection string.

#### Start Backend Server

```bash
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**
- API Documentation: http://localhost:8000/docs

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

**Note:** We use `--legacy-peer-deps` because some dependencies (like `react-day-picker`) have peer dependency conflicts with React 19.

#### Create Frontend Environment File

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
```

#### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will be available at: **http://localhost:3000**

## Environment Variables

### Backend (.env in `backend/` directory)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/odinring?retryWrites=true&w=majority` |
| `DB_NAME` | Database name | `odinring` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 characters) | `your-super-secure-secret-key` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://localhost:3001` |

### Frontend (.env in `frontend/` directory)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API URL | `http://localhost:8000` |

## Running Both Servers

### Option 1: Separate Terminal Windows

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

### Option 2: Background Processes

```bash
# Start backend in background
cd backend && python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000 &

# Start frontend in background
cd frontend && npm start &
```

## Verification

### Check Backend

1. Visit http://localhost:8000/docs - You should see the FastAPI documentation
2. Test an endpoint: `curl http://localhost:8000/api/auth/login`

### Check Frontend

1. Visit http://localhost:3000 - You should see the OdinRing application
2. Open browser console - No 404 errors for API calls
3. Try logging in - Authentication should work

## Common Issues & Solutions

### Issue 1: API 404 Error (`undefined/api/auth/login`)

**Problem:** Frontend cannot connect to backend.

**Solution:**
1. Verify `frontend/.env` exists with `REACT_APP_BACKEND_URL=http://localhost:8000`
2. Restart the frontend development server after creating/updating `.env`
3. Check that backend is running on port 8000

### Issue 2: CORS Errors

**Problem:** Browser blocks requests due to CORS policy.

**Solution:**
1. Ensure `CORS_ORIGINS` in `backend/.env` includes `http://localhost:3000`
2. Restart backend server after updating `.env`

### Issue 3: MongoDB Connection Error

**Problem:** Backend cannot connect to MongoDB.

**Solution:**
1. Verify `MONGO_URL` in `backend/.env` is correct
2. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0` (for development)
3. Verify database user credentials are correct

### Issue 4: Deprecated Meta Tag Warning

**Problem:** Browser console shows: `<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated`

**Solution:** ✅ Fixed - The `mobile-web-app-capable` meta tag has been added to `frontend/public/index.html`

### Issue 5: PWA Install Banner Warning

**Problem:** Browser console shows: `Banner not shown: beforeinstallpromptevent.preventDefault() called`

**Solution:** ✅ Fixed - Duplicate `beforeinstallprompt` handler removed from `mobileUtils.js`. The `usePWAInstall` hook now handles PWA installation properly.

### Issue 6: Peer Dependency Warnings

**Problem:** npm install shows peer dependency conflicts.

**Solution:** Use `npm install --legacy-peer-deps` to bypass peer dependency checks.

## Development Workflow

1. **Make code changes** - Both servers have auto-reload enabled
2. **Check console** - Monitor for errors in browser console and terminal
3. **Test features** - Verify changes work as expected
4. **Commit changes** - Use git to commit your work

## Project Structure

```
odinring-main-2/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables (create this)
├── frontend/
│   ├── src/              # React source code
│   ├── public/           # Static files
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment variables (create this)
└── README.md
```

## API Endpoints

Once the backend is running, you can access:

- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/health
- **Authentication:** http://localhost:8000/api/auth/login

## Next Steps

1. Set up MongoDB Atlas and update `MONGO_URL`
2. Create a test account to verify authentication
3. Explore the API documentation at http://localhost:8000/docs
4. Review the codebase structure

## Support

For deployment instructions, see:
- `DEPLOYMENT.md` - General deployment guide
- `RENDER_DEPLOYMENT.md` - Render-specific deployment
- `Vercel_Deployment.md` - Vercel-specific deployment

## System Status After Fixes

✅ **API 404 Error** - Fixed by creating `frontend/.env` with `REACT_APP_BACKEND_URL`
✅ **Deprecated Meta Tag** - Fixed by adding `mobile-web-app-capable` meta tag
✅ **PWA Install Banner** - Fixed by removing duplicate `beforeinstallprompt` handler
✅ **Environment Setup** - Both backend and frontend `.env` files created
✅ **Documentation** - Local setup guide created

All critical issues have been resolved. The application should now run smoothly in local development mode.

