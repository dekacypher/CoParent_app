-- First, drop the existing events table if it exists
DROP TABLE IF EXISTS events CASCADE;

-- Now create the events table with the correct schema
CREATE TABLE events (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  child_id INTEGER,
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

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow all operations (for demo purposes)
CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_child_id ON events(child_id);
