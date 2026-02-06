# Full Database Diagnosis & Fix

## Step 1: Check Your Table Structure

Go to: https://supabase.com/dashboard/project/oydddblbkqokxkqghuwp/sql

Run this to see what you actually have:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
```

**Copy and paste the results here so I can see what columns exist.**

---

## Step 2: Check Constraints

```sql
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'events'::regclass;
```

**Copy and paste the results here too.**

---

## Step 3: Check Recent Data (if any)

```sql
SELECT * FROM events ORDER BY id DESC LIMIT 5;
```

---

## Step 4: Test Insert Manually

Try inserting a test row directly in SQL:

```sql
INSERT INTO events (
  title, 
  start_date, 
  end_date, 
  start_time, 
  end_time, 
  time_zone, 
  parent, 
  type,
  date
) VALUES (
  'Test Activity',
  '2025-02-05',
  '2025-02-05',
  '09:00',
  '11:00',
  'Europe/Oslo',
  'A',
  'custody',
  '2025-02-05'
);
```

**Does this work?** If it gives an error, tell me the exact message.
