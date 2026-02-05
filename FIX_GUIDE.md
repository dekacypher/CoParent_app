# Fix Calendar Error Without Dropping Tables

## Step 1: Check What Columns Exist

Go to: https://supabase.com/dashboard/project/oydddblbkqokxkqghuwp/sql

Run this to see your current table structure:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
```

Look at the column names - are they `startDate`, `endDate` (camelCase) or `start_date`, `end_date` (snake_case)?

---

## Step 2A: If Columns Are camelCase (startDate, endDate, etc.)

Run this to rename them:

```sql
ALTER TABLE events RENAME COLUMN startDate TO start_date;
ALTER TABLE events RENAME COLUMN endDate TO end_date;
ALTER TABLE events RENAME COLUMN startTime TO start_time;
ALTER TABLE events RENAME COLUMN endTime TO end_time;
ALTER TABLE events RENAME COLUMN timeZone TO time_zone;
ALTER TABLE events RENAME COLUMN recurrenceInterval TO recurrence_interval;
ALTER TABLE events RENAME COLUMN recurrenceEnd TO recurrence_end;
ALTER TABLE events RENAME COLUMN recurrenceDays TO recurrence_days;
```

Then run this to add any missing columns:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'Europe/Oslo';
ALTER TABLE events ADD COLUMN IF NOT EXISTS parent TEXT DEFAULT 'A';
ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'activity';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_days TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS child_id INTEGER;
```

---

## Step 2B: If Columns Are Already snake_case

Just run this to add any missing columns:

```sql
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
```

---

## Step 3: Enable Row Level Security

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for events" ON events
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## Step 4: Test

Go to https://coparent-app.netlify.app/activities and try adding an activity!

---

## Still Not Working?

Tell me what columns you see in Step 1 and I'll give you the exact SQL to run.
