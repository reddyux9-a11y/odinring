# OdinRing Deployment Guide

## Prerequisites
1. MongoDB Atlas account (free tier available)
2. Vercel account (free tier available)
3. Render account (free tier available)
4. GitHub repository with your code

## Step 1: Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)

2. Create a free cluster
3. Create a database user
4. Get your connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 2: Deploy Backend to Render

1. Go to [Render](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `odinring-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. Set Environment Variables:
   - `MONGO_URL`: Your MongoDB Atlas connection string
   - `DB_NAME`: `odinring`
   - `JWT_SECRET`: Generate a secure random string
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app` (update after frontend deployment)

6. Deploy and note your backend URL (e.g., `https://odinring-backend.onrender.com`)

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign up
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. Set Environment Variables:
   - `REACT_APP_BACKEND_URL`: Your Render backend URL (e.g., `https://odinring-backend.onrender.com`)

6. Deploy and note your frontend URL (e.g., `https://odinring.vercel.app`)

## Step 4: Update CORS Origins

1. Go back to Render dashboard
2. Update the `CORS_ORIGINS` environment variable:
   - Add your Vercel frontend URL
   - Example: `https://odinring.vercel.app,https://odinring-git-main.vercel.app`

3. Redeploy the backend service

## Step 5: Test Your Deployment

1. Visit your Vercel frontend URL
2. Try creating an account and logging in
3. Test all major features

## Environment Variables Summary

### Backend (Render)
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=odinring
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGINS=https://your-frontend-domain.vercel.app
```

### Frontend (Vercel)
```
REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com
```

## Troubleshooting

1. **CORS Errors**: Make sure CORS_ORIGINS includes your exact Vercel domain
2. **Database Connection**: Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
3. **Build Errors**: Check that all dependencies are in requirements.txt
4. **Environment Variables**: Ensure all required variables are set in both platforms

## Security Notes

1. Use strong, unique JWT secrets
2. Limit CORS origins to your actual domains
3. Use MongoDB Atlas security features
4. Consider using environment-specific configurations
