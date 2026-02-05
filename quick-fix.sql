-- Quick fix for events table - handles both camelCase and snake_case

-- First, rename common camelCase columns to snake_case
ALTER TABLE events RENAME COLUMN IF EXISTS startDate TO start_date;
ALTER TABLE events RENAME COLUMN IF EXISTS endDate TO end_date;
ALTER TABLE events RENAME COLUMN IF EXISTS startTime TO start_time;
ALTER TABLE events RENAME COLUMN IF EXISTS endTime TO end_time;
ALTER TABLE events RENAME COLUMN IF EXISTS timeZone TO time_zone;
ALTER TABLE events RENAME COLUMN IF EXISTS recurrenceInterval TO recurrence_interval;
ALTER TABLE events RENAME COLUMN IF EXISTS recurrenceEnd TO recurrence_end;
ALTER TABLE events RENAME COLUMN IF EXISTS recurrenceDays TO recurrence_days;

-- Add any missing columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'Europe/Oslo';
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent TEXT DEFAULT 'A';
ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'activity';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_days TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT (datetime('now'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS child_id INTEGER;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for events" ON events;
CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
