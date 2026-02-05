-- Add missing columns to the events table (without dropping anything)

-- First, let's add columns that might be missing
-- We use IF NOT EXISTS approach by checking if the column exists first

-- Add missing columns one by one
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT;
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

-- If you have columns with camelCase names (startDate, endDate, etc.),
-- we can rename them to snake_case:

-- Uncomment these if you have camelCase columns that need renaming:
-- ALTER TABLE events RENAME COLUMN startDate TO start_date;
-- ALTER TABLE events RENAME COLUMN endDate TO end_date;
-- ALTER TABLE events RENAME COLUMN startTime TO start_time;
-- ALTER TABLE events RENAME COLUMN endTime TO end_time;
-- ALTER TABLE events RENAME COLUMN timeZone TO time_zone;
-- ALTER TABLE events RENAME COLUMN recurrenceInterval TO recurrence_interval;
-- ALTER TABLE events RENAME COLUMN recurrenceEnd TO recurrence_end;
-- ALTER TABLE events RENAME COLUMN recurrenceDays TO recurrence_days;
