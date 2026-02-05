# CoParent App Deployment Guide

This guide covers deploying the CoParent application with separate frontend and backend deployments.

## Architecture Overview

The CoParent app consists of:
- **Frontend**: React + Vite application
- **Backend**: Express.js API server
- **Database**: SQLite (development) / PostgreSQL (production via Supabase)
- **Authentication**: Supabase Auth + JWT sessions

## Deployment Strategy

### Option 1: Netlify Frontend + Render Backend (Recommended)

This option provides free hosting tiers and easy setup.

#### Frontend (Netlify)

1. **Prepare for Deployment**:
   ```bash
   # Build the application locally first
   npm run build
   ```

2. **Create Netlify Account**:
   - Go to [netlify.com](https://www.netlify.com/) and sign up
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Authenticate: `netlify login`

3. **Deploy to Netlify**:
   ```bash
   # Deploy from the project root
   netlify deploy --prod

   # Or connect to Git repository (recommended)
   # 1. Push code to GitHub
   # 2. In Netlify dashboard: "New site from Git"
   # 3. Select your repository
   # 4. Configure build settings:
   #    - Build command: cd client && npm install && npm run build
   #    - Publish directory: dist/public
   ```

4. **Configure Environment Variables in Netlify**:
   ```
   VITE_SUPABASE_URL=your-production-supabase-url
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

5. **Configure API Proxy**:
   Update `netlify.toml` with your backend URL:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend-url.onrender.com/api/:splat"
     status = 200
     force = true
   ```

#### Backend (Render)

1. **Create Render Account**:
   - Go to [render.com](https://render.com/) and sign up

2. **Deploy to Render**:
   - Push code to GitHub
   - In Render dashboard: "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment Variables** (see below)

3. **Configure Environment Variables on Render**:
   ```
   NODE_ENV=production
   PORT=5001
   SESSION_SECRET=your-random-secret-string-here
   DATABASE_URL=postgresql://user:pass@host:port/database
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
   ```

4. **Run Database Migrations**:
   - Access Render shell after deployment
   - Run: `npx drizzle-kit push`
   - Run: `npx tsx server/seed-simple.ts`

## Environment Variables Configuration

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Backend Configuration (Render/Railway only)
NODE_ENV=production
PORT=5001
SESSION_SECRET=generate-a-random-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# CORS (add your frontend domain)
ALLOWED_ORIGINS=https://your-site.netlify.app,https://your-site.vercel.app

# Optional: Disable rate limiting in development
RATE_LIMIT_DISABLED=false
```

### Generate SESSION_SECRET

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

### Production (PostgreSQL on Supabase)

1. **Database is created automatically** in Supabase
2. **Run migrations**:
   ```bash
   # Set DATABASE_URL to production database
   npx drizzle-kit push
   ```

3. **Seed database** (optional):
   ```bash
   npx tsx server/seed-simple.ts
   ```

## Security Configuration

### Google Cloud Console

1. Add production domain to authorized origins:
   ```
   https://your-site.netlify.app
   https://your-site.vercel.app
   ```

2. Update Supabase Google provider with production Client ID

### Supabase Configuration

1. Enable Google provider in production
2. Update Site URL in Supabase Dashboard
3. Configure email templates if needed

### CORS Configuration

Update `ALLOWED_ORIGINS` to include all your domains:
```
https://your-site.netlify.app,https://your-site.vercel.app,https://your-custom-domain.com
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and API responding
- [ ] Database connected and seeded
- [ ] Environment variables configured
- [ ] Google OAuth working
- [ ] Supabase connection working
- [ ] CORS configured correctly
- [ ] Custom domain (optional)
- [ ] SSL/HTTPS enabled (automatic on Netlify/Render/Vercel)
- [ ] Test all features:
  - [ ] User registration
  - [ ] User login
  - [ ] Calendar events
  - [ ] All API endpoints

## Troubleshooting

### API Requests Failing

1. Check CORS configuration
2. Verify environment variables on backend
3. Check backend logs for errors

### Google OAuth Not Working

1. Verify authorized origins in Google Cloud Console
2. Check Google Client ID in environment variables
3. Ensure Supabase Google provider is enabled

### Build Failures

1. Check build logs for errors
2. Verify Node.js version matches package.json
3. Clear cache and rebuild

## Cost Estimates

### Free Tier Options:
- **Netlify**: 100GB bandwidth/month
- **Render**: Free tier with limited hours (750 hours/month)
- **Supabase**: 500MB database, 1GB bandwidth

### Paid Tier (if needed):
- **Render**: ~$7-20/month for web service
- **Supabase Pro**: ~$25/month

## Quick Start (Recommended for Testing):

**Use Netlify (frontend) + Render (backend)**

1. Deploy backend to Render first
2. Get backend URL
3. Update `netlify.toml` with backend URL
4. Deploy frontend to Netlify
5. Configure environment variables on both platforms
