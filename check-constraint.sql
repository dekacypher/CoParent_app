-- Check what the type constraint allows
SELECT 
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'events_type_check';

-- Or check the constraint directly
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'events'::regclass
  AND contype = 'c';
