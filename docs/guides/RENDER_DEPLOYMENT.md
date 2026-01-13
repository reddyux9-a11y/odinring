# Render Deployment Guide for OdinRing

## Your Current Folder Structure
```
odinring/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── requirements.txt   # Python dependencies
│   ├── render.yaml       # Render configuration
│   └── .env              # Local environment variables
├── frontend/
│   ├── package.json      # Node.js dependencies
│   ├── src/              # React source code
│   └── .env              # Frontend environment variables
└── README.md
```

## Step-by-Step Render Deployment

### Step 1: Prepare Your Repository
1. Make sure all your code is committed to GitHub
2. Your repository should have this exact structure
3. The `backend/` folder contains your Python FastAPI app

### Step 2: Deploy Backend to Render

#### Option A: Using Render Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the Service**
   ```
   Name: odinring-backend
   Environment: Python 3
   Region: Oregon (US West) or Frankfurt (EU)
   Branch: main (or your main branch)
   Root Directory: backend
   ```

4. **Build & Deploy Settings**
   ```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

5. **Set Environment Variables**
   Click "Advanced" → "Environment Variables" and add:
   ```
   MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   DB_NAME = odinring
   JWT_SECRET = your-super-secure-jwt-secret-key-here
   CORS_ORIGINS = https://your-frontend-domain.vercel.app
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://odinring-backend.onrender.com`

#### Option B: Using render.yaml (Alternative)

1. **Push render.yaml to your repository**
   - The file is already created in `backend/render.yaml`
   - Commit and push to GitHub

2. **Deploy via Render Dashboard**
   - Render will automatically detect the `render.yaml` file
   - Follow the same steps but Render will use the YAML configuration

### Step 3: Verify Backend Deployment

1. **Check Deployment Logs**
   - Go to your service dashboard
   - Click "Logs" tab
   - Look for "Application startup complete"

2. **Test Your API**
   - Visit: `https://your-backend-url.onrender.com/docs`
   - You should see FastAPI documentation
   - Test endpoints if needed

### Step 4: Common Issues & Solutions

#### Issue 1: Build Fails
**Solution:**
- Check `requirements.txt` has all dependencies
- Ensure Python version compatibility
- Check build logs for specific errors

#### Issue 2: Application Won't Start
**Solution:**
- Verify start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Check environment variables are set correctly
- Look at runtime logs

#### Issue 3: Database Connection Issues
**Solution:**
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0)
- Ensure database user has proper permissions

#### Issue 4: CORS Errors
**Solution:**
- Update `CORS_ORIGINS` with your frontend domain
- Use exact domain (no trailing slash)
- Include both `https://domain.vercel.app` and `https://domain-git-main.vercel.app`

### Step 5: Environment Variables Reference

#### Required Variables:
```
MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME = odinring
JWT_SECRET = generate-a-secure-random-string-here
CORS_ORIGINS = https://your-frontend-domain.vercel.app
```

#### Optional Variables:
```
PYTHON_VERSION = 3.11.0
```

### Step 6: After Backend Deployment

1. **Note your backend URL**
   - Example: `https://odinring-backend.onrender.com`

2. **Update Frontend Environment**
   - Set `REACT_APP_BACKEND_URL` to your backend URL

3. **Deploy Frontend to Vercel**
   - Follow the Vercel deployment guide

4. **Update CORS Origins**
   - Go back to Render dashboard
   - Update `CORS_ORIGINS` with your Vercel frontend URL
   - Redeploy backend

### Step 7: Monitoring & Maintenance

1. **Check Logs Regularly**
   - Monitor application logs for errors
   - Check build logs for deployment issues

2. **Environment Variables**
   - Keep secrets secure
   - Use different JWT secrets for different environments

3. **Database**
   - Monitor MongoDB Atlas usage
   - Set up alerts for connection issues

## Quick Commands Reference

### Local Testing:
```bash
# Backend
cd backend
source ../.venv/bin/activate
uvicorn server:app --reload

# Frontend
cd frontend
npm start
```

### Production URLs:
- Backend: `https://odinring-backend.onrender.com`
- Frontend: `https://odinring.vercel.app`
- API Docs: `https://odinring-backend.onrender.com/docs`

## Support
- Render Documentation: https://render.com/docs
- FastAPI Documentation: https://fastapi.tiangolo.com/
- MongoDB Atlas: https://docs.atlas.mongodb.com/
