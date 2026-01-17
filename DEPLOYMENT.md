# Deployment Guide for CoParent App

## Option 1: Deploy to Render.com (Recommended - Free Tier)

### Prerequisites:
1. Create a GitHub account (if you don't have one)
2. Push your code to GitHub

### Step-by-Step Instructions:

#### 1. Prepare Your Repository
```bash
cd /Users/dekahalane/Downloads/CoParent_app\ 2
git init
git add .
git commit -m "Initial commit for deployment"

# Create a new repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/CoParent_app.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Render

1. Go to [render.com](https://render.com)
2. Sign up / Log in
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: coparent-app
   - **Environment**: Node
   - **Branch**: main
   - **Root Directory**: ./
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `5001`
7. Click **"Deploy"**

#### 3. Set Up Persistent Disk (for SQLite Database)

1. Go to your deployed service
2. Click **"Advanced"** → **"Add Disk"**
3. Create a 1GB disk mounted to `/opt/render/project/data`
4. Update your code to use the persistent disk path for the database

#### 4. Get Your URL
Your app will be available at: `https://coparent-app.onrender.com`

---

## Option 2: Deploy to Railway.app

### Steps:
1. Go to [railway.app](https://railway.app)
2. Sign up / Log in
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will auto-detect it's a Node.js app
6. Click **"Deploy"**
7. Your app will be available at: `https://your-app.up.railway.app`

---

## Option 3: Frontend on Vercel + Backend on Render

### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will detect it's a Vite app
4. Configure root directory as `client`
5. Deploy!

### Backend (Render):
1. Deploy only the backend to Render
2. Update `client/src/lib/api.ts` to point to your backend URL:
```typescript
const API_BASE = "https://your-backend-url.onrender.com/api";
```

---

## Environment Variables Needed:

```env
NODE_ENV=production
PORT=5001
```

---

## Important Notes:

1. **SQLite Database**: For production, consider migrating to PostgreSQL for better reliability
2. **Authentication**: Make sure to set up proper session storage for production
3. **HTTPS**: All the mentioned platforms provide free SSL certificates
4. **Domain**: You can add a custom domain name in the platform settings

---

## Quick Start (Recommended for Testing):

**Use Render.com** - It's the easiest and most reliable for this type of app.

**Your live app URL will be**: `https://coparent-app.onrender.com` (or similar)
