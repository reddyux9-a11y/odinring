# Getting Started with OdinRing

Welcome to OdinRing! This guide will help you get started with the NFC Ring-Powered Digital Identity Platform.

## 🎯 What is OdinRing?

OdinRing is a premium digital identity platform that allows users to create personalized link-in-bio pages and connect them to NFC-enabled rings. Share all your important links in one beautiful, customizable profile.

### Key Features

- 🔗 **Link Management** - Create and organize your links with drag-and-drop
- 💍 **NFC Ring Integration** - Connect your NFC ring for instant profile access
- 🎨 **Custom Branding** - Personalize your profile with themes, colors, and logos
- 📊 **Analytics** - Track profile visits and link clicks
- 🔐 **Secure Authentication** - JWT-based authentication with refresh tokens
- 📱 **Mobile-First** - Responsive design with PWA support
- 🌐 **Public Profiles** - Share your unique profile URL

## 🚀 Quick Start (5 Minutes)

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 16+ installed
- **Python** 3.9+ installed
- **npm** or **yarn** package manager
- **Firebase** account (for database)
- **Git** (optional, for cloning)

### Step 1: Clone or Download

```bash
# If using Git
git clone <repository-url>
cd odinring-main-2

# Or download and extract the zip file
```

### Step 2: Install Backend Dependencies

```bash
cd backend
pip3 install -r requirements.txt
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install --legacy-peer-deps
```

### Step 4: Set Up Environment Variables

#### Backend (`.env` in `backend/` directory)

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=path/to/service-account-key.json

# JWT Configuration
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_ALGORITHM=HS256

# Application
ENV=development
API_URL=http://localhost:8000

# Optional: NFC Security
NFC_SECRET_KEY=your-nfc-secret-key

# Optional: Privacy & GDPR
DATA_RETENTION_DAYS=90
AUDIT_LOG_RETENTION_DAYS=180
```

#### Frontend (`.env` in `frontend/` directory)

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### Step 5: Start the Development Server

#### Terminal 1: Backend

```bash
cd backend
python3 -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
API documentation at: `http://localhost:8000/api/docs`

#### Terminal 2: Frontend

```bash
cd frontend
npm start
```

The frontend will open automatically at: `http://localhost:3000`

## ✅ Verify Installation

1. **Backend**: Visit `http://localhost:8000/api/docs` - You should see the Swagger API documentation
2. **Frontend**: Visit `http://localhost:3000` - You should see the OdinRing landing page
3. **Registration**: Try creating an account to verify the backend connection

## 🎓 Next Steps

Now that you're up and running:

1. **[Read the Installation Guide](installation/INSTALLATION.md)** - Complete setup instructions
2. **[Configure Your Environment](configuration/CONFIGURATION.md)** - Detailed configuration
3. **[Explore the Architecture](architecture/ARCHITECTURE.md)** - Understand the system design
4. **[Review the API Documentation](api/API_OVERVIEW.md)** - Learn about available endpoints

## 📚 Common First Tasks

### Create Your First Profile

1. Register a new account at `http://localhost:3000/auth`
2. Complete your profile information
3. Add your first link
4. Customize your profile theme

### Connect an NFC Ring

1. Navigate to Settings → Ring Management
2. Follow the ring pairing instructions
3. Test your ring connection

### Explore Features

- Customize your profile with themes and colors
- Add multiple links and organize them
- View analytics for your profile
- Generate QR codes for your profile

## 🆘 Need Help?

- **Installation Issues**: See [Troubleshooting Guide](troubleshooting/TROUBLESHOOTING.md)
- **Configuration Problems**: See [Configuration Guide](configuration/CONFIGURATION.md)
- **API Questions**: See [API Reference](api/API_REFERENCE.md)
- **General Questions**: See [FAQ](user-guide/FAQ.md)

## 🔗 Additional Resources

- [Development Guide](development/DEVELOPMENT.md) - For contributors
- [Security Overview](security/SECURITY_OVERVIEW.md) - Security features
- [Deployment Guide](deployment/DEPLOYMENT.md) - Production deployment

---

**Ready to build?** Continue to the [Installation Guide](installation/INSTALLATION.md) for detailed setup instructions.

