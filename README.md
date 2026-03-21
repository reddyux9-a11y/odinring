# OdinRing - NFC Ring-Powered Digital Identity Platform

Premium digital identity platform powered by NFC technology. Create your personalized link-in-bio page and connect it to your smart NFC ring.

## 🚀 Quick Start

**New to OdinRing?** Start here: [`docs/current/SETUP_GUIDE.md`](docs/current/SETUP_GUIDE.md)

```bash
# Quick setup
cd frontend && npm install --legacy-peer-deps
cd ../backend && pip install -r requirements.txt
```

## ✨ Features

- 🔗 **Link Management** - Beautiful, customizable link-in-bio pages
- 📱 **PWA Support** - Install as a mobile/desktop app
- 💍 **NFC Integration** - Connect your smart NFC ring
- 🎨 **Custom Themes** - Personalize your profile
- 📊 **Analytics** - Track link clicks and engagement
- 🔐 **Secure Auth** - Google OAuth + Email/Password
- 🌐 **Public Profiles** - Share your unique link

## 🏗️ Tech Stack

- **Frontend**: React 18, TailwindCSS, PWA
- **Backend**: FastAPI (Python)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication + JWT
- **Hosting**: Vercel (Frontend) + Render (Backend)

## 📚 Documentation

### Getting Started
- [**Setup Guide**](docs/current/SETUP_GUIDE.md) - Complete setup instructions
- [**Architecture**](docs/current/ARCHITECTURE.md) - System overview
- [**Development Guide**](docs/guides/DEVELOPMENT.md) - Local development

### Features
- [**Authentication**](docs/current/AUTHENTICATION.md) - Auth system details
- [**PWA**](docs/current/PWA.md) - Progressive Web App features

### Deployment
- [**Deployment Guide**](docs/guides/DEPLOYMENT.md) - Production deployment
- [**Troubleshooting**](docs/guides/TROUBLESHOOTING.md) - Common issues

### Legacy
- [**Legacy Docs**](docs/legacy/) - Historical documentation

## 🔐 Security

**⚠️ CRITICAL: DO NOT COMMIT SECRETS**

This repository uses pre-commit hooks to prevent committing credentials. See [SECURITY.md](SECURITY.md) for complete security guidelines.

### Quick Security Rules:
- ✅ Use environment variables for secrets (production)
- ✅ Use `.env` files locally (already in `.gitignore`)
- ❌ Never commit `firebase-service-account.json` or `.env` files
- 🔄 Rotate keys immediately if they were ever in git history

**See [SECURITY.md](SECURITY.md) for complete security guidelines.**

---

## 🛠️ Development

### Prerequisites
- Node.js 16+
- Python 3.9+
- Firebase account

### Pre-Commit Hook Setup

**One-time setup to enable secret detection:**
```bash
chmod +x .git/hooks/pre-commit
```

The pre-commit hook will now automatically scan staged files for secrets before each commit.

### Local Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn server:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

### Environment Variables

Create `.env` files:
- `backend/.env` - Firebase credentials, JWT secret
- `frontend/.env` - Backend URL, Firebase config

See [Setup Guide](docs/current/SETUP_GUIDE.md) for details.

## 📦 Project Structure

```
odinring-main-2/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── docs/            # Documentation
│   ├── current/     # Active docs
│   ├── guides/      # How-to guides
│   └── legacy/      # Historical docs
└── README.md
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📊 API Documentation

Once running, visit:
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000

## 📝 License

[MIT License](LICENSE)

---

**Version:** 2.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 23, 2025

🔥 Built with passion for seamless digital identity management.
