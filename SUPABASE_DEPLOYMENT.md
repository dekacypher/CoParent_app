# Deployment Guide: Supabase

## Why Supabase for CoParent App?

- **Free Tier**: 500MB database, 1GB file storage, 50k MAU
- **PostgreSQL**: Production-ready database
- **Authentication**: Built-in user management
- **Storage**: Perfect for documents, receipts, photos
- **Real-time**: Great for collaborative features
- **API**: Auto-generated REST & GraphQL APIs

---

## Step-by-Step Deployment

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in with GitHub
3. Click **"New Project"**
4. Configure:
   - **Name**: `CoParent App`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Set Up Database Tables

Go to your project → **SQL Editor** and run this script:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'parentA', -- 'parentA' or 'parentB'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  interests JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT NOT NULL DEFAULT '00:00',
  end_time TEXT NOT NULL DEFAULT '23:59',
  time_zone TEXT NOT NULL DEFAULT 'UTC',
  parent TEXT NOT NULL,
  type TEXT NOT NULL,
  recurrence TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end TEXT,
  recurrence_days TEXT,
  description TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  age_range TEXT,
  duration TEXT,
  description TEXT,
  image TEXT,
  season TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relationship TEXT,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social events table
CREATE TABLE IF NOT EXISTS social_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  friend_id INTEGER REFERENCES friends(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading list table
CREATE TABLE IF NOT EXISTS reading_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  assigned_to TEXT NOT NULL,
  cover TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- School tasks table
CREATE TABLE IF NOT EXISTS school_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  platform TEXT DEFAULT 'Fridge Skole',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handover notes table
CREATE TABLE IF NOT EXISTS handover_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Stored in cents
  category TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  split_percentage INTEGER DEFAULT 50,
  date TEXT NOT NULL,
  receipt TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tags JSONB,
  shared_with JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- For now, allow public access (you can restrict later)
ALTER TABLE children DROP CONSTRAINT IF EXISTS children_owner_fkey;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_owner_fkey;
```

### Step 3: Set Up Authentication

1. Go to **Authentication** → **Users**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Add your site URL (e.g., `https://your-project.supabase.co`)

### Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 5: Create Supabase Configuration

Create `client/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Step 6: Add Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 7: Deploy Frontend

Option A: **Vercel** (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables
4. Deploy!

Option B: **Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Add your site from Git
3. Add environment variables
4. Deploy!

---

## Migration Checklist

- [ ] Create Supabase project
- [ ] Run SQL script to create tables
- [ ] Set up authentication
- [ ] Install Supabase client
- [ ] Update API calls to use Supabase
- [ ] Test locally with Supabase
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain (optional)

---

## Data Migration from SQLite

If you need to migrate existing data:

```bash
# Export SQLite data
sqlite3 data.db .dump > backup.sql

# Import to Supabase
# Run the SQL in Supabase SQL Editor
```

---

## Benefits Over SQLite

| Feature | SQLite | Supabase (PostgreSQL) |
|---------|---------|----------------------|
| Scaling | ❌ Single file only | ✅ Horizontal scaling |
| Concurrent users | ❌ Limited | ✅ Thousands |
| Authentication | ❌ Manual | ✅ Built-in |
| Real-time | ❌ Manual | ✅ Built-in |
| File storage | ❌ Manual | ✅ Built-in |
| Backups | ❌ Manual | ✅ Automatic |
| API generation | ❌ Manual | ✅ Auto-generated |

---

## Your Supabase URLs

After deployment:
- **API URL**: `https://your-project-ref.supabase.co`
- **Studio**: `https://app.supabase.com/project/your-project-ref`
- **Dashboard**: Monitor database, auth, and storage

---

## Cost

**Free Tier Includes:**
- 500MB Database
- 1GB File Storage
- 50,000 Monthly Active Users
- 2GB Bandwidth/month
- Unlimited API requests

**Pro Tier** (starts at $25/month):
- 8GB Database
- 100GB File Storage
- 100k MAU
- 50GB Bandwidth/month

---

## Next Steps

1. Create your Supabase account
2. Set up the database
3. I'll help you migrate the code

Would you like me to create the Supabase integration code for your app?
