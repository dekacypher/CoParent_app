-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'parentA', -- 'parentA' or 'parentB'
  parent_a_name TEXT NOT NULL DEFAULT 'Parent A',
  parent_b_name TEXT NOT NULL DEFAULT 'Parent B',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT,
  interests TEXT NOT NULL DEFAULT '[]', -- JSON array stored as text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
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
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  age_range TEXT NOT NULL,
  duration TEXT NOT NULL,
  image TEXT,
  description TEXT NOT NULL,
  season TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  relation TEXT NOT NULL,
  kids TEXT NOT NULL DEFAULT '[]', -- JSON array stored as text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social events table
CREATE TABLE IF NOT EXISTS social_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  friend_id INTEGER REFERENCES friends(id) ON DELETE SET NULL,
  description TEXT,
  rsvp_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading list table
CREATE TABLE IF NOT EXISTS reading_list (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
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
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  content_hash TEXT NOT NULL,
  sender_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE NULL,
  child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  shared_with TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For now, allow public access to children, events, activities (you can restrict later)
CREATE POLICY "Enable read access for all users" ON children
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON children
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON children
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON children
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON events
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON events
  FOR DELETE USING (true);

-- Similar policies for other tables
CREATE POLICY "Enable all access for activities" ON activities
  FOR ALL USING (true);

CREATE POLICY "Enable all access for friends" ON friends
  FOR ALL USING (true);

CREATE POLICY "Enable all access for social_events" ON social_events
  FOR ALL USING (true);

CREATE POLICY "Enable all access for reading_list" ON reading_list
  FOR ALL USING (true);

CREATE POLICY "Enable all access for school_tasks" ON school_tasks
  FOR ALL USING (true);

CREATE POLICY "Enable all access for handover_notes" ON handover_notes
  FOR ALL USING (true);

CREATE POLICY "Enable all access for expenses" ON expenses
  FOR ALL USING (true);

CREATE POLICY "Enable all access for messages" ON messages
  FOR ALL USING (true);

CREATE POLICY "Enable all access for documents" ON documents
  FOR ALL USING (true);

-- Create a storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
CREATE POLICY "Anyone can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Anyone can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');
