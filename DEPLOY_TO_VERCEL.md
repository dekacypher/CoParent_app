# Deploy to Vercel (Free, No Usage Limits)

## Why Vercel?
- ✅ Generous free tier
- ✅ No pausing due to "usage limits"
- ✅ Auto-deploys from GitHub
- ✅ Faster builds
- ✅ Better for React apps

## Quick Setup (3 minutes)

### Step 1: Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up (free)

### Step 2: Import Your Repository
1. Click "Add New Project"
2. Select "Import Git Repository"
3. Enter: `dekacypher/CoParent_app`
4. Click "Import"

### Step 5: Configure
- **Framework Preset**: Vite
- **Root Directory**: `.` (leave as is)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`

### Step 6: Deploy
Click "Deploy"

**Your site will be live at**: `https://coparent-app.vercel.app`

---

## Environment Variables

After creating the project, add these in Vercel:

1. Go to: https://vercel.com/deployments
2. Click on your project → Settings → Environment Variables
3. Add:

```
VITE_SUPABASE_URL=https://oydddblbkqokxkqghuwp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGRkYmxia3Fva3hrcWdodXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Njg0NDgsImV4cCI6MjA4NDA0NDQ0OH0.5DRAvHQZEs_JStplsrhDGiKnLG3voHnDFoK653jdYlw
```

---

## That's It!

After Vercel deploys:
1. Run the SQL from FULL_DIAGNOSIS.md to fix the database
2. Test at your new Vercel URL
3. Share the Vercel URL with your client

**No more pausing, no more usage limits!** 🚀
