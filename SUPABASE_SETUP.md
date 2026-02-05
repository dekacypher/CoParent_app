# Supabase Database Setup Instructions

## ⚠️ IMPORTANT: READ THIS FIRST

Your Supabase database has incorrect table schemas. This will **DELETE ALL EXISTING DATA** and recreate the tables correctly.

## Quick Setup (2 Minutes)

### Step 1: Open Supabase SQL Editor

Click this link: https://supabase.com/dashboard/project/oydddblbkqokxkqghuwp/sql

### Step 2: Copy & Paste the SQL Below

**Click "Run"** after pasting:

```sql
-- ============================================
-- CoParent App - Complete Supabase Database Setup
-- ============================================
-- DROP all existing tables
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- PROFILES TABLE
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  username TEXT,
  role TEXT NOT NULL DEFAULT 'parent',
  parent_a_name TEXT NOT NULL DEFAULT 'Parent A',
  parent_b_name TEXT NOT NULL DEFAULT 'Parent B',
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- CHILDREN TABLE
CREATE TABLE children (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  interests TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for children" ON children FOR ALL USING (true) WITH CHECK (true);

-- EVENTS TABLE (This is the one that's broken!)
CREATE TABLE events (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  time_zone TEXT NOT NULL DEFAULT 'Europe/Oslo',
  parent TEXT NOT NULL DEFAULT 'A',
  type TEXT NOT NULL DEFAULT 'activity',
  description TEXT,
  location TEXT,
  recurrence TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end TEXT,
  recurrence_days TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_events_start_date ON events(start_date);

-- FRIENDS TABLE
CREATE TABLE friends (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  relation TEXT NOT NULL,
  kids TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for friends" ON friends FOR ALL USING (true) WITH CHECK (true);

-- EXPENSES TABLE
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  split_percentage REAL DEFAULT 50,
  date TEXT NOT NULL,
  receipt TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_expenses_child_id ON expenses(child_id);

-- MESSAGES TABLE
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  content_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- DOCUMENTS TABLE
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  uploaded_by TEXT NOT NULL,
  tags TEXT,
  shared_with TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for documents" ON documents FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Verify

1. Click "Table Editor" in the left sidebar
2. You should see all tables: `profiles`, `children`, `events`, `friends`, `expenses`, `messages`, `documents`
3. Click on `events` and verify it has columns: `id`, `child_id`, `title`, `start_date`, `end_date`, etc.

### Step 4: Test

1. Go to https://coparent-app.netlify.app/activities
2. Click "Add to Plan" on any activity
3. Fill in the date and time
4. Click "Add to Calendar"

**It should work now!** 🎉

---

## What Was Wrong?

The `events` table existed but had wrong column names (like `startDate` instead of `start_date`). The app uses snake_case but the table had camelCase columns.

Running the SQL above fixes everything by recreating all tables with the correct schema.
