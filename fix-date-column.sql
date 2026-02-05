-- Fix for the existing 'date' column issue

-- Step 1: Make the 'date' column nullable (so it doesn't block inserts)
ALTER TABLE events ALTER COLUMN date DROP NOT NULL;

-- Step 2: Set a default value for existing rows
UPDATE events SET date = start_date WHERE date IS NULL;
UPDATE events SET date = COALESCE(start_date, end_date, '2025-01-01') WHERE date IS NULL;

-- Step 3: Now add start_date and end_date columns if they don't exist
-- Using the date column as default
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT date;

-- Step 4: Make sure all required columns are present
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT '09:00';
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT DEFAULT '11:00';
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'Europe/Oslo';
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent TEXT DEFAULT 'A';
ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'activity';
ALTER TABLE events ADD COLUMN IF NOT EXISTS child_id INTEGER;

-- Step 5: Verify
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
