-- Check what columns exist first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- If you have a 'date' column, we need to either:
-- 1. Use it instead of start_date/end_date, OR
-- 2. Migrate data from 'date' to start_date/end_date

-- Option 1: Add start_date and end_date with defaults from the date column
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT date;

-- Option 2: If the above doesn't work, let's just make the columns nullable
-- Run this only if the above fails:
-- ALTER TABLE events ALTER COLUMN start_date DROP NOT NULL;
-- ALTER TABLE events ALTER COLUMN end_date DROP NOT NULL;

-- Verify the columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('date', 'start_date', 'end_date');
