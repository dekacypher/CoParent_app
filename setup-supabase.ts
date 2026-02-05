import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oydddblbkqokxkqghuwp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZGRkYmxia3Fva3hrcWdodXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Njg0NDgsImV4cCI6MjA4NDA0NDQ0OH0.5DRAvHQZEs_JStplsrhDGiKnLG3voHnDFoK653jdYlw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  // Create events table using RPC
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS events (
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
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    console.log('\n⚠️  Please manually run the SQL in supabase-setup.sql in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/oydddblbkqokxkqghuwp/sql');
  } else {
    console.log('✅ Events table created successfully!');
  }
}

setupDatabase();
