# Starting OdinRing Services

## Quick Start

To start both backend and frontend services together:

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm start
```

This will start:
- **Backend** on `http://localhost:8000`
- **Frontend** on `http://localhost:3000`

---

## Individual Services

### Start Backend Only

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run start:backend
```

Or directly:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend Only

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run start:frontend
```

Or directly:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

---

## Separate Terminal Windows

To run services in separate terminal windows:

### Terminal 1 - Backend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2/frontend
npm start
```

---

## Stop Services

### Stop Both:
```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run kill:all
```

### Stop Backend Only:
```bash
npm run kill:backend
# Or: lsof -ti:8000 | xargs kill -9
```

### Stop Frontend Only:
```bash
npm run kill:frontend
# Or: lsof -ti:3000 | xargs kill -9
```

---

## Restart Services

```bash
cd /Users/sankarreddy/Desktop/odinring-main-2
npm run restart
```

This will kill all running services and restart them.

---

## Service URLs

Once started:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

---

## Prerequisites

Make sure you have:
- ✅ Python 3.x installed
- ✅ Node.js and npm installed
- ✅ Dependencies installed (`npm run install:all`)
- ✅ Environment variables configured (`.env` file in backend)
- ✅ Firebase credentials configured
