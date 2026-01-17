-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text NOT NULL UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL; -- 'parentA' or 'parentB'
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now() NOT NULL;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id serial PRIMARY KEY,
  child_id integer NOT NULL REFERENCES children(id),
  title text NOT NULL,
  amount integer NOT NULL, -- Store as cents to avoid decimal issues
  category text NOT NULL, -- 'medical', 'education', 'activities', 'clothing', 'food', 'other'
  paid_by text NOT NULL, -- 'parentA' or 'parentB'
  split_percentage integer NOT NULL DEFAULT 50, -- Default 50/50 split
  date date NOT NULL,
  receipt text, -- URL to receipt image/document
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'reimbursed'
  notes text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Create index on expenses for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_child_id ON expenses(child_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
