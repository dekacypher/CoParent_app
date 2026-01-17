# Quick Start: Deploy CoParent App to Supabase + Vercel

## Overview
- **Backend**: Supabase (PostgreSQL, Auth, Storage, APIs)
- **Frontend**: Vercel (React + Vite)
- **Cost**: FREE (up to 50k users)

---

## Step 1: Set Up Supabase (5 minutes)

### 1. Create Account
- Go to https://supabase.com
- Sign up with GitHub (easiest)

### 2. Create Project
- Click "New Project"
- Name: `CoParent App`
- Wait 2 minutes for setup

### 3. Create Database Tables
- Go to **SQL Editor** in left sidebar
- Copy the SQL script from `SUPABASE_DEPLOYMENT.md`
- Paste and click **"Run"**

### 4. Get API Keys
- Go to **Settings** → **API**
- Copy:
  - **Project URL** (e.g., `https://xxxxxxxx.supabase.co`)
  - **anon public** key (long string)

---

## Step 2: Install Supabase Client (1 minute)

```bash
npm install @supabase/supabase-js
```

---

## Step 3: Configure Environment Variables (2 minutes)

Create `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 1.

---

## Step 4: Update Code to Use Supabase

I've created `client/src/lib/supabase.ts` with helper functions. You can either:

**Option A**: Use the Supabase helpers directly in your components
```typescript
import { supabaseApi } from '@/lib/supabase'

// Get events
const { data: events } = await supabaseApi.getEvents()
```

**Option B**: Keep existing API structure, just change the backend calls to use Supabase

---

## Step 5: Deploy Frontend to Vercel (3 minutes)

### 1. Prepare GitHub
```bash
git init
git add .
git commit -m "Ready for Supabase deployment"
git remote add origin https://github.com/YOUR_USERNAME/CoParent_app.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./client`
   - **Override Build Command**: Empty (use default)
   - **Override Output Directory**: Empty (use default)
6. **Environment Variables**: Add your Supabase URL and key
7. Click **"Deploy"**

### 3. Get Your URL
Vercel will give you a URL like: `https://coparent-app.vercel.app`

---

## Step 6: Test Your Deployed App

1. Go to your Vercel URL
2. Register a new account (uses Supabase Auth)
3. Create events, add expenses, upload documents
4. Everything should work!

---

## What You Get:

✅ **Authentication**: Users can sign up/login
✅ **Database**: PostgreSQL with all your data
✅ **Storage**: File uploads for documents
✅ **API**: Auto-generated REST APIs
✅ **Real-time**: Can add real-time updates later
✅ **HTTPS**: Free SSL certificate
✅ **Custom Domain**: Add your own domain name

---

## Free Tier Limits:

- 500MB Database
- 1GB File Storage
- 50,000 Monthly Active Users
- 2GB Bandwidth/month

Should be plenty for a co-parenting app!

---

## Next Steps:

1. **Set up Supabase project**
2. **Run SQL script** (from SUPABASE_DEPLOYMENT.md)
3. **Install dependencies**: `npm install @supabase/supabase-js`
4. **Add environment variables**
5. **Deploy to Vercel**

---

## Need Help?

I can help you:
- Convert existing API calls to Supabase
- Set up authentication with Supabase
- Configure file storage for documents
- Add real-time updates
- Migrate your SQLite data

Just ask!
