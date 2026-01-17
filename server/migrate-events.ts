import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrateEvents() {
  console.log("Starting events migration...");

  try {
    // Step 1: Create new table with updated schema
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS events_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        child_id INTEGER,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        start_time TEXT NOT NULL DEFAULT '00:00',
        end_time TEXT NOT NULL DEFAULT '23:59',
        time_zone TEXT NOT NULL DEFAULT 'UTC',
        parent TEXT NOT NULL,
        type TEXT NOT NULL,
        recurrence TEXT,
        recurrence_interval INTEGER DEFAULT 1,
        recurrence_end TEXT,
        recurrence_days TEXT,
        description TEXT,
        location TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (child_id) REFERENCES children(id) ON UPDATE no action ON DELETE no action
      )
    `);
    console.log("Created new events table");

    // Step 2: Migrate data from old table to new table
    await db.run(sql`
      INSERT INTO events_new (
        id, child_id, title, start_date, end_date,
        start_time, end_time, time_zone, parent, type,
        recurrence, recurrence_interval, recurrence_end, recurrence_days,
        description, location, created_at
      )
      SELECT
        id, child_id, title, date, date,
        '00:00', '23:59', 'UTC', parent, type,
        NULL, 1, NULL, NULL,
        description, location, created_at
      FROM events
    `);
    console.log("Migrated data from old table");

    // Step 3: Drop old table
    await db.run(sql`DROP TABLE events`);
    console.log("Dropped old events table");

    // Step 4: Rename new table to events
    await db.run(sql`ALTER TABLE events_new RENAME TO events`);
    console.log("Renamed events_new to events");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateEvents().then(() => process.exit(0));
